import jwt from "jsonwebtoken";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { getNextTask, parseExcludeIds } from "../src/db";
import { quotedPriceFor, rewardFor } from "../src/economics";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedActor(role: "user" | "worker") {
  const address = `Phase4${role}${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44);
  if (role === "user") {
    return prismaClient.user.create({ data: { address } });
  }
  return prismaClient.worker.create({
    data: { address, pending_amount: 0, locked_amount: 0 },
  });
}

async function createOpenTask(userId: number, requiredSubmissions: number, signature: string) {
  return prismaClient.task.create({
    data: {
      title: `phase4-${requiredSubmissions}-${signature}`,
      user_id: userId,
      signature,
      amount: await quotedPriceFor(requiredSubmissions),
      required_submissions: requiredSubmissions,
      options: {
        create: [
          { image_url: "https://example.com/phase4-a.png" },
          { image_url: "https://example.com/phase4-b.png" },
        ],
      },
    },
    include: { options: true },
  });
}

function workerToken(worker: { id: number; address: string }) {
  return jwt.sign(
    { id: worker.id, address: worker.address },
    env.WORKER_JWT_SECRET,
    { expiresIn: "24h" },
  );
}

async function workerGet(path: string, token: string) {
  const res = await fetch(`${API}/api/v1/worker${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json() as Record<string, unknown>;
  return { status: res.status, body };
}

async function workerPost(path: string, token: string, payload: unknown) {
  const res = await fetch(`${API}/api/v1/worker${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json() as Record<string, unknown>;
  return { status: res.status, body };
}

async function main() {
  assert(
    JSON.stringify(parseExcludeIds("3, 3, x, 2")) === JSON.stringify([3, 2]),
    "parseExcludeIds should keep unique positive integers",
  );

  const creator = await seedActor("user");
  const worker = await seedActor("worker");
  const otherWorker = await seedActor("worker");
  const token = workerToken(worker);
  const otherToken = workerToken(otherWorker);

  const taskA = await createOpenTask(creator.id, 5, `p4a-${stamp}`);
  const taskB = await createOpenTask(creator.id, 5, `p4b-${stamp}`);

  const next = await workerGet("/nextTask", token);
  assert(next.status === 200, `nextTask HTTP ${next.status}`);
  const firstTask = next.body.task as {
    id: number;
    submission_count: number;
    required_submissions: number;
    reward: number;
  } | null;
  assert(firstTask, "nextTask should return an open task");
  assert(firstTask.submission_count === 0, "new task submission_count should be 0");
  assert(firstTask.required_submissions === 5, "batch size should be 5");
  const expectedReward = rewardFor(taskA.amount, taskA.required_submissions);
  assert(firstTask.reward === expectedReward, `reward should be half of creator per-vote, got ${firstTask.reward}`);

  const skipped = await workerGet(`/nextTask?exclude=${firstTask.id}`, token);
  const skippedTask = skipped.body.task as { id: number } | null;
  assert(skippedTask, "exclude should still return another open task");
  assert(skippedTask.id !== firstTask.id, "exclude should not return the skipped task");

  const listed = await workerGet("/tasks", token);
  assert(listed.status === 200, `tasks HTTP ${listed.status}`);
  const listRows = listed.body.tasks as Array<{ id: number; reward: number }>;
  assert(listRows.some((row) => row.id === taskA.id), "list should include task A");
  assert(listRows.some((row) => row.id === taskB.id), "list should include task B");
  assert(
    listRows
      .filter((row) => row.id === taskA.id || row.id === taskB.id)
      .every((row) => row.reward === expectedReward),
    "list rewards should be half of creator per-vote",
  );

  const detail = await workerGet(`/task?taskId=${taskB.id}`, token);
  assert(detail.status === 200, `task detail HTTP ${detail.status}`);
  const detailTask = detail.body.task as { id: number; options: unknown[] };
  assert(detailTask.id === taskB.id, "detail should return the requested task");
  assert(Array.isArray(detailTask.options) && detailTask.options.length === 2, "detail should include options");

  const missing = await workerGet("/task?taskId=999999999", token);
  assert(missing.status === 404, `missing task HTTP ${missing.status}`);

  const otherOpen = await prismaClient.task.findMany({
    where: { done: false, id: { notIn: [taskA.id, taskB.id] } },
    select: { id: true },
  });
  const noneLeft = await getNextTask(worker.id, worker.address, [
    taskA.id,
    taskB.id,
    ...otherOpen.map((row) => row.id),
  ]);
  assert(noneLeft == null, "excluding every open task should yield empty queue");

  const tooLong = await workerPost("/submission", token, {
    taskId: String(skippedTask.id),
    selection: "1",
    comment: "x".repeat(281),
  });
  assert(tooLong.status === 400, "comment over 280 should be rejected");

  const votedTask = await prismaClient.task.findUnique({
    where: { id: skippedTask.id },
    include: { options: true },
  });
  assert(votedTask?.options[0], "skipped task should have options");
  const comment = "Left thumbnail is clearer";
  await new Promise((resolve) => setTimeout(resolve, 3200));
  const submit = await workerPost("/submission", token, {
    taskId: String(votedTask.id),
    selection: String(votedTask.options[0].id),
    comment,
  });
  assert(submit.status === 200, `submit skipped-task HTTP ${submit.status} ${JSON.stringify(submit.body)}`);

  const stats = await workerGet("/stats", token);
  assert(stats.status === 200, `stats HTTP ${stats.status}`);
  assert(stats.body.votesSubmitted === 1, "votesSubmitted should be 1");
  assert(stats.body.totalEarned === expectedReward, "totalEarned should include this vote");
  assert(stats.body.unsettledBal === expectedReward, "open batch should credit unsettled until close");
  assert(stats.body.pendingBal === 0, "pending should stay 0 until the batch closes");
  assert(stats.body.minPayout === expectedReward, "minPayout should match one voter payout");

  const submissions = await workerGet("/submissions", token);
  assert(submissions.status === 200, `submissions HTTP ${submissions.status}`);
  const rows = submissions.body.submissions as Array<{
    comment: string | null;
    amount: number;
    task: { id: number; title: string; done: boolean };
    option: { id: number; image_url: string };
  }>;
  assert(rows.length === 1, "history should contain the vote");
  assert(rows[0]?.comment === comment, "history should persist the comment");
  assert(rows[0]?.option.image_url.includes("phase4"), "history should include the picked image");
  assert(rows[0]?.task.done === false, "5-vote task should still be open");

  const balance = await workerGet("/balance", token);
  assert(balance.status === 200, `balance HTTP ${balance.status}`);
  assert(balance.body.unsettledBal === expectedReward, "GET /balance should show unsettled on an open batch");
  assert(balance.body.pendingBal === 0, "GET /balance pending should stay 0 until close");

  const payouts = await workerGet("/payouts", token);
  assert(payouts.status === 200, `payouts HTTP ${payouts.status}`);
  assert(Array.isArray(payouts.body.payouts), "GET /payouts should still return a list");

  const belowMin = await workerPost("/payout", otherToken, {});
  assert(belowMin.status === 400, `empty worker payout HTTP ${belowMin.status}`);
  assert(belowMin.body.error === "Below minimum withdrawal", "withdraw should still enforce the minimum");

  console.log("ok phase4 dashboard api");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
