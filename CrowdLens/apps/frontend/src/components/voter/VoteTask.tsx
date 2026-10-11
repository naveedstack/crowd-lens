"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { isUiPreview } from "@/lib/ui-preview";
import { MOCK_WORKER_TASKS, type PreviewTask } from "@/lib/voter/ui-preview";
import { api } from "@/lib/voter/api";
import { getToken } from "@/lib/voter/auth";
import { useAuthSession } from "@/lib/voter/use-auth-session";
import { notifyPayouts } from "@/lib/voter/payouts";
import { useEconomics } from "@/lib/use-economics";
import { formatUsd, formatUsdAndSol } from "@/lib/money";

const COMMENT_MAX = 280;

export function VoteTask() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const taskId = Number(params.taskId);
  const [currentTask, setCurrentTask] = useState<PreviewTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const { token, waitingForAuth, unauthenticated, authTick } = useAuthSession();
  const { economics } = useEconomics();

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isUiPreview) {
        setCurrentTask(MOCK_WORKER_TASKS.find((task) => task.id === taskId) ?? null);
        return;
      }

      if (waitingForAuth) {
        return;
      }

      if (unauthenticated || !token) {
        setCurrentTask(null);
        return;
      }

      if (!Number.isInteger(taskId) || taskId <= 0) {
        setCurrentTask(null);
        setError("Task not found");
        return;
      }

      const response = await api.get<{ task: PreviewTask }>("/task", {
        params: { taskId },
      });
      setCurrentTask(response.data.task);
      setComment("");
      setSelectedOptionId(null);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to load vote";
      setError(message);
      setCurrentTask(null);
    } finally {
      if (waitingForAuth) {
        return;
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId, token, waitingForAuth, unauthenticated, authTick]);

  const handleSubmission = async () => {
    if (selectedOptionId == null || !currentTask) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      if (isUiPreview) {
        notifyPayouts();
        toast.success("Vote recorded");
        router.push("/validators/votes");
        return;
      }

      if (!getToken()) {
        throw new Error("Authentication token not found, connect wallet and sign in");
      }

      const trimmed = comment.trim();
      const response = await api.post<{ amount?: number }>("/submission", {
        taskId: currentTask.id.toString(),
        selection: selectedOptionId.toString(),
        ...(trimmed ? { comment: trimmed.slice(0, COMMENT_MAX) } : {}),
      });

      notifyPayouts();
      const paid = typeof response.data.amount === "number" ? response.data.amount : 0;
      if (paid > 0 && economics.settlementMode === "onchain") {
        toast.success(
          `Vote recorded. ${formatUsdAndSol(paid, economics.solUsd)} sent to your Devnet wallet.`,
        );
      } else if (paid > 0) {
        toast.success(
          `Vote recorded. ${formatUsdAndSol(paid, economics.solUsd)} added to pending.`,
        );
      } else {
        toast.success("Vote recorded");
      }
      router.push("/validators/votes");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : err instanceof Error
          ? err.message
          : "Failed to submit vote";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (waitingForAuth || loading) {
    return <VoteStatus>Loading vote…</VoteStatus>;
  }

  if (unauthenticated) {
    return <VoteStatus>Connect your wallet to vote.</VoteStatus>;
  }

  if (!token) {
    return (
      <VoteStatus>
        Wallet is connected, but sign-in did not finish. Approve the signature in Phantom, and make sure the API is running.
      </VoteStatus>
    );
  }

  if (error && !currentTask) {
    return (
      <VoteStatus
        action={
          <Link href="/validators/votes" className="rounded-lg bg-violet-500 px-4 py-2 text-white hover:bg-violet-600">
            Back to votes
          </Link>
        }
      >
        {error}
      </VoteStatus>
    );
  }

  if (!currentTask) {
    return (
      <VoteStatus
        action={
          <Link href="/validators/votes" className="rounded-lg bg-violet-500 px-4 py-2 text-white hover:bg-violet-600">
            Back to votes
          </Link>
        }
      >
        This vote is no longer available
      </VoteStatus>
    );
  }

  const required = currentTask.required_submissions;
  const submitted = currentTask.submission_count;
  const showProgress = typeof required === "number" && typeof submitted === "number";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <div className="pt-8">
        <Link href="/validators/votes" className="text-sm text-slate-400 hover:text-white">
          ← All open votes
        </Link>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">{currentTask.title}</h1>
        {typeof currentTask.reward === "number" && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
            Earn {formatUsdAndSol(currentTask.reward, economics.solUsd)}
          </span>
        )}
        {showProgress && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-sm font-medium text-slate-300">
            {submitted} / {required} votes filled
          </span>
        )}
        {submitting && <span className="text-sm text-cyan-400 animate-pulse">Submitting…</span>}
      </div>
      <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400">
        When this batch fills, about {formatUsd(economics.usdPerVoteVoter)} of Devnet SOL (80% of the
        creator escrow) is sent to your connected wallet. Switch Phantom to Devnet to see it.
      </p>
      {error && <div className="mt-4 text-sm text-rose-400">{error}</div>}
      </div>
      <div className="grid grid-cols-1 gap-6 pt-8 md:grid-cols-2 lg:grid-cols-3">
        {currentTask.options.map((option) =>
          option.type === "Text" ? (
            <TextOption
              key={option.id}
              content={option.content ?? ""}
              selected={selectedOptionId === option.id}
              onSelect={() => setSelectedOptionId(option.id)}
              disabled={submitting}
            />
          ) : (
            <Option
              key={option.id}
              imageUrl={option.image_url}
              selected={selectedOptionId === option.id}
              onSelect={() => setSelectedOptionId(option.id)}
              disabled={submitting}
            />
          ),
        )}
      </div>
      <div className="mx-auto mt-8 max-w-3xl space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <label className="block text-sm text-slate-400">
          Why did you pick this? (optional)
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, COMMENT_MAX))}
            maxLength={COMMENT_MAX}
            disabled={submitting}
            rows={3}
            placeholder="Why did you pick this?"
            className="mt-1 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <span className="mt-1 block text-right text-xs text-slate-500">
            {comment.length}/{COMMENT_MAX}
          </span>
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/validators/votes"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Back to Votes
          </Link>
          <button
            type="button"
            onClick={handleSubmission}
            disabled={submitting || selectedOptionId == null}
            className="rounded-lg bg-violet-500 px-6 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Voting..."
              : typeof currentTask.reward === "number"
                ? `Submit vote & earn ${formatUsdAndSol(currentTask.reward, economics.solUsd)}`
                : "Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VoteStatus({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
        <div className="text-lg font-medium text-slate-300">{children}</div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

function Option({
  imageUrl,
  selected,
  onSelect,
  disabled,
}: {
  imageUrl: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`relative group aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 ${
        selected ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950" : "border border-slate-800"
      }`}
    >
      <img
        onClick={disabled ? undefined : onSelect}
        className={`absolute inset-0 p-2 w-full h-full object-contain rounded-lg transition-transform cursor-pointer
                    ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
        src={imageUrl}
        alt="Task option"
      />
    </div>
  );
}

function TextOption({
  content,
  selected,
  onSelect,
  disabled,
}: {
  content: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`min-h-[12rem] rounded-lg border bg-slate-900/70 p-6 text-left transition-colors ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500"
          : "border-slate-800 hover:border-violet-500/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <p className="text-base leading-relaxed text-white">{content}</p>
    </button>
  );
}
