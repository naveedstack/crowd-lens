import SectionHeading from "../components/SectionHeading";
import { Reveal } from "@/components/landing/Reveal";

const points = [
  {
    title: "Vote split",
    body: "Each image shows its vote count and share of the batch.",
  },
  {
    title: "A winner",
    body: "The batch closes when the required votes are in. Ties are marked Done · Tie.",
  },
  {
    title: "An export",
    body: "Download votes as CSV or JSON. Published case studies stay on the case studies page.",
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title="What a finished batch shows"
            subtitle="Results come from the votes on that task. CrowdLens does not add click-through rates."
            centered
          />
        </Reveal>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {points.map((point, index) => (
            <Reveal key={point.title} delayMs={index * 80}>
              <div className="landing-card rounded-2xl border border-line bg-card p-6">
                <h3 className="font-display text-lg font-semibold text-fg">{point.title}</h3>
                <p className="mt-3 text-fg-muted">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
