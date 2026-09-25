-- AlterTable
ALTER TABLE "Task" ADD COLUMN "required_submissions" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Task" ALTER COLUMN "required_submissions" DROP DEFAULT;
ALTER TABLE "Task" ADD COLUMN "winner_option_id" INTEGER;
