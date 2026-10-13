import jwt from "jsonwebtoken";
import { OptionType } from "@prisma/client";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { getNextTask } from "../src/db";
import { quotedPriceFor } from "../src/economics";
import { createTaskSchema } from "../src/types";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedActor(role: "user" | "worker") {
  const address = `Phase9${role}${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44);
  if (role === "user") {
    return prismaClient.user.create({ data: { address } });
  }
  return prismaClient.worker.create({
    data: { address, pending_amount: 0, locked_amount: 0 },
  });
}

function userToken(user: { id: number; address: string }) {
  return jwt.sign(
    { id: user.id, address: user.address },
    env.JWT_SECRET,
    { expiresIn: "24h" },
  );
}

function workerToken(worker: { id: number; address: string }) {
  return jwt.sign(
    { id: worker.id, address: worker.address },
    env.WORKER_JWT_SECRET,
    { expiresIn: "24h" },
  );
}

async function authed(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API}/api/v1/user${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json() as Record<string, unknown>;
  return { status: res.status, body };
}

async function main() {
  const creator = await seedActor("user");
  const worker = await seedActor("worker");
  const token = userToken(creator);
  const wToken = workerToken(worker);

  const captionPost = await authed("/task", token, {
    method: "POST",
    body: JSON.stringify({
      optionType: "text",
      options: [
        { content: "I tried the viral hack. Here's what happened." },
        { content: "Stop scrolling. This one actually works." },
      ],
      title: "caption should be rejected",
      signature: `p9-text-${stamp}`,
      requiredSubmissions: 1,
    }),
  });
  assert(captionPost.status === 400, `caption create should be 400, got ${captionPost.status}`);

  const imageWithCopy = await authed("/task", token, {
    method: "POST",
    body: JSON.stringify({
      options: [
        { imageUrl: "https://example.com/a.png", content: "not allowed" },
        { imageUrl: "https://example.com/b.png" },
      ],
      title: "image with caption",
      signature: `p9-image-copy-${stamp}`,
      requiredSubmissions: 1,
    }),
  });
  assert(imageWithCopy.status === 400, `image task with content should be 400, got ${imageWithCopy.status}`);

  const imageShape = createTaskSchema.safeParse({
    options: [
      { imageUrl: "https://example.com/legacy-a.png" },
      { imageUrl: "https://example.com/legacy-b.png" },
    ],
    signature: `p9-legacy-${stamp}`,
    requiredSubmissions: 1,
  });
  assert(imageShape.success, "image create without optionType should still parse");
  assert(imageShape.data.optionType === "image", "omitted optionType should default to image");

  const leftoverCaption = await prismaClient.task.create({
    data: {
      title: "phase9-caption-hidden",
      user_id: creator.id,
      signature: `p9-caption-${stamp}`,
      amount: await quotedPriceFor(1),
      required_submissions: 1,
      options: {
        create: [
          {
            image_url: "",
            content: "I tried the viral hack. Here's what happened.",
            type: OptionType.Text,
          },
          {
            image_url: "",
            content: "Stop scrolling. This one actually works.",
            type: OptionType.Text,
          },
        ],
      },
    },
  });

  const others = await prismaClient.task.findMany({
    where: { done: false, id: { not: leftoverCaption.id } },
    select: { id: true },
  });
  const next = await getNextTask(
    worker.id,
    worker.address,
    others.map((row) => row.id),
  );
  assert(next == null, "worker queue must not serve caption tasks");

  const httpNext = await fetch(
    `${API}/api/v1/worker/nextTask?exclude=${others.map((row) => row.id).join(",")}`,
    { headers: { Authorization: `Bearer ${wToken}` } },
  );
  assert(httpNext.status === 200, `worker nextTask HTTP ${httpNext.status}`);
  const nextBody = await httpNext.json() as { task: { id: number } | null };
  assert(nextBody.task == null, "HTTP nextTask must not return a caption task");

  console.log("ok phase9 image-only tasks");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
