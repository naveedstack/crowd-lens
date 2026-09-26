import { EarningsStats } from "@/components/voter/EarningsStats";
import { PayoutHistory } from "@/components/voter/PayoutHistory";

export default function EarningsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent md:text-4xl">
        Earnings
      </h1>
      <p className="mb-8 max-w-2xl text-slate-400">
        Pending SOL can be withdrawn once it reaches one vote payout ($0.50 at the live SOL rate).
      </p>
      <EarningsStats />
      <PayoutHistory showEmpty />
    </div>
  );
}
