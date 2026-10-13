import { EarningsStats } from "@/components/voter/EarningsStats";
import { PayoutHistory } from "@/components/voter/PayoutHistory";

export default function ValidatorEarningsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">
        Earnings
      </h1>
      <p className="mt-2 mb-8 max-w-2xl text-fg-muted">
        On-chain votes send about $0.80 of Devnet SOL (80% of the creator escrow) to the connected
        wallet. Switch Phantom to Devnet to see it. Withdraw is only for leftover pending from older
        custodial tasks.
      </p>
      <EarningsStats />
      <PayoutHistory showEmpty />
    </div>
  );
}
