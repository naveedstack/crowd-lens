"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { isUiPreview } from "@/lib/ui-preview";
import { MOCK_WORKER_SUBMISSIONS } from "@/lib/voter/ui-preview";
import { api } from "@/lib/voter/api";
import { useAuthSession } from "@/lib/voter/use-auth-session";
import { explorerUrl, isOnChainSignature } from "@/lib/voter/payouts";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";
import { StatusPanel } from "@/components/StatusPanel";

type Submission = {
  id: number;
  amount: number;
  comment: string | null;
  payout_signature?: string | null;
  task: { id: number; title: string; done: boolean };
  option: { id: number; image_url: string; content?: string; type?: "Image" | "Text" };
};

export function SubmissionHistory() {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [submissions, setSubmissions] = useState<Submission[]>(
    isUiPreview ? MOCK_WORKER_SUBMISSIONS : [],
  );
  const [loading, setLoading] = useState(!isUiPreview);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (isUiPreview) {
      setSubmissions(MOCK_WORKER_SUBMISSIONS);
      setLoading(false);
      setError(null);
      return;
    }
    if (waitingForAuth) {
      return;
    }
    if (unauthenticated || !token) {
      setSubmissions([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ submissions: Submission[] }>("/submissions");
      setSubmissions(response.data.submissions);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to load history";
      setError(message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [token, waitingForAuth, unauthenticated]);

  if (waitingForAuth || loading) {
    return <StatusPanel>Loading history…</StatusPanel>;
  }

  if (unauthenticated) {
    return <StatusPanel>Connect your wallet to see past votes.</StatusPanel>;
  }

  if (!token) {
    return (
      <StatusPanel>
        Wallet is connected, but sign-in did not finish. Approve the signature in Phantom.
      </StatusPanel>
    );
  }

  if (error) {
    return (
      <StatusPanel
        action={
          <button
            type="button"
            onClick={fetchSubmissions}
            className="rounded-lg bg-violet-500 px-4 py-2 text-white hover:bg-violet-600"
          >
            Try again
          </button>
        }
      >
        {error}
      </StatusPanel>
    );
  }

  if (submissions.length === 0) {
    return <StatusPanel>No votes yet. Pick a task on Votes to get started.</StatusPanel>;
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="flex gap-4 rounded-2xl border border-line bg-card p-4"
        >
          {submission.option.type === "Text" ? (
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-subtle p-2 text-xs leading-snug text-fg-muted">
              {snippet(submission.option.content ?? "")}
            </div>
          ) : (
            <img
              src={submission.option.image_url}
              alt=""
              className="h-20 w-28 shrink-0 rounded-md object-cover bg-canvas"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium truncate">{submission.task.title}</h2>
              <span
                className={
                  submission.task.done
                    ? "text-xs rounded-full border border-line px-2 py-0.5 text-fg-muted"
                    : "text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400"
                }
              >
                {submission.task.done ? "Done" : "Open"}
              </span>
              <span className="ml-auto text-sm text-emerald-400">
                {formatUsdAndSol(submission.amount, economics.solUsd)}
              </span>
              {submission.payout_signature && isOnChainSignature(submission.payout_signature) ? (
                <a
                  className="text-xs text-violet-400 hover:underline"
                  href={explorerUrl(submission.payout_signature)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Paid from escrow
                </a>
              ) : null}
            </div>
            {submission.comment ? (
              <p className="mt-2 text-sm text-fg-muted">{submission.comment}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function snippet(value: string, max = 80) {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

