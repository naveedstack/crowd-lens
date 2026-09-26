import React from "react";
import Link from "next/link";
import SectionHeading from "../components/SectionHeading";

const points = [
  {
    title: "Vote split",
    body: "Each image shows its vote count and share of the batch.",
  },
  {
    title: "A winner",
    body: "The batch closes when the required votes are in, including a tie.",
  },
  {
    title: "An export",
    body: "Download the votes as CSV or JSON. Published case studies stay on the case studies page.",
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="bg-slate-900 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="What a finished batch shows"
          subtitle="Results come from the votes on that task. CrowdLens does not add click-through rates."
          centered
          light
        />
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{point.title}</h3>
              <p className="mt-3 text-slate-400">{point.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/case-studies" className="text-sm text-violet-400 hover:text-violet-300">
            View case studies
          </Link>
        </p>
      </div>
    </section>
  );
};

export default TestimonialsSection;
