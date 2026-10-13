import { Prisma, SettleStatus } from "@prisma/client";
import { HttpError } from "./http";
import { rewardFor } from "./economics";
import { hashVoteCommitment } from "./solana/commitment";

type Tx = Prisma.TransactionClient;

type SettlementPlan = {
  submissionId: number;
  workerId: number;
  oldAmount: number;
  finalAmount: number;
  role: "aligned" | "outlier" | null;
  address: string;
  optionId: number;
};

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
    include: { worker: { select: { address: true } } },
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

  const plans: SettlementPlan[] = [];

  if (winner == null || aligned.length === 0) {
    for (const row of submissions) {
      plans.push({
        submissionId: row.id,
        workerId: row.worker_id,
        oldAmount: row.amount,
        finalAmount: row.amount,
        role: null,
        address: row.worker.address,
        optionId: row.option_id,
      });
    }
  } else {
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
      plans.push({
        submissionId: row.id,
        workerId: row.worker_id,
        oldAmount: row.amount,
        finalAmount,
        role: "aligned",
        address: row.worker.address,
        optionId: row.option_id,
      });
    }

    for (const row of outliers) {
      plans.push({
        submissionId: row.id,
        workerId: row.worker_id,
        oldAmount: row.amount,
        finalAmount: outlierShare,
        role: "outlier",
        address: row.worker.address,
        optionId: row.option_id,
      });
    }
  }

  await applySettlement(tx, plans, creditPending);
  await markOnchainSettling(tx, taskId, creditPending, plans);
}

async function applySettlement(tx: Tx, plans: SettlementPlan[], creditPending: boolean) {
  if (plans.length === 0) {
    return;
  }

  const submissionValues = plans.map(
    (plan) => Prisma.sql`(${plan.submissionId}::int, ${plan.finalAmount}::int)`,
  );
  await tx.$executeRaw`
    UPDATE "Submission" AS s
    SET amount = v.amount, settled = true
    FROM (VALUES ${Prisma.join(submissionValues)}) AS v(id, amount)
    WHERE s.id = v.id
  `;

  const workerValues = plans.map((plan) => {
    const repDelta = plan.role === "aligned" ? 2 : plan.role === "outlier" ? -5 : 0;
    const aligned = plan.role === "aligned" ? 1 : 0;
    const outlier = plan.role === "outlier" ? 1 : 0;
    const credit = creditPending ? plan.finalAmount : 0;
    return Prisma.sql`(${plan.workerId}::int, ${plan.oldAmount}::int, ${credit}::int, ${repDelta}::int, ${aligned}::int, ${outlier}::int)`;
  });
  await tx.$executeRaw`
    UPDATE "Worker" AS w
    SET
      unsettled_amount = w.unsettled_amount - v.old_amount,
      pending_amount = w.pending_amount + v.credit,
      reputation = GREATEST(0, LEAST(100, w.reputation + v.rep_delta)),
      aligned_votes = w.aligned_votes + v.aligned,
      outlier_votes = w.outlier_votes + v.outlier
    FROM (VALUES ${Prisma.join(workerValues)}) AS v(id, old_amount, credit, rep_delta, aligned, outlier)
    WHERE w.id = v.id
  `;
}

async function markOnchainSettling(
  tx: Tx,
  taskId: number,
  creditPending: boolean,
  plans: SettlementPlan[],
) {
  if (creditPending) {
    return;
  }

  const commitment = hashVoteCommitment(
    plans.map((plan) => ({
      address: plan.address,
      optionId: plan.optionId,
      amount: plan.finalAmount,
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
