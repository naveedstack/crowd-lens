"use client";

import { useEffect, useState } from "react";
import { isUiPreview } from "@/lib/ui-preview";
import { api } from "@/lib/voter/api";
import { useAuthSession } from "@/lib/voter/use-auth-session";
import {
  explorerUrl,
  isOnChainSignature,
  subscribePayouts,
} from "@/lib/voter/payouts";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";

type Payout = {
  id: number;
  amount: number;
  signature: string;
  status: string;
  source?: string;
  created_at: string;
};

const PREVIEW_PAYOUTS: Payout[] = [
  {
    id: 1,
    amount: 1_000_000,
    signature: "preview-success",
    status: "Success",
    source: "Escrow",
    created_at: new Date().toISOString(),
  },
];

export function PayoutHistory({ showEmpty = false }: { showEmpty?: boolean }) {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [payouts, setPayouts] = useState<Payout[]>(isUiPreview ? PREVIEW_PAYOUTS : []);
  const [tick, setTick] = useState(0);

  useEffect(() => subscribePayouts(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    if (isUiPreview) {
      setPayouts(PREVIEW_PAYOUTS);
      return;
    }
    if (waitingForAuth || unauthenticated || !token) {
      setPayouts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<{ payouts: Payout[] }>("/payouts");
        if (!cancelled) {
          setPayouts(response.data.payouts);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, waitingForAuth, unauthenticated, tick]);

  if (payouts.length === 0) {
    if (!showEmpty) {
      return null;
    }
    return (
      <div>
        <h2 className="font-display mb-3 text-lg font-semibold text-white">Payouts</h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-8 text-center text-slate-400">
          No payouts yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display mb-3 text-lg font-semibold text-white">Payouts</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Source</th>
              <th className="px-4 py-3 text-left font-medium">Explorer</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-t border-slate-800 bg-slate-900">
                <td className="px-4 py-3 font-medium text-white">
                  {formatUsdAndSol(payout.amount, economics.solUsd)}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(payout.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      payout.status === "Success"
                        ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"
                        : payout.status === "Failure"
                          ? "rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400"
                          : "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
                    }
                  >
                    {payout.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {payout.source === "Escrow" ? "Escrow" : "Treasury"}
                </td>
                <td className="px-4 py-3">
                  {isOnChainSignature(payout.signature) ? (
                    <a
                      className="text-cyan-400 hover:underline"
                      href={explorerUrl(payout.signature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Pending tx</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
