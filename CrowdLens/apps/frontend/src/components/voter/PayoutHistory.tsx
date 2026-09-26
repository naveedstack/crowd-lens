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
        <h2 className="text-lg font-semibold mb-3">Payouts</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-8 text-center text-slate-400">
          No payouts yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Payouts</h2>
      <div className="space-y-2">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm"
          >
            <div>
              <div className="font-medium">{formatUsdAndSol(payout.amount, economics.solUsd)}</div>
              <div className="text-xs text-slate-400">
                {new Date(payout.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={
                  payout.status === "Success"
                    ? "text-emerald-400"
                    : payout.status === "Failure"
                      ? "text-red-400"
                      : "text-amber-400"
                }
              >
              {payout.status}
              {payout.source === "Escrow" ? " · escrow" : ""}
              </span>
              {isOnChainSignature(payout.signature) ? (
                <a
                  className="text-violet-400 hover:underline"
                  href={explorerUrl(payout.signature)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explorer
                </a>
              ) : (
                <span className="text-slate-500 text-xs">Pending tx</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
