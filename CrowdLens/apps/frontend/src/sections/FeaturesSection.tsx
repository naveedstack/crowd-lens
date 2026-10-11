import { Users, BarChart3, Wallet, Shield, Clock, Coins } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Card from "../components/Card";

const features = [
  {
    icon: Users,
    title: "Real human votes",
    description: "Validators with connected wallets pick the image they would click. No bot panel, no AI ranking.",
  },
  {
    icon: Wallet,
    title: "On-chain escrow",
    description: "Creator SOL sits in a task PDA until the batch fills. Voters are paid from that escrow.",
  },
  {
    icon: BarChart3,
    title: "Public winner",
    description: "When votes close, the majority option and a hash of the vote set are committed on Solana.",
  },
  {
    icon: Coins,
    title: "Pay per vote",
    description: "Creators pay $1 per vote in SOL. Validators earn $0.80 per vote (80% of escrow). No subscription.",
  },
  {
    icon: Shield,
    title: "Aligned reputation",
    description: "Voters who match the majority gain reputation. Outliers earn less and lose a few points.",
  },
  {
    icon: Clock,
    title: "Export when done",
    description: "See vote counts, turnaround, and download CSV or JSON. CrowdLens does not invent click-through rates.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Built for image comparisons"
          subtitle="Thumbnails and posters. Two to five options. Humans vote. SOL settles the result."
          centered
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} hover>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
