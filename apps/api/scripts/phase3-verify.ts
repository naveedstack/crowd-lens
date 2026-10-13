import jwt from "jsonwebtoken";
import { Keypair } from "@solana/web3.js";
import { TxnStatus } from "@prisma/client";
import { prismaClient } from "db/client";
import { env } from "../src/env";
import { HttpError } from "../src/http";
import { lockPendingForPayout, reconcileProcessingPayouts } from "../src/payouts/engine";
import { getTreasuryBalance } from "../src/solana/treasury";

const API = `http://localhost:${env.PORT}`;
const stamp = Date.now();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function workerToken(id: number, address: string) {
  return jwt.sign({ id, address }, env.WORKER_JWT_SECRET, { expiresIn: "24h" });
}

async function main() {
  const destination = Keypair.generate();
  const worker = await prismaClient.worker.create({
    data: {
      address: destination.publicKey.toBase58(),
      pending_amount: 0,
      locked_amount: 0,
    },
  });
  const token = workerToken(worker.id, worker.address);
  const auth = { Authorization: `Bearer ${token}` };

  const belowMin = await fetch(`${API}/api/v1/worker/payout`, {
    method: "POST",
    headers: auth,
  });
  const belowMinBody = await belowMin.json() as { error?: string };
  assert(belowMin.status === 400, `expected 400 below min, got ${belowMin.status}`);
  assert(belowMinBody.error === "Below minimum withdrawal", belowMinBody.error);
  console.log("ok below-minimum 400");

  await prismaClient.worker.update({
    where: { id: worker.id },
    data: { pending_amount: 1_000_000, locked_amount: 500_000 },
  });
  const inFlight = await fetch(`${API}/api/v1/worker/payout`, {
    method: "POST",
    headers: auth,
  });
  const inFlightBody = await inFlight.json() as { error?: string };
  assert(inFlight.status === 409, `expected 409, got ${inFlight.status}`);
  assert(inFlightBody.error === "Payout already in progress", inFlightBody.error);
  console.log("ok in-flight 409");

  await prismaClient.worker.update({
    where: { id: worker.id },
    data: { pending_amount: 1_000_000, locked_amount: 0 },
  });

  const treasuryBal = await getTreasuryBalance();
  if (treasuryBal < 1_010_000) {
    const empty = await fetch(`${API}/api/v1/worker/payout`, {
      method: "POST",
      headers: auth,
    });
    const emptyBody = await empty.json() as { error?: string };
    assert(empty.status === 400, `expected 400 empty treasury, got ${empty.status} ${JSON.stringify(emptyBody)}`);
    assert(emptyBody.error === "Treasury has insufficient SOL", emptyBody.error);
    const restored = await prismaClient.worker.findUnique({ where: { id: worker.id } });
    assert(restored?.pending_amount === 1_000_000, `pending not restored ${restored?.pending_amount}`);
    assert(restored?.locked_amount === 0, `locked not cleared ${restored?.locked_amount}`);
    console.log("ok empty-treasury failure restores pending");
  } else {
    console.log("skip empty-treasury (treasury already funded)");
  }

  try {
    await prismaClient.worker.update({
      where: { id: worker.id },
      data: { pending_amount: 500, locked_amount: 0 },
    });
    await lockPendingForPayout(worker.id);
    throw new Error("lock should reject below min");
  } catch (err) {
    assert(err instanceof HttpError && err.status === 400, "lock below min should 400");
  }

  const stale = await prismaClient.payouts.create({
    data: {
      worker_id: worker.id,
      amount: 1_000_000,
      signature: `pending:stale-${stamp}`,
      status: TxnStatus.Processing,
      created_at: new Date(Date.now() - 3 * 60 * 1000),
    },
  });
  await prismaClient.worker.update({
    where: { id: worker.id },
    data: { pending_amount: 0, locked_amount: 1_000_000 },
  });
  await reconcileProcessingPayouts();
  const after = await prismaClient.payouts.findUnique({ where: { id: stale.id } });
  const workerAfter = await prismaClient.worker.findUnique({ where: { id: worker.id } });
  assert(after?.status === TxnStatus.Failure, `stale payout ${after?.status}`);
  assert(workerAfter?.pending_amount === 1_000_000, `reconcile pending ${workerAfter?.pending_amount}`);
  assert(workerAfter?.locked_amount === 0, `reconcile locked ${workerAfter?.locked_amount}`);
  console.log("ok stale placeholder reconcile");

  const history = await fetch(`${API}/api/v1/worker/payouts`, { headers: auth });
  assert(history.ok, `GET /payouts ${history.status}`);
  const historyBody = await history.json() as { payouts: { id: number }[] };
  assert(historyBody.payouts.some((p) => p.id === stale.id), "history missing reconciled payout");
  console.log("ok GET /payouts");

  console.log("Phase 3 verification passed (local engine + empty-treasury/reconcile)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
