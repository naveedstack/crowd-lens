import { randomUUID } from "node:crypto";
import { TxnStatus } from "@prisma/client";
import { prismaClient } from "db/client";
import { HttpError } from "../http";
import { getVoteQuote, pendingMeetsMinimum } from "../economics";
import { confirmPayout, sendPayout, signatureStatus } from "../solana/treasury";

const PLACEHOLDER_PREFIX = "pending:";
const PLACEHOLDER_STALE_MS = 2 * 60 * 1000;

export function isPlaceholderSignature(signature: string): boolean {
  return signature.startsWith(PLACEHOLDER_PREFIX);
}

export async function lockPendingForPayout(workerId: number) {
  const quote = await getVoteQuote();
  return prismaClient.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Worker" WHERE id = ${workerId} FOR UPDATE`;

    const worker = await tx.worker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new HttpError(401, "Unauthorized");
    }

    if (worker.locked_amount > 0) {
      throw new HttpError(409, "Payout already in progress");
    }

    if (!pendingMeetsMinimum(worker.pending_amount, quote.voterLamports, quote.solUsd)) {
      throw new HttpError(400, "Below minimum withdrawal");
    }

    const amount = worker.pending_amount;
    const placeholder = `${PLACEHOLDER_PREFIX}${randomUUID()}`;

    await tx.worker.update({
      where: { id: workerId },
      data: {
        pending_amount: 0,
        locked_amount: { increment: amount },
      },
    });

    const payout = await tx.payouts.create({
      data: {
        worker_id: workerId,
        amount,
        signature: placeholder,
        status: TxnStatus.Processing,
      },
    });

    return { payout, amount, address: worker.address };
  });
}

export async function markPayoutSuccess(args: {
  payoutId: number;
  workerId: number;
  amount: number;
  signature: string;
}) {
  await prismaClient.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Worker" WHERE id = ${args.workerId} FOR UPDATE`;
    const payout = await tx.payouts.findUnique({
      where: { id: args.payoutId },
    });
    if (!payout || payout.status !== TxnStatus.Processing) {
      return;
    }
    await tx.payouts.update({
      where: { id: args.payoutId },
      data: {
        status: TxnStatus.Success,
        signature: args.signature,
      },
    });
    await tx.worker.update({
      where: { id: args.workerId },
      data: {
        locked_amount: { decrement: args.amount },
      },
    });
  });
}

export async function markPayoutFailure(args: {
  payoutId: number;
  workerId: number;
  amount: number;
  signature?: string;
}) {
  await prismaClient.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Worker" WHERE id = ${args.workerId} FOR UPDATE`;
    const payout = await tx.payouts.findUnique({
      where: { id: args.payoutId },
    });
    if (!payout || payout.status !== TxnStatus.Processing) {
      return;
    }

    await tx.payouts.update({
      where: { id: args.payoutId },
      data: {
        status: TxnStatus.Failure,
        ...(args.signature ? { signature: args.signature } : {}),
      },
    });
    await tx.worker.update({
      where: { id: args.workerId },
      data: {
        locked_amount: { decrement: args.amount },
        pending_amount: { increment: args.amount },
      },
    });
  });
}

export async function executePayout(workerId: number) {
  const locked = await lockPendingForPayout(workerId);

  try {
    const sent = await sendPayout(locked.address, locked.amount);
    await prismaClient.payouts.update({
      where: { id: locked.payout.id },
      data: { signature: sent.signature },
    });
    await confirmPayout(sent);
    await markPayoutSuccess({
      payoutId: locked.payout.id,
      workerId,
      amount: locked.amount,
      signature: sent.signature,
    });
    return {
      payoutId: locked.payout.id,
      amount: locked.amount,
      signature: sent.signature,
      status: TxnStatus.Success,
    };
  } catch (err) {
    const current = await prismaClient.payouts.findUnique({
      where: { id: locked.payout.id },
    });
    if (current && !isPlaceholderSignature(current.signature)) {
      try {
        const result = await signatureStatus(current.signature);
        const confirmation = result.value[0]?.confirmationStatus;
        if (confirmation === "confirmed" || confirmation === "finalized") {
          await markPayoutSuccess({
            payoutId: locked.payout.id,
            workerId,
            amount: locked.amount,
            signature: current.signature,
          });
          return {
            payoutId: locked.payout.id,
            amount: locked.amount,
            signature: current.signature,
            status: TxnStatus.Success,
          };
        }
      } catch (statusErr) {
        console.error("Could not read payout signature status", statusErr);
      }
    }

    await markPayoutFailure({
      payoutId: locked.payout.id,
      workerId,
      amount: locked.amount,
    });
    const message = err instanceof Error ? err.message : "Payout failed";
    if (message.includes("Insufficient treasury balance")) {
      throw new HttpError(400, "Treasury has insufficient SOL");
    }
    throw new HttpError(500, "Payout failed");
  }
}

export async function reconcileProcessingPayouts() {
  const open = await prismaClient.payouts.findMany({
    where: { status: TxnStatus.Processing },
  });

  for (const payout of open) {
    try {
      if (isPlaceholderSignature(payout.signature)) {
        const age = Date.now() - payout.created_at.getTime();
        if (age >= PLACEHOLDER_STALE_MS) {
          await markPayoutFailure({
            payoutId: payout.id,
            workerId: payout.worker_id,
            amount: payout.amount,
          });
        }
        continue;
      }

      const result = await signatureStatus(payout.signature);
      const status = result.value[0];
      const confirmation = status?.confirmationStatus;
      if (confirmation === "confirmed" || confirmation === "finalized") {
        await markPayoutSuccess({
          payoutId: payout.id,
          workerId: payout.worker_id,
          amount: payout.amount,
          signature: payout.signature,
        });
        continue;
      }

      const err = status?.err;
      const age = Date.now() - payout.created_at.getTime();
      if (err || (status == null && age >= PLACEHOLDER_STALE_MS)) {
        await markPayoutFailure({
          payoutId: payout.id,
          workerId: payout.worker_id,
          amount: payout.amount,
          signature: payout.signature,
        });
      }
    } catch (err) {
      console.error("Failed to reconcile payout", payout.id, err);
    }
  }
}
