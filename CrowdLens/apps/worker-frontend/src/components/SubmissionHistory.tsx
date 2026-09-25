"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { isUiPreview, MOCK_WORKER_SUBMISSIONS } from "@/lib/ui-preview";
import { api } from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { formatSol, explorerUrl, isOnChainSignature } from "@/lib/payouts";

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
    return <StatusCard>Loading history…</StatusCard>;
  }

  if (unauthenticated) {
    return <StatusCard>Connect your wallet to see past votes.</StatusCard>;
  }

  if (error) {
    return (
      <StatusCard
        action={
          <button
            type="button"
            onClick={fetchSubmissions}
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

  if (submissions.length === 0) {
    return <StatusCard>No votes yet. Pick a task on Vote to get started.</StatusCard>;
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4"
        >
          {submission.option.type === "Text" ? (
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-slate-950 p-2 text-xs leading-snug text-slate-400">
              {snippet(submission.option.content ?? "")}
            </div>
          ) : (
            <img
              src={submission.option.image_url}
              alt=""
              className="h-20 w-28 shrink-0 rounded-md object-cover bg-slate-950"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium truncate">{submission.task.title}</h2>
              <span
                className={
                  submission.task.done
                    ? "text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-400"
                    : "text-xs rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400"
                }
              >
                {submission.task.done ? "Done" : "Open"}
              </span>
              <span className="ml-auto text-sm text-emerald-400">
                {formatSol(submission.amount)} SOL
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
              <p className="mt-2 text-sm text-slate-400">{submission.comment}</p>
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

function StatusCard({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center">
      <div className="text-lg font-medium text-slate-300">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
