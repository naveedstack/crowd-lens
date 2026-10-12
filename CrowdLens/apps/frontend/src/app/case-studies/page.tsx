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
    <div className="min-h-screen bg-canvas text-fg">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">
          Case studies
        </h1>
        <p className="mt-3 text-fg-muted max-w-2xl">
          Before-and-after results from real creator batches. CTR is optional and filled in by the creator — we do not invent numbers.
        </p>

        {studies.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-line bg-card px-6 py-10">
            <p className="text-fg-muted">No published case studies yet.</p>
            <p className="mt-3 text-sm text-fg-muted">
              After a pilot batch, add an entry to{" "}
              <code className="text-fg">apps/frontend/src/content/case-studies.json</code>.
              Outreach, interview questions, and CTR fields are in <code className="text-fg">PILOT.md</code>{" "}
              at the repo root.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6">
            {studies.map((study) => (
              <article
                key={`${study.creatorLabel}-${study.title}`}
                className="rounded-2xl border border-line bg-card px-6 py-6"
              >
                <h2 className="text-xl font-semibold">{study.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {study.creatorLabel} · {study.optionType} · {study.votes} votes · {study.turnaround}
                </p>
                {(study.ctrBefore != null || study.ctrAfter != null) && (
                  <p className="mt-2 text-sm text-cyan-400">
                    CTR {study.ctrBefore != null ? `${study.ctrBefore}%` : "—"} →{" "}
                    {study.ctrAfter != null ? `${study.ctrAfter}%` : "—"}
                  </p>
                )}
                <p className="mt-4 text-fg-muted">{study.summary}</p>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
