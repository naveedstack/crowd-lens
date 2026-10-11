"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isUiPreview, MOCK_TASK_LIST, type PreviewTaskRow } from "@/lib/ui-preview";
import { api } from "@/lib/api";
import { useAuthSession } from "@/lib/use-auth-session";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";
import { StatusPanel } from "@/components/StatusPanel";

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
    return <StatusPanel>Loading your tasks…</StatusPanel>;
  }

  if (unauthenticated) {
    return <StatusPanel>Connect your wallet to see your tasks.</StatusPanel>;
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
            onClick={fetchTasks}
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

  if (tasks.length === 0) {
    return (
      <StatusPanel
        action={
          <Link href="/creator/new" className="inline-block rounded-lg bg-violet-500 px-4 py-2 text-white hover:bg-violet-600">
            New task
          </Link>
        }
      >
        No tasks yet
      </StatusPanel>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isTie = task.done && task.winner_option_id == null && task.submission_count > 0;
        const status = task.done ? (isTie ? "Done · Tie" : "Done") : "Open";
        const filled =
          task.required_submissions > 0
            ? Math.min(100, Math.round((task.submission_count / task.required_submissions) * 100))
            : 0;
        return (
          <Link
            key={task.id}
            href={`/creator/task/${task.id}`}
            className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-violet-500/40 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
          >
            {task.optionType === "Text" ? (
              <div className="h-20 overflow-hidden rounded-lg bg-slate-950 p-2 text-xs leading-snug text-slate-400">
                {task.preview || "Caption"}
              </div>
            ) : task.thumbnail ? (
              <img
                src={task.thumbnail}
                alt=""
                className="h-20 w-full rounded-lg bg-slate-950 object-cover sm:w-28"
              />
            ) : (
              <div className="h-20 rounded-lg bg-slate-950 sm:w-28" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-medium text-white">{task.title || "Untitled task"}</h2>
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
              <div className="mt-3">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>
                    {task.submission_count} / {task.required_submissions} votes
                  </span>
                  <span>{filled}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full ${task.done ? "bg-emerald-500" : "bg-violet-500"}`}
                    style={{ width: `${filled}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-left text-sm text-slate-300 sm:text-right">
              <p className="text-xs text-slate-500">Escrow</p>
              <p className="font-medium text-white">{formatUsdAndSol(task.amount, economics.solUsd)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
