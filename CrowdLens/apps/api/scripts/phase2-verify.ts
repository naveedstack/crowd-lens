import jwt from "jsonwebtoken";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { getNextTask } from "../src/db";
import { HttpError, isUniqueConstraintError } from "../src/http";
import { priceFor } from "../src/economics";
import { submitVote } from "../src/taskLifecycle";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedActor(role: "user" | "worker") {
  const address = `Phase2${role}${stamp}${Math.random().toString(16).slice(2, 8)}`.slice(0, 44);
  if (role === "user") {
    return prismaClient.user.create({ data: { address } });
  }
  return prismaClient.worker.create({
    data: { address, pending_amount: 0, locked_amount: 0 },
  });
}

async function createOpenTask(
  userId: number,
  requiredSubmissions: number,
  signature: string,
) {
  const task = await prismaClient.task.create({
    data: {
      title: `phase2-${requiredSubmissions}-${stamp}`,
      user_id: userId,
      signature,
      amount: priceFor(requiredSubmissions),
      required_submissions: requiredSubmissions,
      options: {
        create: [
          { image_url: "https://example.com/a.png" },
          { image_url: "https://example.com/b.png" },
        ],
      },
    },
    include: { options: true },
  });
  return task;
}

async function main() {
  const economicsRes = await fetch(`${API}/api/v1/user/economics`);
  assert(economicsRes.ok, `economics HTTP ${economicsRes.status}`);
  const economics = await economicsRes.json() as {
    treasuryAddress: string;
    lamportsPerVote: number;
    batchSizes: number[];
  };
  assert(economics.lamportsPerVote === 1_000_000, "lamportsPerVote should be 1_000_000");
  assert(economics.batchSizes.includes(1) && economics.batchSizes.includes(5), "batch sizes missing 1 or 5");
  console.log("ok economics", economics);

  const creator = await seedActor("user");
  const worker = await seedActor("worker");
  const otherWorker = await seedActor("worker");

  const token = jwt.sign(
    { id: creator.id, address: creator.address },
    env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  const badBatch = await fetch(`${API}/api/v1/user/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      options: [{ imageUrl: "https://example.com/a.png" }],
      title: "bad batch",
      signature: `missing-tx-${stamp}`,
      requiredSubmissions: 3,
    }),
  });
  const badBatchBody = await badBatch.json() as { error?: string };
  assert(badBatch.status === 400, `expected 400 for invalid batch, got ${badBatch.status}`);
  assert(badBatchBody.error === "Invalid batch size", `unexpected error ${badBatchBody.error}`);
  console.log("ok invalid batch size 400");

  const oneVote = await createOpenTask(creator.id, 1, `phase2-one-${stamp}`);
  const winnerOption = oneVote.options[0];
  assert(winnerOption, "missing option");

  const reward = await prismaClient.$transaction((tx) =>
    submitVote(tx, {
      taskId: oneVote.id,
      workerId: worker.id,
      optionId: winnerOption.id,
    }),
  );
  assert(reward === 1_000_000, `reward ${reward}`);

  const closed = await prismaClient.task.findUnique({ where: { id: oneVote.id } });
  assert(closed?.done === true, "1-vote task should be done");
  assert(closed?.winner_option_id === winnerOption.id, "winner should be the voted option");

  const workerRow = await prismaClient.worker.findUnique({ where: { id: worker.id } });
  assert(workerRow?.pending_amount === 1_000_000, `pending_amount ${workerRow?.pending_amount}`);

  const resultsRes = await fetch(`${API}/api/v1/user/task?taskId=${oneVote.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(resultsRes.ok, `GET /task HTTP ${resultsRes.status}`);
  const results = await resultsRes.json() as {
    taskDetails: {
      done: boolean;
      required_submissions: number;
      submission_count: number;
      winner_option_id: number | null;
    };
  };
  assert(results.taskDetails.done === true, "results should show done");
  assert(results.taskDetails.required_submissions === 1, "results quota should be 1");
  assert(results.taskDetails.submission_count === 1, "results count should be 1");
  assert(results.taskDetails.winner_option_id === winnerOption.id, "results winner mismatch");
  console.log("ok GET /task winner payload");

  const nextAfter = await getNextTask(otherWorker.id, otherWorker.address);
  assert(nextAfter?.id !== oneVote.id, "closed task must not be served");

  const stillEligible = await prismaClient.task.findFirst({
    where: {
      id: oneVote.id,
      done: false,
      user: { address: { not: otherWorker.address } },
      submissions: { none: { worker_id: otherWorker.id } },
    },
  });
  assert(stillEligible == null, "closed 1-vote task should not match getNextTask filters");
  console.log("ok 1-vote close + winner + not served");

  try {
    await prismaClient.task.create({
      data: {
        title: "dup",
        user_id: creator.id,
        signature: oneVote.signature,
        amount: priceFor(1),
        required_submissions: 1,
      },
    });
    throw new Error("duplicate signature should fail");
  } catch (err) {
    assert(isUniqueConstraintError(err), "duplicate signature should be P2002");
  }
  console.log("ok duplicate signature P2002");

  const fiveVote = await createOpenTask(creator.id, 5, `phase2-five-${stamp}`);
  const fiveOption = fiveVote.options[0];
  assert(fiveOption, "missing five-vote option");

  await prismaClient.$transaction((tx) =>
    submitVote(tx, {
      taskId: fiveVote.id,
      workerId: worker.id,
      optionId: fiveOption.id,
    }),
  );

  const stillOpen = await prismaClient.task.findUnique({ where: { id: fiveVote.id } });
  const count = await prismaClient.submission.count({ where: { task_id: fiveVote.id } });
  assert(stillOpen?.done === false, "5-vote task should stay open after 1 vote");
  assert(stillOpen?.winner_option_id == null, "winner should be empty while open");
  assert(count === 1, `expected 1 submission, got ${count}`);
  const fiveEligible = await prismaClient.task.findFirst({
    where: {
      id: fiveVote.id,
      done: false,
      user: { address: { not: otherWorker.address } },
      submissions: { none: { worker_id: otherWorker.id } },
    },
  });
  assert(fiveEligible, "open 5-vote task should still match getNextTask filters");
  console.log("ok 5-vote stays open at 1/5");

  try {
    await prismaClient.$transaction((tx) =>
      submitVote(tx, {
        taskId: oneVote.id,
        workerId: otherWorker.id,
        optionId: winnerOption.id,
      }),
    );
    throw new Error("closed task submit should fail");
  } catch (err) {
    assert(err instanceof HttpError && err.status === 400, "closed task should 400");
  }
  console.log("ok closed task rejects extra votes");

  console.log("Phase 2 verification passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
