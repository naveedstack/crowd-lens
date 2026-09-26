"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { isUiPreview } from "@/lib/ui-preview";
import { api } from "@/lib/voter/api";
import { useAuthSession } from "@/lib/voter/use-auth-session";
import {
  explorerUrl,
  formatSol,
  isOnChainSignature,
  notifyPayouts,
  subscribePayouts,
} from "@/lib/voter/payouts";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";

type Balance = {
  pendingBal: number;
  lockedBal: number;
  unsettledBal: number;
  minPayout: number;
};

const PREVIEW_BALANCE: Balance = {
  pendingBal: 2_000_000,
  lockedBal: 0,
  unsettledBal: 1_000_000,
  minPayout: 1_000_000,
};

export function WorkerBalance() {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [balance, setBalance] = useState<Balance | null>(isUiPreview ? PREVIEW_BALANCE : null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => subscribePayouts(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    if (isUiPreview) {
      setBalance(PREVIEW_BALANCE);
      return;
    }
    if (waitingForAuth || unauthenticated || !token) {
      setBalance(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await api.get<Balance>("/balance");
        if (!cancelled) {
          setBalance(response.data);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, waitingForAuth, unauthenticated, tick]);

  async function withdraw() {
    if (isUiPreview) {
      toast.success("Withdraw skipped in UI preview");
      return;
    }

    try {
      setWithdrawing(true);
      const response = await api.post<{
        signature: string;
        amount: number;
        status: string;
      }>("/payout");
      const sig = response.data.signature;
      toast.success(
        `Withdrew ${formatSol(response.data.amount)} SOL`,
      );
      if (isOnChainSignature(sig)) {
        window.open(explorerUrl(sig), "_blank", "noopener,noreferrer");
      }
      notifyPayouts();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Withdraw failed";
      toast.error(message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (!balance) {
    return null;
  }

  const canWithdraw =
    !withdrawing &&
    balance.lockedBal <= 0 &&
    balance.pendingBal >= balance.minPayout;

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-right leading-tight">
        <div className="text-emerald-400 font-medium">
          {formatUsdAndSol(balance.pendingBal, economics.solUsd)}
        </div>
        <div className="text-slate-400 text-xs">
          {balance.lockedBal > 0
            ? `Locked ${formatSol(balance.lockedBal)}`
            : balance.unsettledBal > 0
              ? `Settling ${formatSol(balance.unsettledBal)}`
              : "Pending"}
        </div>
      </div>
      <button
        type="button"
        onClick={withdraw}
        disabled={!canWithdraw}
        className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {withdrawing ? "Withdrawing..." : "Withdraw"}
      </button>
    </div>
  );
}
