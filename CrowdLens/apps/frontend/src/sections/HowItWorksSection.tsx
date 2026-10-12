import { Upload, Users, BarChart3, Award } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import { Reveal } from "@/components/landing/Reveal";

const steps = [
  {
    icon: Upload,
    title: "Upload images",
    description: "Add two to five thumbnails or posters and set how many votes you need (1–100).",
  },
  {
    icon: Users,
    title: "Escrow SOL",
    description: "Pay $1 per vote in SOL. Funds lock in a Solana Devnet PDA until the batch fills.",
  },
  {
    icon: BarChart3,
    title: "Humans vote",
    description: "Validators pick an option from a second wallet. Creators cannot vote on their own task.",
  },
  {
    icon: Award,
    title: "Winner + payout",
    description: "The majority option is committed on-chain. Aligned voters receive 80% of the escrow, paid in SOL.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title="How CrowdLens works"
            subtitle="Four steps from upload to an on-chain winner."
            centered
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delayMs={index * 80}>
              <div className="landing-card rounded-2xl border border-line bg-card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-subtle text-cyan-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold tracking-wider text-fg-muted uppercase">Step {index + 1}</p>
                <h3 className="font-display mt-2 text-lg font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
