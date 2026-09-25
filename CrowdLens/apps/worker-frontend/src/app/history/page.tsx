import { Appbar } from "@/components/Appbar";
import { SubmissionHistory } from "@/components/SubmissionHistory";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Appbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent md:text-4xl">
          History
        </h1>
        <p className="mb-8 max-w-2xl text-slate-400">Votes you have already submitted.</p>
        <SubmissionHistory />
      </div>
    </div>
  );
}
