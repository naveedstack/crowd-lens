import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { quotedPriceFor } from "../src/economics";
import { anonymizeWorkerId } from "../src/analytics";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedActor(role: "user" | "worker") {
  const address = `Phase10${role}${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44);
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

async function authed(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API}/api/v1/user${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || contentType.includes("text/csv")) {
    const body = contentType.includes("text/csv")
      ? await res.text()
      : await res.json() as unknown;
    return { status: res.status, body };
  }
  const body = await res.json() as unknown;
  return { status: res.status, body };
}

async function main() {
  const creator = await seedActor("user");
  const other = await seedActor("user");
  const workers = await Promise.all([seedActor("worker"), seedActor("worker")]);
  const token = userToken(creator);
  const otherToken = userToken(other);

  const started = new Date(Date.now() - 90_000);
  const firstVote = new Date(started.getTime() + 30_000);
  const secondVote = new Date(started.getTime() + 90_000);

  const task = await prismaClient.task.create({
    data: {
      title: "phase10-analytics",
      user_id: creator.id,
      signature: `p10-task-${stamp}`,
      amount: await quotedPriceFor(2),
      required_submissions: 2,
      done: true,
      options: {
        create: [
          { image_url: "https://example.com/phase10-a.png" },
          { image_url: "https://example.com/phase10-b.png" },
        ],
      },
    },
    include: { options: true },
  });
  const optionA = task.options[0]!;
  const optionB = task.options[1]!;
  await prismaClient.task.update({
    where: { id: task.id },
    data: { winner_option_id: optionA.id },
  });

  await prismaClient.taskServe.createMany({
    data: workers.map((worker) => ({
      worker_id: worker.id,
      task_id: task.id,
      served_at: started,
    })),
  });
  await prismaClient.submission.create({
    data: {
      worker_id: workers[0]!.id,
      option_id: optionA.id,
      task_id: task.id,
      amount: 1_000_000,
      comment: "left thumbnail is clearer",
      created_at: firstVote,
    },
  });
  await prismaClient.submission.create({
    data: {
      worker_id: workers[1]!.id,
      option_id: optionB.id,
      task_id: task.id,
      amount: 1_000_000,
      comment: "right feels more authentic",
      created_at: secondVote,
    },
  });
  await prismaClient.worker.update({
    where: { id: workers[0]!.id },
    data: { aligned_votes: 10_000, reputation: 80 },
  });
  await prismaClient.worker.update({
    where: { id: workers[1]!.id },
    data: { aligned_votes: 9_000, reputation: 75 },
  });

  const forbiddenTask = await authed(`/task?taskId=${task.id}`, otherToken);
  assert(forbiddenTask.status === 403, `cross-user GET /task should be 403, got ${forbiddenTask.status}`);
  const forbiddenExport = await authed(`/task/export?taskId=${task.id}&format=json`, otherToken);
  assert(forbiddenExport.status === 403, `cross-user export should be 403, got ${forbiddenExport.status}`);

  const details = await authed(`/task?taskId=${task.id}`, token);
  assert(details.status === 200, `GET /task HTTP ${details.status}`);
  const body = details.body as {
    result: Record<string, { count: number }>;
    analytics: {
      completionRate: number;
      turnaroundMs: number | null;
      timeline: Array<{ counts: Record<string, number> }>;
    };
    taskDetails: { done: boolean; winner_option_id: number | null; required_submissions: number };
  };
  assert(body.result, "GET /task should include result");
  assert(body.taskDetails, "GET /task should include taskDetails");
  assert(body.taskDetails.done === true, "task should be done");
  assert(body.analytics.completionRate === 1, `completionRate ${body.analytics.completionRate}`);
  assert((body.analytics.turnaroundMs ?? 0) > 0, "turnaroundMs should be > 0");
  const timelineVotes = body.analytics.timeline.reduce(
    (sum, bucket) => sum + Object.values(bucket.counts).reduce((inner, count) => inner + count, 0),
    0,
  );
  assert(timelineVotes === 2, `timeline should count 2 votes, got ${timelineVotes}`);

  const jsonExport = await authed(`/task/export?taskId=${task.id}&format=json`, token);
  assert(jsonExport.status === 200, `JSON export HTTP ${jsonExport.status}`);
  const rows = jsonExport.body as Array<Record<string, unknown>>;
  assert(Array.isArray(rows) && rows.length === 2, "JSON export should have 2 rows");
  assert(typeof rows[0]?.worker_hash === "string", "export should include worker_hash");
  assert(
    rows.every((row) => !Object.prototype.hasOwnProperty.call(row, "address")),
    "export must not include address",
  );
  assert(
    JSON.stringify(rows).includes("left thumbnail is clearer"),
    "export should include comments",
  );
  assert(
    rows.some((row) => row.worker_hash === anonymizeWorkerId(workers[0]!.id)),
    "worker_hash should match anonymizeWorkerId",
  );
  const serialized = JSON.stringify(rows);
  assert(!serialized.includes(workers[0]!.address), "export JSON must not contain worker wallets");

  const csvExport = await authed(`/task/export?taskId=${task.id}&format=csv`, token);
  assert(csvExport.status === 200, `CSV export HTTP ${csvExport.status}`);
  const csv = String(csvExport.body);
  assert(csv.startsWith("task_id,"), "CSV should start with columns");
  assert(csv.includes("worker_hash"), "CSV header should include worker_hash");
  assert(csv.includes("left thumbnail is clearer"), "CSV should include comments");

  const unauthExport = await fetch(`${API}/api/v1/user/task/export?taskId=${task.id}&format=json`);
  assert(unauthExport.status === 401, `unauthenticated export should be 401, got ${unauthExport.status}`);

  const statsRes = await fetch(`${API}/api/v1/stats`);
  assert(statsRes.status === 200, `public stats HTTP ${statsRes.status}`);
  const stats = await statsRes.json() as {
    votes: number;
    uniqueValidators: number;
    tasks: number;
    tasksDone: number;
    leaderboard: Array<{ addressPreview: string; votes: number }>;
  };
  assert(stats.votes >= 2, `public stats votes ${stats.votes}`);
  assert(stats.uniqueValidators >= 2, `public stats uniqueValidators ${stats.uniqueValidators}`);
  assert(stats.tasksDone >= 1, "public stats should count done tasks");
  const preview = `${workers[0]!.address.slice(0, 4)}…${workers[0]!.address.slice(-4)}`;
  assert(
    stats.leaderboard.some((row) => row.addressPreview === preview),
    "leaderboard should include a truncated voter address",
  );

  const salt = env.EXPORT_SALT?.trim() || env.JWT_SECRET;
  const expectedHash = createHash("sha256").update(`${salt}:${workers[0]!.id}`).digest("hex").slice(0, 16);
  assert(rows[0]?.worker_hash === expectedHash || rows.some((row) => row.worker_hash === expectedHash), "hash salt");

  console.log("ok phase10 analytics and export");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
