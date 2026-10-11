"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wallet,
  Image as ImageIcon,
  Coins,
  Zap,
  PieChart,
  Shield,
  MessageSquare,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import Button from "@/components/Button";
import { FAUCET_URL } from "@/components/FaucetHint";
import { useEconomics } from "@/lib/use-economics";
import { formatSol, formatUsd, formatUsdAndSol } from "@/lib/money";

const PEXELS_A = "https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg";
const PEXELS_B = "https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg";

const ValidatorGuide = () => {
  const { economics } = useEconomics();
  const [votesPerDay, setVotesPerDay] = useState(25);
  const [previewPick, setPreviewPick] = useState<"A" | "B">("A");

  const payoutUsd = economics.usdPerVoteVoter;
  const payoutLamports = economics.lamportsPerVotePayout;
  const dailyLamports = votesPerDay * payoutLamports;
  const monthlyLamports = dailyLamports * 30;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-800 pt-16 pb-20">
        <div className="pointer-events-none absolute top-1/4 left-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[130px]" />
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900 px-3.5 py-1 text-sm text-cyan-400">
            <Coins className="h-4 w-4" />
            <span className="font-medium tracking-wide uppercase">Earn 80% of every creator escrow</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-emerald-400">~{formatSol(payoutLamports)} SOL / vote</span>
          </div>
          <h1 className="font-display mx-auto mb-6 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Get paid in SOL to review and vote on creative content
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
            Connect a Devnet wallet, pick the stronger image, and earn {formatUsd(payoutUsd)} per
            vote — 80% of what the creator escrowed. Payouts land in your wallet when the batch fills.
          </p>
          <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/validators/votes">
              <Button size="lg">Start voting</Button>
            </Link>
            <Link href="/validators/votes">
              <Button variant="outline" size="lg">
                View open ballots
              </Button>
            </Link>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 border-t border-slate-800 pt-6 md:grid-cols-4">
            {[
              { icon: Zap, label: "Paid when the batch fills" },
              { icon: PieChart, label: "80% of escrow to validators" },
              { icon: Wallet, label: "No stake or token to buy" },
              { icon: Shield, label: "Phantom on Devnet" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
              >
                <item.icon className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-xs text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/40 py-20" id="workflow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase">Three steps</p>
            <h2 className="font-display mb-3 text-3xl font-bold text-white">How validating works</h2>
            <p className="text-slate-400">
              Votes are stored off-chain. When the batch fills, the winner is committed on Solana and
              aligned voters are paid from the task escrow.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StepCard
              n="01"
              icon={Wallet}
              title="Connect and open Votes"
              body="Switch Phantom to Devnet, connect, and sign in. Open ballots show the payout for that task."
              foot="Cluster: Solana Devnet"
            />
            <StepCard
              n="02"
              icon={ImageIcon}
              title="Pick an image"
              body="Each task has two to five images. Choose one. An optional comment is stored for the creator — it does not change your payout."
              foot="Optional comment · no extra bounty"
            />
            <StepCard
              n="03"
              icon={Coins}
              title="Settlement when the batch fills"
              body={`${formatUsd(payoutUsd)} in SOL per vote is sent to your wallet from the escrow PDA. Majority voters keep the full share; outliers earn less.`}
              foot="Instruction: SettleChunk"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative mb-14 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
              <div className="space-y-2 text-center lg:text-left">
                <div className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                  On-chain allocation
                </div>
                <h3 className="font-display text-2xl font-semibold text-white">
                  Creators escrow {formatUsd(economics.usdPerVoteCreator)} per vote · 80% (
                  {formatUsd(payoutUsd)} · ~{formatSol(payoutLamports)} SOL) goes to validators
                </h3>
                <p className="text-sm text-slate-400">
                  The remaining 20% stays in the task escrow as protocol share when the account is
                  closed.
                </p>
              </div>
              <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 lg:w-96">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-semibold text-emerald-400">Validators (80%)</span>
                  <span className="text-slate-500">Protocol (20%)</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-4/5 rounded-full bg-emerald-500" />
                  <div className="h-full w-1/5 bg-slate-700" />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>{formatUsd(payoutUsd)} validator share</span>
                  <span>{formatUsd(economics.usdPerVoteCreator - payoutUsd)} protocol</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureTile
              icon={Zap}
              title="Devnet SOL payouts"
              body="When the required votes are in, settle_chunk sends SOL to the wallets that voted. No monthly withdrawal queue for on-chain tasks."
            />
            <FeatureTile
              icon={Shield}
              title="Aligned reputation"
              body="Voters who match the majority gain reputation. Outliers earn a smaller share of that task and lose a few points."
            />
            <FeatureTile
              icon={MessageSquare}
              title="Optional comments"
              body="You can explain the pick. Comments are shown to the creator on the task page. They do not add a bonus on top of the 80% share."
            />
            <FeatureTile
              icon={PieChart}
              title="Visible on Explorer"
              body="Pay-in, vote commitment, winner option, and payouts are on Solana Devnet. Switch Phantom to Devnet to see the transfer."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end">
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                  List-price model
                </p>
                <h2 className="font-display text-3xl font-bold text-white">Validator earnings estimator</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Uses the live {formatUsd(payoutUsd)} / vote rate. It does not promise that many open
                  tasks will be waiting.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-display text-lg font-semibold text-white" htmlFor="vote-range">
                      Votes per day
                    </label>
                    <span className="text-xl font-semibold text-cyan-400">{votesPerDay} votes</span>
                  </div>
                  <input
                    id="vote-range"
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={votesPerDay}
                    onChange={(event) => setVotesPerDay(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1 / day</span>
                    <span>50 / day</span>
                    <span>100 / day</span>
                  </div>
                </div>
                <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Escrow rate:{" "}
                    <strong>
                      {formatUsd(payoutUsd)} per vote (~{formatSol(payoutLamports)} SOL)
                    </strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Paid when that task’s vote count is reached
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    SOL at ${economics.solUsd.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 lg:col-span-5">
                <div className="rounded-xl border border-emerald-500/20 bg-slate-950 p-5">
                  <div className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    If you voted that many times today
                  </div>
                  <p className="font-display text-3xl font-bold text-emerald-400">
                    {formatUsdAndSol(dailyLamports, economics.solUsd)}
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-slate-950 p-5">
                  <div className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Same pace for 30 days
                  </div>
                  <p className="font-display text-3xl font-bold text-cyan-400">
                    {formatUsdAndSol(monthlyLamports, economics.solUsd)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 py-20" id="ballot-preview">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                Ballot preview
              </div>
              <h2 className="font-display text-3xl font-bold text-white">What a vote looks like</h2>
              <p className="mt-2 text-slate-400">
                Sample layout only — tap an option, then open live ballots to cast a real vote.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              Reward: {formatUsd(payoutUsd)} · ~{formatSol(payoutLamports)} SOL
            </span>
          </div>
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <p className="font-display text-lg font-semibold text-white">Choose the better thumbnail</p>
                <p className="mt-0.5 text-sm text-slate-400">Two to five images · majority wins when the batch fills</p>
              </div>
            </div>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <PreviewOption
                label="Option A"
                src={PEXELS_A}
                selected={previewPick === "A"}
                onSelect={() => setPreviewPick("A")}
              />
              <PreviewOption
                label="Option B"
                src={PEXELS_B}
                selected={previewPick === "B"}
                onSelect={() => setPreviewPick("B")}
              />
            </div>
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-4 sm:flex-row">
              <p className="text-sm text-slate-400">
                Preview only. A real vote is signed in with your wallet on the Votes page.
              </p>
              <Link href="/validators/votes">
                <Button>
                  Open live ballots · earn {formatUsd(payoutUsd)}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase">Payouts</p>
            <h2 className="font-display mb-3 text-3xl font-bold text-white">Validator FAQ</h2>
            <p className="text-slate-400">What the live MVP actually pays and how settlement works.</p>
          </div>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-white">
                  <HelpCircle className="h-5 w-5 shrink-0 text-cyan-400" />
                  {item.q}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to earn Devnet SOL as a validator?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-slate-400">
            Connect a wallet on Devnet, open Votes, and take the first open image comparison.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/validators/votes">
              <Button size="lg">Open validator ballot</Button>
            </Link>
            <a href={FAUCET_URL} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg">
                Get Devnet SOL
              </Button>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

const FAQ = [
  {
    q: "What is the 80% reward pool?",
    a: "Creators pay $1.00 per requested vote, converted to SOL at the live rate. Validators who complete that vote receive 80% ($0.80 in SOL). The remaining 20% stays in the escrow as protocol share when the task account is closed.",
  },
  {
    q: "How does alignment work?",
    a: "You pick an image without seeing a live leaderboard of other wallets. When the required number of votes is in, the majority option is the winner. Aligned voters keep the full per-vote share; outliers get a smaller share of that task. Reputation moves the same way.",
  },
  {
    q: "Do I need to stake SOL or buy a token?",
    a: "No. CrowdLens runs on Solana Devnet. You need a Phantom or Solflare wallet set to Devnet and enough test SOL for signatures. Use the faucet if the wallet is empty.",
  },
  {
    q: "When does SOL arrive in my wallet?",
    a: "When that task reaches its vote count, the API pays validators from the escrow PDA (SettleChunk). Switch Phantom to Devnet to see it. Withdraw is only for leftover pending from older custodial tasks.",
  },
];

function StepCard({
  n,
  icon: Icon,
  title,
  body,
  foot,
}: {
  n: string;
  icon: typeof Wallet;
  title: string;
  body: string;
  foot: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-800 text-cyan-400">
        <span className="font-display text-lg font-semibold">{n}</span>
      </div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-400" />
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-slate-400">{body}</p>
      <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">{foot}</div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Wallet;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="font-display mb-2 text-lg font-semibold text-white">{title}</h4>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function PreviewOption({
  label,
  src,
  selected,
  onSelect,
}: {
  label: string;
  src: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border-2 p-4 text-left transition ${
        selected ? "border-violet-500 bg-slate-800/60" : "border-slate-800 bg-slate-950 hover:border-violet-500/50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold tracking-wider text-slate-300 uppercase">
          {label}
        </span>
        {selected ? (
          <span className="text-xs font-medium text-violet-400">Selected</span>
        ) : null}
      </div>
      <div className="relative mb-2 aspect-video overflow-hidden rounded-lg border border-slate-800">
        <Image src={src} alt={label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
      </div>
    </button>
  );
}

export default ValidatorGuide;
