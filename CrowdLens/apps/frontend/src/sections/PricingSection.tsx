"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Button from "../components/Button";
import { MOCK_ECONOMICS, isUiPreview } from "@/lib/ui-preview";

type Economics = {
  lamportsPerVote: number;
  batchSizes: number[];
};

const FALLBACK: Economics = {
  lamportsPerVote: MOCK_ECONOMICS.lamportsPerVote,
  batchSizes: MOCK_ECONOMICS.batchSizes,
};

function formatSol(lamports: number) {
  return (lamports / 1_000_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

const PricingSection: React.FC = () => {
  const [economics, setEconomics] = useState<Economics>(FALLBACK);

  useEffect(() => {
    if (isUiPreview || !process.env.NEXT_PUBLIC_BACKEND_URL) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/economics`,
        );
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as Economics;
        if (
          cancelled ||
          !data.lamportsPerVote ||
          !Array.isArray(data.batchSizes) ||
          data.batchSizes.length === 0
        ) {
          return;
        }
        setEconomics({
          lamportsPerVote: data.lamportsPerVote,
          batchSizes: data.batchSizes,
        });
      } catch {
        // Keep the published batch sizes if the API is down.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const perVote = formatSol(economics.lamportsPerVote);

  return (
    <section id="pricing" className="relative bg-slate-950 py-20">
      <div className="absolute top-0 right-0 left-0 h-1/3 bg-gradient-to-b from-slate-900 to-transparent" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Pay per vote"
          subtitle={`Each vote costs ${perVote} SOL. You pick the batch size, and that full amount is paid out to the validators who complete it.`}
          centered
          light
        />

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {economics.batchSizes.map((size) => {
            const total = size * economics.lamportsPerVote;
            return (
              <div
                key={size}
                className="flex h-full flex-col rounded-2xl border border-slate-700 bg-slate-800/50 p-6"
              >
                <p className="text-sm font-medium text-slate-400">Batch</p>
                <h3 className="mt-2 text-3xl font-bold text-white">{size}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {size === 1 ? "vote" : "votes"}
                </p>
                <p className="mt-6 text-2xl font-bold text-white">{formatSol(total)} SOL</p>
                <p className="mt-1 text-sm text-slate-400">{perVote} SOL each</p>
                <ul className="mt-6 flex-1 space-y-3">
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 mr-2 h-4 w-4 shrink-0 text-emerald-500" />
                    Image comparison
                  </li>
                  <li className="flex items-start text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 mr-2 h-4 w-4 shrink-0 text-emerald-500" />
                    Winner when the batch fills
                  </li>
                </ul>
                <a href="/dashboard/new" className="mt-6 block">
                  <Button fullWidth>Create a task</Button>
                </a>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-400">
          Devnet SOL for now. There is no monthly plan and no extra platform fee on the vote itself.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
