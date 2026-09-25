import { indexTaskFromChain } from "../src/solana/escrow";
import { prismaClient } from "db/client";

async function main() {
  const taskId = Number(process.argv[2]);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    console.error("usage: bun scripts/index-escrow.ts <taskId>");
    process.exitCode = 1;
    return;
  }

  const updated = await indexTaskFromChain(taskId);
  if (!updated) {
    console.error("task not found or has no escrow_pda");
    process.exitCode = 1;
    return;
  }
  console.log({
    id: updated.id,
    escrow_pda: updated.escrow_pda,
    vote_commitment: updated.vote_commitment,
    settle_status: updated.settle_status,
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
