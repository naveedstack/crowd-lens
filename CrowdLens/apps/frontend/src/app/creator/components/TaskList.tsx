"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isUiPreview, MOCK_TASK_LIST, type PreviewTaskRow } from "@/lib/ui-preview";
import { api } from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";

export function TaskList() {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [tasks, setTasks] = useState<PreviewTaskRow[]>(isUiPreview ? MOCK_TASK_LIST : []);
  const [loading, setLoading] = useState(!isUiPreview);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (isUiPreview) {
      setTasks(MOCK_TASK_LIST);
      setLoading(false);
      setError(null);
      return;
    }
    if (waitingForAuth) {
      return;
    }
    if (unauthenticated || !token) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ tasks: PreviewTaskRow[] }>("/tasks");
      setTasks(response.data.tasks);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to load tasks";
      setError(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token, waitingForAuth, unauthenticated]);

  if (waitingForAuth || loading) {
    return <StatusCard>Loading your tasks…</StatusCard>;
  }

  if (unauthenticated) {
    return <StatusCard>Connect your wallet to see your tasks.</StatusCard>;
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
            onClick={fetchTasks}
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

  if (tasks.length === 0) {
    return (
      <StatusCard
        action={
          <Link
            href="/creator/new"
            className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-500"
          >
            New task
          </Link>
        }
      >
        No tasks yet
      </StatusCard>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isTie = task.done && task.winner_option_id == null && task.submission_count > 0;
        const status = task.done ? (isTie ? "Done · Tie" : "Done") : "Open";
        return (
          <Link
            key={task.id}
            href={`/creator/task/${task.id}`}
            className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-violet-500/50"
          >
            {task.optionType === "Text" ? (
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-slate-950 p-2 text-xs leading-snug text-slate-400">
                {task.preview || "Caption"}
              </div>
            ) : task.thumbnail ? (
              <img
                src={task.thumbnail}
                alt=""
                className="h-20 w-28 shrink-0 rounded-md object-cover bg-slate-950"
              />
            ) : (
              <div className="h-20 w-28 shrink-0 rounded-md bg-slate-950" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-medium">{task.title || "Untitled task"}</h2>
                <span
                  className={
                    task.done
                      ? "shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"
                      : "shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
                  }
                >
                  {status}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {task.submission_count} / {task.required_submissions} votes
              </div>
            </div>
            <div className="text-right text-sm text-slate-300">
              {formatUsdAndSol(task.amount, economics.solUsd)}
            </div>
          </Link>
        );
      })}
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center">
      <div className="text-lg font-medium text-slate-300">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
