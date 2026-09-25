-- Phase 8: on-chain escrow index columns and payout source.

CREATE TYPE "SettleStatus" AS ENUM ('Offchain', 'Escrowed', 'Settling', 'Settled', 'Failed');
CREATE TYPE "PayoutSource" AS ENUM ('Treasury', 'Escrow');

ALTER TABLE "Task" ADD COLUMN "escrow_pda" TEXT;
ALTER TABLE "Task" ADD COLUMN "escrow_nonce" INTEGER;
ALTER TABLE "Task" ADD COLUMN "vote_commitment" TEXT;
ALTER TABLE "Task" ADD COLUMN "settle_status" "SettleStatus" NOT NULL DEFAULT 'Offchain';

CREATE INDEX "Task_escrow_pda_idx" ON "Task"("escrow_pda");

ALTER TABLE "Submission" ADD COLUMN "payout_signature" TEXT;

ALTER TABLE "Payouts" ADD COLUMN "source" "PayoutSource" NOT NULL DEFAULT 'Treasury';

DROP INDEX "Payouts_signature_key";
CREATE UNIQUE INDEX "Payouts_worker_id_signature_key" ON "Payouts"("worker_id", "signature");
