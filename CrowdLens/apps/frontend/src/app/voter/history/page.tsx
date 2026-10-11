import { redirect } from "next/navigation";
import { validatorPaths } from "@/lib/routes";

export default function VoterHistoryRedirect() {
  redirect(validatorPaths.history);
}
