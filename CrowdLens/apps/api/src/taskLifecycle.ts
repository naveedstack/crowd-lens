import type { Prisma } from "@prisma/client";
import { SettleStatus } from "@prisma/client";
import { HttpError } from "./http";
import { rewardFor } from "./economics";
import { clampReputation } from "./reputation";
import { hashVoteCommitment } from "./solana/commitment";

type Tx = Prisma.TransactionClient;

export async function computeWinnerOptionId(tx: Tx, taskId: number): Promise<number | null> {
  const grouped = await tx.submission.groupBy({
    by: ["option_id"],
    where: { task_id: taskId },
    _count: { option_id: true },
  });

  let max = -1;
  let winner: number | null = null;
  let tied = false;

  for (const row of grouped) {
    const count = row._count.option_id;
    if (count > max) {
      max = count;
      winner = row.option_id;
      tied = false;
    } else if (count === max) {
      tied = true;
    }
  }

  return tied ? null : winner;
}

export async function settleTask(tx: Tx, taskId: number) {
  const task = await tx.task.findUnique({
    where: { id: taskId },
  });
  if (!task) {
    return;
  }

  const submissions = await tx.submission.findMany({
    where: { task_id: taskId, settled: false },
    orderBy: { worker_id: "asc" },
  });
  if (submissions.length === 0) {
    return;
  }

  const equal = submissions[0]!.amount;
  const winner = task.winner_option_id;
  const aligned = winner == null ? [] : submissions.filter((row) => row.option_id === winner);
  const outliers = winner == null ? [] : submissions.filter((row) => row.option_id !== winner);
  const creditPending = task.settle_status === SettleStatus.Offchain;

  if (winner == null || aligned.length === 0) {
    for (const row of submissions) {
      await finalizeSubmission(tx, row, row.amount, null, creditPending);
    }
    await markOnchainSettling(tx, taskId, creditPending);
    return;
  }

  const outlierShare = Math.floor(equal / 2);
  const haircutPool = (equal - outlierShare) * outliers.length;
  const bonusBase = Math.floor(haircutPool / aligned.length);
  let remainder = haircutPool - bonusBase * aligned.length;
  const firstAlignedId = aligned[0]!.worker_id;

  for (const row of aligned) {
    let finalAmount = equal + bonusBase;
    if (row.worker_id === firstAlignedId) {
      finalAmount += remainder;
      remainder = 0;
    }
    await finalizeSubmission(tx, row, finalAmount, "aligned", creditPending);
  }

  for (const row of outliers) {
    await finalizeSubmission(tx, row, outlierShare, "outlier", creditPending);
  }

  await markOnchainSettling(tx, taskId, creditPending);
}

async function markOnchainSettling(tx: Tx, taskId: number, creditPending: boolean) {
  if (creditPending) {
    return;
  }

  const rows = await tx.submission.findMany({
    where: { task_id: taskId },
    include: { worker: { select: { address: true } } },
    orderBy: { worker_id: "asc" },
  });

  const commitment = hashVoteCommitment(
    rows.map((row) => ({
      address: row.worker.address,
      optionId: row.option_id,
      amount: row.amount,
    })),
  );

  await tx.task.update({
    where: { id: taskId },
    data: {
      vote_commitment: commitment.toString("hex"),
      settle_status: SettleStatus.Settling,
    },
  });
}

async function finalizeSubmission(
  tx: Tx,
  row: { id: number; worker_id: number; amount: number },
  finalAmount: number,
  role: "aligned" | "outlier" | null,
  creditPending: boolean,
) {
  await tx.submission.update({
    where: { id: row.id },
    data: { amount: finalAmount, settled: true },
  });

  const worker = await tx.worker.findUnique({
    where: { id: row.worker_id },
  });
  if (!worker) {
    return;
  }

  const reputationDelta = role === "aligned" ? 2 : role === "outlier" ? -5 : 0;

  await tx.worker.update({
    where: { id: row.worker_id },
    data: {
      unsettled_amount: { decrement: row.amount },
      ...(creditPending ? { pending_amount: { increment: finalAmount } } : {}),
      reputation: clampReputation(worker.reputation + reputationDelta),
      ...(role === "aligned" ? { aligned_votes: { increment: 1 } } : {}),
      ...(role === "outlier" ? { outlier_votes: { increment: 1 } } : {}),
    },
  });
}

export async function submitVote(
  tx: Tx,
  args: {
    taskId: number;
    workerId: number;
    optionId: number;
    comment?: string;
  },
): Promise<number> {
  await tx.$queryRaw`SELECT id FROM "Task" WHERE id = ${args.taskId} FOR UPDATE`;

  const locked = await tx.task.findUnique({
    where: { id: args.taskId },
  });

  if (!locked || locked.done) {
    throw new HttpError(400, "Task is no longer available");
  }

  const count = await tx.submission.count({
    where: { task_id: args.taskId },
  });

  if (count >= locked.required_submissions) {
    const winner_option_id = await computeWinnerOptionId(tx, args.taskId);
    await tx.task.update({
      where: { id: args.taskId },
      data: { done: true, winner_option_id },
    });
    await settleTask(tx, args.taskId);
    throw new HttpError(400, "Task is no longer available");
  }

  const amount = rewardFor(locked.amount, locked.required_submissions);

  await tx.submission.create({
    data: {
      option_id: args.optionId,
      worker_id: args.workerId,
      task_id: args.taskId,
      amount,
      comment: args.comment,
      settled: false,
    },
  });

  await tx.worker.update({
    where: { id: args.workerId },
    data: {
      unsettled_amount: {
        increment: amount,
      },
    },
  });

  if (count + 1 === locked.required_submissions) {
    const winner_option_id = await computeWinnerOptionId(tx, args.taskId);
    await tx.task.update({
      where: { id: args.taskId },
      data: { done: true, winner_option_id },
    });
    await settleTask(tx, args.taskId);
  }

  const mine = await tx.submission.findFirst({
    where: { task_id: args.taskId, worker_id: args.workerId },
  });
  return mine?.amount ?? amount;
}
