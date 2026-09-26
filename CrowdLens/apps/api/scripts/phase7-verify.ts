import jwt from "jsonwebtoken";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { getNextTask } from "../src/db";
import { quotedPriceFor } from "../src/economics";
import { submitVote } from "../src/taskLifecycle";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedActor(role: "user" | "worker") {
  const address = `Phase7${role}${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44);
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
      title: `phase7-${requiredSubmissions}-${signature}`,
      user_id: userId,
      signature,
      amount: await quotedPriceFor(requiredSubmissions),
      required_submissions: requiredSubmissions,
      options: {
        create: [
          { image_url: "https://example.com/phase7-a.png" },
          { image_url: "https://example.com/phase7-b.png" },
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

async function main() {
  const creator = await seedActor("user");
  const majority = await Promise.all([seedActor("worker"), seedActor("worker"), seedActor("worker")]);
  const minority = await Promise.all([seedActor("worker"), seedActor("worker")]);
  const solo = await seedActor("worker");
  const hasty = await seedActor("worker");

  const five = await createOpenTask(creator.id, 5, `p7-five-${stamp}`);
  const majorityOption = five.options[0]!.id;
  const minorityOption = five.options[1]!.id;

  for (const worker of majority) {
    await prismaClient.$transaction((tx) =>
      submitVote(tx, {
        taskId: five.id,
        workerId: worker.id,
        optionId: majorityOption,
      }),
    );
  }
  for (const worker of minority) {
    await prismaClient.$transaction((tx) =>
      submitVote(tx, {
        taskId: five.id,
        workerId: worker.id,
        optionId: minorityOption,
      }),
    );
  }

  const closed = await prismaClient.task.findUnique({ where: { id: five.id } });
  assert(closed?.done === true, "5-vote task should close");
  assert(closed.winner_option_id === majorityOption, "majority option should win");

  const majorityWorkers = await prismaClient.worker.findMany({
    where: { id: { in: majority.map((w) => w.id) } },
  });
  const minorityWorkers = await prismaClient.worker.findMany({
    where: { id: { in: minority.map((w) => w.id) } },
  });

  const minMajorityPending = Math.min(...majorityWorkers.map((w) => w.pending_amount));
  const maxMinorityPending = Math.max(...minorityWorkers.map((w) => w.pending_amount));
  assert(minMajorityPending > maxMinorityPending, "majority should earn more than outliers");
  assert(
    majorityWorkers.every((w) => w.reputation > 50 && w.aligned_votes === 1 && w.unsettled_amount === 0),
    "majority reputation should rise and settle",
  );
  assert(
    minorityWorkers.every((w) => w.reputation < 50 && w.outlier_votes === 1 && w.unsettled_amount === 0),
    "outlier reputation should drop and settle",
  );

  const one = await createOpenTask(creator.id, 1, `p7-one-${stamp}`);
  const before = await prismaClient.worker.findUnique({ where: { id: solo.id } });
  await prismaClient.$transaction((tx) =>
    submitVote(tx, {
      taskId: one.id,
      workerId: solo.id,
      optionId: one.options[0]!.id,
    }),
  );
  const after = await prismaClient.worker.findUnique({ where: { id: solo.id } });
  assert((after?.pending_amount ?? 0) > (before?.pending_amount ?? 0), "1-vote task should credit pending immediately");
  assert(after?.unsettled_amount === 0, "1-vote task should not leave unsettled funds");

  const dwellTask = await createOpenTask(creator.id, 5, `p7-dwell-${stamp}`);
  const token = workerToken(hasty);
  const next = await getNextTask(hasty.id, hasty.address);
  assert(next?.id === dwellTask.id || next != null, "hasty worker should be served a task");

  const tooFast = await fetch(`${API}/api/v1/worker/submission`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId: String(next!.id),
      selection: String(next!.options[0]!.id),
    }),
  });
  assert(tooFast.status === 400, `too-fast vote should be 400, got ${tooFast.status}`);
  const tooFastBody = await tooFast.json() as { error?: string };
  assert(tooFastBody.error === "Wait before voting", `expected dwell error, got ${tooFastBody.error}`);

  console.log("ok phase7 reputation + dwell");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
