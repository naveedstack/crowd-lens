import { TaskList } from "./components/TaskList";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent md:text-4xl">
            Tasks
          </h1>
          <p className="max-w-2xl text-slate-400">
            Open and finished batches. Open a task to see the winner, progress, and export.
          </p>
        </div>
        <a
          href="/creator/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
        >
          New task
        </a>
      </div>
      <TaskList />
    </div>
  );
}
