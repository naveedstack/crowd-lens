-- Wipe unused user-linked payouts, then attach payouts to Worker.
DELETE FROM "Payouts";

ALTER TABLE "Payouts" DROP CONSTRAINT "Payouts_user_id_fkey";
ALTER TABLE "Payouts" DROP COLUMN "user_id";
ALTER TABLE "Payouts" ADD COLUMN "worker_id" INTEGER NOT NULL;
ALTER TABLE "Payouts" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Payouts_signature_key" ON "Payouts"("signature");

ALTER TABLE "Payouts" ADD CONSTRAINT "Payouts_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
