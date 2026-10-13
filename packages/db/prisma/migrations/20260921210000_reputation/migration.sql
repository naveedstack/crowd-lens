-- Phase 7: reputation, unsettled holds, dwell tracking.
-- Existing submissions are already credited to pending, so mark them settled.

ALTER TABLE "Worker" ADD COLUMN "unsettled_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Worker" ADD COLUMN "reputation" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Worker" ADD COLUMN "aligned_votes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Worker" ADD COLUMN "outlier_votes" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Submission" ADD COLUMN "settled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Submission" ALTER COLUMN "settled" SET DEFAULT false;
ALTER TABLE "Submission" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "TaskServe" (
    "worker_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "served_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskServe_pkey" PRIMARY KEY ("worker_id","task_id")
);

ALTER TABLE "TaskServe" ADD CONSTRAINT "TaskServe_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskServe" ADD CONSTRAINT "TaskServe_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
