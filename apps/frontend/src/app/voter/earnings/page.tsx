import { redirect } from "next/navigation";
import { validatorPaths } from "@/lib/routes";

export default function VoterEarningsRedirect() {
  redirect(validatorPaths.earnings);
}
