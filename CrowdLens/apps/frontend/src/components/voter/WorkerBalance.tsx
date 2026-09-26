"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
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
import { formatUsdAndSol, pendingCanWithdraw } from "@/lib/money";

type Balance = {
  pendingBal: number;
  lockedBal: number;
  unsettledBal: number;
  minPayout: number;
  lastPaidLamports?: number;
  lastPaidSignature?: string | null;
};

const PREVIEW_BALANCE: Balance = {
  pendingBal: 2_000_000,
  lockedBal: 0,
  unsettledBal: 1_000_000,
  minPayout: 1_000_000,
  lastPaidLamports: 2_000_000,
  lastPaidSignature: "preview-success",
};

export function WorkerBalance() {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [balance, setBalance] = useState<Balance | null>(isUiPreview ? PREVIEW_BALANCE : null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [tick, setTick] = useState(0);
  const requestId = useRef(0);

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

    const id = ++requestId.current;
    (async () => {
      try {
        const response = await api.get<Balance>("/balance");
        if (id === requestId.current) {
          setBalance(response.data);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token, waitingForAuth, unauthenticated, tick, economics.quotedAt]);

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

  const liveMinimum =
    economics.lamportsPerVotePayout > 0
      ? Math.min(balance.minPayout, economics.lamportsPerVotePayout)
      : balance.minPayout;
  const canWithdraw =
    !withdrawing &&
    balance.lockedBal <= 0 &&
    pendingCanWithdraw(
      balance.pendingBal,
      liveMinimum,
      economics.solUsd,
      economics.usdPerVoteVoter,
    );
  const lastPaid = balance.lastPaidLamports ?? 0;
  const onchain = economics.settlementMode === "onchain";
  const showPending = canWithdraw || balance.pendingBal > 0 || !onchain;
  const shownLamports = showPending ? balance.pendingBal : lastPaid;
  const paidSignature =
    !showPending && balance.lastPaidSignature && isOnChainSignature(balance.lastPaidSignature)
      ? balance.lastPaidSignature
      : null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-right leading-tight">
        <div className="text-emerald-400 font-medium">
          {formatUsdAndSol(shownLamports, economics.solUsd)}
        </div>
        <div className="text-slate-400 text-xs">
          {balance.lockedBal > 0
            ? `Locked ${formatSol(balance.lockedBal)}`
            : balance.unsettledBal > 0
              ? `Settling ${formatSol(balance.unsettledBal)}`
              : showPending
                ? "Pending"
                : paidSignature
                  ? (
                    <a
                      className="text-violet-400 hover:underline"
                      href={explorerUrl(paidSignature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Paid to Devnet wallet
                    </a>
                  )
                  : "Paid to Devnet wallet"}
        </div>
      </div>
      {onchain && !canWithdraw ? null : (
        <button
          type="button"
          onClick={withdraw}
          disabled={!canWithdraw}
          className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {withdrawing ? "Withdrawing..." : "Withdraw"}
        </button>
      )}
    </div>
  );
}
