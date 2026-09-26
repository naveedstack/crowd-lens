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
    return <StatusCard>Loading open votes…</StatusCard>;
  }

  if (unauthenticated) {
    return <StatusCard>Connect your wallet to see open votes.</StatusCard>;
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
          <button
            type="button"
            onClick={fetchTasks}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
          >
            Refresh
          </button>
        }
      >
        No open votes right now
      </StatusCard>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/voter/task/${task.id}`}
          className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-violet-500/50"
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
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-medium truncate">{task.title || "Untitled vote"}</h2>
              <span className="text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">
                Image
              </span>
              <span className="ml-auto text-sm text-emerald-400">
                {formatUsdAndSol(task.reward, economics.solUsd)}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {task.submission_count} / {task.required_submissions} votes
            </div>
          </div>
        </Link>
      ))}
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
