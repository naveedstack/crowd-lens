import { Appbar } from "@/components/Appbar";
import { OpenTaskList } from "@/components/OpenTaskList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Appbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent md:text-4xl">
          Open votes
        </h1>
        <p className="mb-8 max-w-2xl text-slate-400">
          Pick a batch, then vote on the detail page. Rewards settle when the batch fills.
        </p>
        <OpenTaskList />
      </div>
    </div>
  );
}
