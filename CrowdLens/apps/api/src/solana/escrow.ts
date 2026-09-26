import { PayoutSource, SettleStatus, TxnStatus } from "@prisma/client";
import {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  closeTaskInstruction,
  commitVotesInstruction,
  decodeCreatorStats,
  decodeTaskEscrow,
  findCreatorPda,
  findTaskPda,
  MAX_SETTLE_CHUNK,
  settleChunkInstruction,
} from "crowdlens-idl";
import { prismaClient } from "db/client";
import { env } from "../env";
import { isOnchainSettlement } from "../economics";
import { treasuryConnection, treasuryKeypair } from "./treasury";

function programId() {
  return new PublicKey(env.CROWDLENS_PROGRAM_ID);
}

async function sendIx(ix: TransactionInstruction): Promise<string> {
  const transaction = new Transaction().add(ix);
  return sendAndConfirmTransaction(treasuryConnection, transaction, [treasuryKeypair], {
    commitment: "confirmed",
  });
}

export async function fetchCreatorNonce(creator: string): Promise<number> {
  const [pda] = findCreatorPda(new PublicKey(creator), programId());
  const info = await treasuryConnection.getAccountInfo(pda, "confirmed");
  if (!info) {
    return 0;
  }
  const decoded = decodeCreatorStats(Buffer.from(info.data));
  return decoded?.taskCount ?? 0;
}

export async function fetchTaskEscrow(creator: string, nonce: number) {
  const [pda] = findTaskPda(new PublicKey(creator), nonce, programId());
  const info = await treasuryConnection.getAccountInfo(pda, "confirmed");
  if (!info) {
    return { pda: pda.toBase58(), account: null };
  }
  return {
    pda: pda.toBase58(),
    account: decodeTaskEscrow(Buffer.from(info.data)),
  };
}

export async function indexTaskFromChain(taskId: number) {
  const task = await prismaClient.task.findUnique({
    where: { id: taskId },
    include: { user: true },
  });
  if (!task?.escrow_pda) {
    return task;
  }
  const info = await treasuryConnection.getAccountInfo(
    new PublicKey(task.escrow_pda),
    "confirmed",
  );
  if (!info) {
    return prismaClient.task.update({
      where: { id: taskId },
      data: { settle_status: SettleStatus.Settled },
    });
  }
  const decoded = decodeTaskEscrow(Buffer.from(info.data));
  if (!decoded) {
    return task;
  }
  return prismaClient.task.update({
    where: { id: taskId },
    data: {
      vote_commitment: decoded.voteCommitment.toString("hex"),
      settle_status: decoded.settled
        ? SettleStatus.Settled
        : decoded.voteCommitment.some((byte) => byte !== 0)
          ? SettleStatus.Settling
          : SettleStatus.Escrowed,
    },
  });
}

export async function settleEscrow(taskId: number) {
  if (!isOnchainSettlement()) {
    return;
  }

  const task = await prismaClient.task.findUnique({
    where: { id: taskId },
    include: {
      user: true,
      submissions: {
        include: { worker: true },
        orderBy: { worker_id: "asc" },
      },
    },
  });

  if (!task || task.settle_status === SettleStatus.Offchain) {
    return;
  }
  if (task.settle_status === SettleStatus.Settled) {
    return;
  }
  if (!task.escrow_pda || !task.vote_commitment) {
    throw new Error("Task is missing escrow metadata");
  }

  const nonce = task.escrow_nonce;
  if (nonce == null) {
    throw new Error("Task is missing escrow nonce");
  }
  const creator = new PublicKey(task.user.address);
  const onchain = await fetchTaskEscrow(task.user.address, nonce);
  if (!onchain.account) {
    await prismaClient.task.update({
      where: { id: task.id },
      data: { settle_status: SettleStatus.Settled },
    });
    return;
  }
  const commitment = Buffer.from(task.vote_commitment, "hex");
  const authority = treasuryKeypair.publicKey;

  if (!onchain.account.voteCommitment.some((byte) => byte !== 0)) {
    await sendIx(
      commitVotesInstruction({
        authority,
        creator,
        nonce,
        voteCommitment: commitment,
        winnerOptionId: task.winner_option_id ?? 0,
        programId: programId(),
      }),
    );
  }

  const unpaid = task.submissions.filter((row) => !row.payout_signature && row.amount > 0);
  for (let i = 0; i < unpaid.length; i += MAX_SETTLE_CHUNK) {
    const chunk = unpaid.slice(i, i + MAX_SETTLE_CHUNK);
    const signature = await sendIx(
      settleChunkInstruction({
        authority,
        creator,
        nonce,
        workers: chunk.map((row) => new PublicKey(row.worker.address)),
        amounts: chunk.map((row) => row.amount),
        programId: programId(),
      }),
    );

    await prismaClient.$transaction(
      chunk.map((row) =>
        prismaClient.submission.update({
          where: { id: row.id },
          data: { payout_signature: signature },
        }),
      ),
    );

    for (const row of chunk) {
      await prismaClient.payouts.upsert({
        where: {
          worker_id_signature: {
            worker_id: row.worker_id,
            signature,
          },
        },
        update: {
          status: TxnStatus.Success,
          amount: row.amount,
          source: PayoutSource.Escrow,
        },
        create: {
          worker_id: row.worker_id,
          amount: row.amount,
          signature,
          status: TxnStatus.Success,
          source: PayoutSource.Escrow,
        },
      });
    }
  }

  const afterPay = await fetchTaskEscrow(task.user.address, nonce);
  if (afterPay.account && !afterPay.account.settled) {
    await sendIx(
      closeTaskInstruction({
        authority,
        creator,
        nonce,
        programId: programId(),
      }),
    );
  }

  await prismaClient.task.update({
    where: { id: task.id },
    data: { settle_status: SettleStatus.Settled },
  });
}

export async function reconcileEscrowSettles() {
  if (!isOnchainSettlement()) {
    return;
  }
  const open = await prismaClient.task.findMany({
    where: {
      settle_status: { in: [SettleStatus.Settling, SettleStatus.Failed] },
    },
    select: { id: true },
  });
  for (const task of open) {
    try {
      await settleEscrow(task.id);
    } catch (err) {
      console.error("escrow settle retry failed", task.id, err);
      await prismaClient.task.update({
        where: { id: task.id },
        data: { settle_status: SettleStatus.Failed },
      });
    }
  }
}
