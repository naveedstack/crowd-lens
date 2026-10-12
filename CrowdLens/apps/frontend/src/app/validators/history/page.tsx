import { SubmissionHistory } from "@/components/voter/SubmissionHistory";

export default function ValidatorHistoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">History</h1>
      <p className="mt-2 mb-8 max-w-2xl text-fg-muted">Votes you have already submitted.</p>
      <SubmissionHistory />
    </div>
  );
}
