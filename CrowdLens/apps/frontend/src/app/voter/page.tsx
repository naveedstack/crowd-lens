import { redirect } from "next/navigation";
import { validatorPaths } from "@/lib/routes";

export default function VoterRedirect() {
  redirect(validatorPaths.votes);
}
