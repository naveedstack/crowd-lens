import { prismaClient } from "db/client";
import { HttpError } from "./http";
import { MIN_TASK_DWELL_MS, MIN_VOTE_GAP_MS } from "./reputation";

export async function assertVoteAllowed(workerId: number, taskId: number) {
  const serve = await prismaClient.taskServe.findUnique({
    where: {
      worker_id_task_id: {
        worker_id: workerId,
        task_id: taskId,
      },
    },
  });

  if (!serve) {
    throw new HttpError(400, "Task not assigned");
  }

  if (Date.now() - serve.served_at.getTime() < MIN_TASK_DWELL_MS) {
    throw new HttpError(400, "Wait before voting");
  }

  const last = await prismaClient.submission.findFirst({
    where: { worker_id: workerId },
    orderBy: { created_at: "desc" },
  });

  if (last && Date.now() - last.created_at.getTime() < MIN_VOTE_GAP_MS) {
    throw new HttpError(400, "Voting too quickly");
  }
}
