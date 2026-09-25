import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import caseStudies from "@/content/case-studies.json";

type CaseStudy = {
  title: string;
  creatorLabel: string;
  optionType: string;
  votes: number;
  turnaround: string;
  ctrBefore?: number | null;
  ctrAfter?: number | null;
  summary: string;
};

const studies = caseStudies as CaseStudy[];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
          Case studies
        </h1>
        <p className="mt-3 text-slate-400 max-w-2xl">
          Before-and-after results from real creator batches. CTR is optional and filled in by the creator — we do not invent numbers.
        </p>

        {studies.length === 0 ? (
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10">
            <p className="text-slate-300">No published case studies yet.</p>
            <p className="mt-3 text-sm text-slate-400">
              After a pilot batch, add an entry to{" "}
              <code className="text-slate-200">apps/frontend/src/content/case-studies.json</code>.
              Outreach, interview questions, and CTR fields are in <code className="text-slate-200">PILOT.md</code>{" "}
              at the repo root.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6">
            {studies.map((study) => (
              <article
                key={`${study.creatorLabel}-${study.title}`}
                className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-6"
              >
                <h2 className="text-xl font-semibold">{study.title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {study.creatorLabel} · {study.optionType} · {study.votes} votes · {study.turnaround}
                </p>
                {(study.ctrBefore != null || study.ctrAfter != null) && (
                  <p className="mt-2 text-sm text-cyan-300">
                    CTR {study.ctrBefore != null ? `${study.ctrBefore}%` : "—"} →{" "}
                    {study.ctrAfter != null ? `${study.ctrAfter}%` : "—"}
                  </p>
                )}
                <p className="mt-4 text-slate-300">{study.summary}</p>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
