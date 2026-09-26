"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { isUiPreview } from "@/lib/ui-preview";
import { MOCK_WORKER_STATS } from "@/lib/voter/ui-preview";
import { api } from "@/lib/voter/api";
import { useAuthSession } from "@/lib/voter/use-auth-session";
import { subscribePayouts } from "@/lib/voter/payouts";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";

type Stats = {
  pendingBal: number;
  lockedBal: number;
  unsettledBal: number;
  minPayout: number;
  votesSubmitted: number;
  totalEarned: number;
  reputation: number;
  alignedVotes: number;
  outlierVotes: number;
};

export function EarningsStats() {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [stats, setStats] = useState<Stats | null>(isUiPreview ? MOCK_WORKER_STATS : null);
  const [loading, setLoading] = useState(!isUiPreview);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => subscribePayouts(() => setTick((n) => n + 1)), []);

  const fetchStats = async () => {
    if (isUiPreview) {
      setStats(MOCK_WORKER_STATS);
      setLoading(false);
      setError(null);
      return;
    }
    if (waitingForAuth) {
      return;
    }
    if (unauthenticated || !token) {
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Stats>("/stats");
      setStats(response.data);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to load earnings";
      setError(message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, waitingForAuth, unauthenticated, tick]);

  if (waitingForAuth || loading) {
    return (
      <StatusCard>Loading earnings…</StatusCard>
    );
  }

  if (unauthenticated) {
    return (
      <StatusCard>Connect your wallet to see earnings.</StatusCard>
    );
  }

  if (!token) {
    return (
      <StatusCard>
        Wallet is connected, but sign-in did not finish. Approve the signature in Phantom, and make sure the API is running.
      </StatusCard>
    );
  }

  if (error) {
    return (
      <StatusCard
        action={
          <button
            type="button"
            onClick={fetchStats}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
          >
            Try again
          </button>
        }
      >
        {error}
      </StatusCard>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    { label: "Total earned", value: formatUsdAndSol(stats.totalEarned, economics.solUsd) },
    { label: "Pending", value: formatUsdAndSol(stats.pendingBal, economics.solUsd) },
    { label: "Settling", value: formatUsdAndSol(stats.unsettledBal, economics.solUsd) },
    { label: "Locked", value: formatUsdAndSol(stats.lockedBal, economics.solUsd) },
    { label: "Votes submitted", value: String(stats.votesSubmitted) },
    { label: "Reputation", value: `${stats.reputation} · ${stats.alignedVotes} aligned / ${stats.outlierVotes} outlier` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-5"
        >
          <div className="text-sm text-slate-400">{card.label}</div>
          <div className="mt-1 text-2xl font-semibold">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusCard({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center mb-8">
      <div className="text-lg font-medium text-slate-300">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
