import { redirect } from "next/navigation";
import { validatorPaths } from "@/lib/routes";

export default async function VoterTaskRedirect({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  redirect(validatorPaths.task(taskId));
}
