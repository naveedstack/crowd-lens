import jwt from "jsonwebtoken";
import {
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { prismaClient } from "db/client";
import { createTaskInstruction, findConfigPda } from "crowdlens-idl";
import { env } from "../src/env";
import { isOnchainSettlement } from "../src/economics";
import { treasuryConnection, treasuryKeypair } from "../src/solana/treasury";
import { submitVote } from "../src/taskLifecycle";
import { settleEscrow } from "../src/solana/escrow";

const API = `http://localhost:${env.PORT}`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  if (!isOnchainSettlement()) {
    console.log("skip phase8: SETTLEMENT_MODE is not onchain");
    return;
  }

  const programId = new PublicKey(env.CROWDLENS_PROGRAM_ID);
  const programInfo = await treasuryConnection.getAccountInfo(programId, "confirmed");
  if (!programInfo) {
    console.log(`skip phase8: program ${programId.toBase58()} is not deployed on ${env.RPC_URL}`);
    return;
  }

  const [config] = findConfigPda(programId);
  const configInfo = await treasuryConnection.getAccountInfo(config, "confirmed");
  if (!configInfo) {
    console.log("skip phase8: program config is not initialized (run scripts/init-crowdlens-program.ts)");
    return;
  }

  const creatorAddress = treasuryKeypair.publicKey.toBase58();
  const creator = await prismaClient.user.upsert({
    where: { address: creatorAddress },
    update: {},
    create: { address: creatorAddress },
  });
  const token = jwt.sign(
    { id: creator.id, address: creator.address },
    env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  const paramsRes = await fetch(
    `${API}/api/v1/user/task/onchain-params?requiredSubmissions=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  assert(paramsRes.ok, `onchain-params HTTP ${paramsRes.status}`);
  const params = await paramsRes.json() as {
    programId: string;
    nonce: number;
    taskPda: string;
    amount: number;
  };
  assert(params.amount === 1_000_000, "1-vote task should cost 0.001 SOL");

  const workerKey = Keypair.generate();
  const worker = await prismaClient.worker.create({
    data: {
      address: workerKey.publicKey.toBase58(),
      pending_amount: 0,
      locked_amount: 0,
    },
  });

  const workerBefore = await treasuryConnection.getBalance(workerKey.publicKey);
  const treasuryBefore = await treasuryConnection.getBalance(treasuryKeypair.publicKey);

  const createIx = createTaskInstruction({
    creator: treasuryKeypair.publicKey,
    amount: params.amount,
    required: 1,
    nonce: params.nonce,
    programId,
  });
  const signature = await sendAndConfirmTransaction(
    treasuryConnection,
    new Transaction().add(createIx),
    [treasuryKeypair],
    { commitment: "confirmed" },
  );

  const createRes = await fetch(`${API}/api/v1/user/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `phase8-onchain-${Date.now()}`,
      signature,
      requiredSubmissions: 1,
      options: [
        { imageUrl: "https://example.com/phase8-a.png" },
        { imageUrl: "https://example.com/phase8-b.png" },
      ],
    }),
  });
  assert(createRes.ok, `POST /task HTTP ${createRes.status} ${await createRes.text()}`);
  const created = await createRes.json() as { id: number };

  const task = await prismaClient.task.findUnique({
    where: { id: created.id },
    include: { options: true },
  });
  assert(task?.escrow_pda === params.taskPda, "escrow_pda should match onchain-params");
  assert(task.settle_status === "Escrowed", "new onchain task should be Escrowed");

  await prismaClient.$transaction((tx) =>
    submitVote(tx, {
      taskId: task.id,
      workerId: worker.id,
      optionId: task.options[0]!.id,
    }),
  );

  const afterVote = await prismaClient.task.findUnique({ where: { id: task.id } });
  assert(afterVote?.done === true, "1-vote task should close");
  assert(afterVote.vote_commitment, "vote_commitment should be indexed");
  assert(afterVote.settle_status === "Settling", "closed onchain task should be Settling");

  await settleEscrow(task.id);

  const settled = await prismaClient.task.findUnique({ where: { id: task.id } });
  const paidWorker = await prismaClient.worker.findUnique({ where: { id: worker.id } });
  const payout = await prismaClient.payouts.findFirst({
    where: { worker_id: worker.id },
    orderBy: { id: "desc" },
  });
  const submission = await prismaClient.submission.findFirst({
    where: { task_id: task.id, worker_id: worker.id },
  });
  const workerAfter = await treasuryConnection.getBalance(workerKey.publicKey);
  const treasuryAfter = await treasuryConnection.getBalance(treasuryKeypair.publicKey);

  assert(settled?.settle_status === "Settled", "task should be Settled");
  assert(paidWorker?.pending_amount === 0, "onchain settle must not credit pending");
  assert(paidWorker?.unsettled_amount === 0, "unsettled should clear");
  assert(payout?.status === "Success", "payout row should be Success");
  assert(payout?.source === "Escrow", "payout should be from escrow");
  assert(Boolean(submission?.payout_signature), "submission should store payout signature");
  assert(workerAfter - workerBefore === 1_000_000, "worker should receive 0.001 SOL from the PDA");
  assert(
    treasuryAfter <= treasuryBefore,
    "treasury wallet should not send the worker payout",
  );

  console.log("ok phase8 escrow + program payout", {
    taskId: task.id,
    escrow: task.escrow_pda,
    commitment: settled?.vote_commitment,
    payout: payout?.signature,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
