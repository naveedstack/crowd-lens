-- Phase 10: per-task vote timeline queries.

CREATE INDEX "Submission_task_id_created_at_idx" ON "Submission"("task_id", "created_at");
