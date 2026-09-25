import jwt from "jsonwebtoken";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { priceFor } from "../src/economics";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedUser() {
  const address = `Phase5user${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44);
  return prismaClient.user.create({ data: { address } });
}

function userToken(user: { id: number; address: string }) {
  return jwt.sign(
    { id: user.id, address: user.address },
    env.JWT_SECRET,
    { expiresIn: "24h" },
  );
}

async function createTask(
  userId: number,
  args: {
    title: string;
    signature: string;
    requiredSubmissions: number;
    done?: boolean;
    winner_option_id?: number | null;
    thumb: string;
  },
) {
  const task = await prismaClient.task.create({
    data: {
      title: args.title,
      user_id: userId,
      signature: args.signature,
      amount: priceFor(args.requiredSubmissions),
      required_submissions: args.requiredSubmissions,
      done: args.done ?? false,
      options: {
        create: [
          { image_url: args.thumb },
          { image_url: `${args.thumb}-b` },
        ],
      },
    },
    include: { options: true },
  });
  if (args.done) {
    return prismaClient.task.update({
      where: { id: task.id },
      data: { winner_option_id: args.winner_option_id ?? task.options[0]!.id },
      include: { options: true },
    });
  }
  return task;
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
  const creator = await seedUser();
  const other = await seedUser();
  const token = userToken(creator);
  const otherToken = userToken(other);

  const oneOption = await authed("/task", token, {
    method: "POST",
    body: JSON.stringify({
      options: [{ imageUrl: "https://example.com/one.png" }],
      title: "too few",
      signature: `p5-one-${stamp}`,
      requiredSubmissions: 1,
    }),
  });
  assert(oneOption.status === 400, `1 option should be 400, got ${oneOption.status}`);

  const sixOptions = await authed("/task", token, {
    method: "POST",
    body: JSON.stringify({
      options: Array.from({ length: 6 }, (_, i) => ({ imageUrl: `https://example.com/${i}.png` })),
      title: "too many",
      signature: `p5-six-${stamp}`,
      requiredSubmissions: 1,
    }),
  });
  assert(sixOptions.status === 400, `6 options should be 400, got ${sixOptions.status}`);

  const openTask = await createTask(creator.id, {
    title: "phase5-open",
    signature: `p5-open-${stamp}`,
    requiredSubmissions: 5,
    thumb: "https://example.com/phase5-open.png",
  });
  const doneTask = await createTask(creator.id, {
    title: "phase5-done",
    signature: `p5-done-${stamp}`,
    requiredSubmissions: 1,
    done: true,
    thumb: "https://example.com/phase5-done.png",
  });

  const list = await authed("/tasks", token);
  assert(list.status === 200, `GET /tasks HTTP ${list.status}`);
  const tasks = list.body.tasks as Array<{
    id: number;
    title: string;
    done: boolean;
    amount: number;
    required_submissions: number;
    submission_count: number;
    winner_option_id: number | null;
    thumbnail: string | null;
  }>;
  const mine = tasks.filter((t) => t.id === openTask.id || t.id === doneTask.id);
  assert(mine.length === 2, "list should include both created tasks");
  assert(tasks[0]?.id === doneTask.id, "newest task should be first");
  const listedOpen = mine.find((t) => t.id === openTask.id);
  const listedDone = mine.find((t) => t.id === doneTask.id);
  assert(listedOpen?.done === false, "open task should be Open");
  assert(listedOpen?.submission_count === 0, "new task has 0 votes");
  assert(listedOpen?.required_submissions === 5, "open task batch size");
  assert(listedOpen?.amount === priceFor(5), "amount spent should match batch price");
  assert(listedOpen?.thumbnail === "https://example.com/phase5-open.png", "thumbnail should be first option");
  assert(listedDone?.done === true, "closed task should be Done");
  assert(listedDone?.winner_option_id != null, "closed task should expose a winner");

  const otherList = await authed("/tasks", otherToken);
  assert(otherList.status === 200, `other GET /tasks HTTP ${otherList.status}`);
  const otherTasks = otherList.body.tasks as Array<{ id: number }>;
  assert(
    otherTasks.every((t) => t.id !== openTask.id && t.id !== doneTask.id),
    "another creator must not see these tasks",
  );

  const forbidden = await authed(`/task?taskId=${openTask.id}`, otherToken);
  assert(forbidden.status === 403, `cross-user GET /task should be 403, got ${forbidden.status}`);

  const details = await authed(`/task?taskId=${doneTask.id}`, token);
  assert(details.status === 200, `GET /task HTTP ${details.status}`);
  const taskDetails = details.body.taskDetails as {
    done: boolean;
    required_submissions: number;
    submission_count: number;
    winner_option_id: number | null;
  };
  assert(taskDetails.done === true, "results should show done");
  assert(taskDetails.required_submissions === 1, "results should include required votes");
  assert(taskDetails.winner_option_id != null, "results should include winner");

  const unauth = await fetch(`${API}/api/v1/user/tasks`);
  assert(unauth.status === 401, `unauthenticated GET /tasks should be 401, got ${unauth.status}`);

  console.log("ok phase5 creator dashboard api");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
