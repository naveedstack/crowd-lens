import Link from "next/link";
import { OpenTaskList } from "@/components/voter/OpenTaskList";
import { validatorPaths } from "@/lib/routes";

export default function ValidatorVotesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">Open votes</h1>
      <p className="mt-2 mb-8 max-w-2xl text-fg-muted">
        Pick a batch, then vote on the detail page. Rewards go to your Devnet wallet when the batch
        fills.{" "}
        <Link href={validatorPaths.guide} className="text-cyan-400 hover:text-cyan-400">
          How validating works
        </Link>
      </p>
      <OpenTaskList />
    </div>
  );
}
