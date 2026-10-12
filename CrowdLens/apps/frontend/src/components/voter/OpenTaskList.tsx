"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isUiPreview } from "@/lib/ui-preview";
import { MOCK_WORKER_TASK_ROWS, type PreviewTaskRow } from "@/lib/voter/ui-preview";
import { api } from "@/lib/voter/api";
import { useAuthSession } from "@/lib/voter/use-auth-session";
import { useEconomics } from "@/lib/use-economics";
import { formatUsdAndSol } from "@/lib/money";
import { StatusPanel } from "@/components/StatusPanel";

export function OpenTaskList() {
  const { token, waitingForAuth, unauthenticated } = useAuthSession();
  const { economics } = useEconomics();
  const [tasks, setTasks] = useState<PreviewTaskRow[]>(isUiPreview ? MOCK_WORKER_TASK_ROWS : []);
  const [loading, setLoading] = useState(!isUiPreview);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (isUiPreview) {
      setTasks(MOCK_WORKER_TASK_ROWS);
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
        : "Failed to load votes";
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
    return <StatusPanel>Loading open votes…</StatusPanel>;
  }

  if (unauthenticated) {
    return <StatusPanel>Connect your wallet to see open votes.</StatusPanel>;
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
          <button
            type="button"
            onClick={fetchTasks}
            className="rounded-lg bg-violet-500 px-4 py-2 text-white hover:bg-violet-600"
          >
            Refresh
          </button>
        }
      >
        No open votes right now
      </StatusPanel>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/validators/task/${task.id}`}
          className="flex gap-4 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-violet-500/40"
        >
          {task.optionType === "Text" ? (
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-subtle p-2 text-xs leading-snug text-fg-muted">
              {task.preview || "Caption"}
            </div>
          ) : task.thumbnail ? (
            <img
              src={task.thumbnail}
              alt=""
              className="h-20 w-28 shrink-0 rounded-md object-cover bg-canvas"
            />
          ) : (
            <div className="h-20 w-28 shrink-0 rounded-md bg-subtle" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium truncate">{task.title || "Untitled vote"}</h2>
              <span className="text-xs rounded-full border border-line px-2 py-0.5 text-fg-muted">
                Image
              </span>
              <span className="ml-auto text-sm text-emerald-400">
                {formatUsdAndSol(task.reward, economics.solUsd)}
              </span>
            </div>
            <div className="mt-2 text-sm text-fg-muted">
              {task.submission_count} / {task.required_submissions} votes
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

