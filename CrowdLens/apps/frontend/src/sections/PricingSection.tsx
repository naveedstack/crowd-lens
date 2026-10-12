"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Users } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Button from "../components/Button";
import { VoteCountControl } from "../components/VoteCountControl";
import { useEconomics } from "@/lib/use-economics";
import { formatUsd, formatUsdAndSol } from "@/lib/money";
import { Reveal } from "@/components/landing/Reveal";

const PricingSection: React.FC = () => {
  const router = useRouter();
  const { economics } = useEconomics();
  const [votes, setVotes] = useState(1);

  const creatorTotal = votes * economics.lamportsPerVote;
  const voterTotal = votes * economics.lamportsPerVotePayout;

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title="Simple pricing"
            subtitle="Creators pay $1 per vote. Voters earn $0.80 per vote (80% of escrow). You always pay and get paid in SOL at the live rate."
            centered
            light
          />
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          <Reveal delayMs={60}>
          <div className="landing-card rounded-2xl border border-line bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
              <Coins className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-fg-muted">Creators pay</p>
            <p className="mt-2 text-3xl font-bold text-fg">
              {formatUsd(economics.usdPerVoteCreator)}
              <span className="ml-2 text-base font-medium text-fg-muted">per vote</span>
            </p>
            <p className="mt-2 text-sm text-cyan-400">
              {formatUsdAndSol(economics.lamportsPerVote, economics.solUsd)}
            </p>
          </div>
          </Reveal>
          <Reveal delayMs={140}>
          <div className="landing-card rounded-2xl border border-line bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-fg-muted">Voters earn</p>
            <p className="mt-2 text-3xl font-bold text-fg">
              {formatUsd(economics.usdPerVoteVoter)}
              <span className="ml-2 text-base font-medium text-fg-muted">per vote</span>
            </p>
            <p className="mt-2 text-sm text-emerald-400">
              {formatUsdAndSol(economics.lamportsPerVotePayout, economics.solUsd)}
            </p>
          </div>
          </Reveal>
        </div>

        <Reveal delayMs={180}>
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-line bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg-muted">How many votes do you need?</p>
              <p className="mt-1 text-xs text-fg-muted">
                {economics.minVotes}–{economics.maxVotes} votes · SOL at ${economics.solUsd.toFixed(2)}
              </p>
            </div>
            <VoteCountControl value={votes} economics={economics} onChange={setVotes} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-subtle/60 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-fg-muted">You pay</p>
              <p className="mt-1 text-lg font-semibold text-fg">
                {formatUsdAndSol(creatorTotal, economics.solUsd)}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-subtle/60 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-fg-muted">Voters earn in total</p>
              <p className="mt-1 text-lg font-semibold text-emerald-400">
                {formatUsdAndSol(voterTotal, economics.solUsd)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-fg-muted">
            Wallet transfers stay in SOL. USD is the list price, converted at the current Solana rate.
          </p>

          <div className="mt-6">
            <Button size="lg" onClick={() => router.push("/creator/new")}>
              Create a task
            </Button>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
};

export default PricingSection;
