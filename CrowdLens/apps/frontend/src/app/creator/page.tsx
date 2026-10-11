import Link from "next/link";
import { TaskList } from "./components/TaskList";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">Creator portal</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Tasks</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Open and finished batches. Open a task to see the winner, progress, and export.
          </p>
        </div>
        <Link
          href="/creator/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-500 px-4 text-sm font-medium text-white hover:bg-violet-600"
        >
          + New task
        </Link>
      </div>
      <TaskList />
    </div>
  );
}
