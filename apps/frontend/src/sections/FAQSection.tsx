"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import { Reveal } from "@/components/landing/Reveal";

const ITEMS = [
  {
    question: "How do votes work?",
    answer:
      "A validator connects a wallet, opens a task, picks an image, and can leave an optional comment. Creators cannot vote on their own task. When the required number of votes is in, the batch closes.",
  },
  {
    question: "How is a task priced?",
    answer:
      "Creators pay $1 per vote, converted to SOL at the live Solana price. Voters earn $0.80 per vote (80% of that escrow), also paid in SOL. You pick how many votes you need (1–100).",
  },
  {
    question: "Where does the SOL go?",
    answer:
      "On-chain tasks escrow creator SOL in a program PDA. After voting, the API pays validators from that escrow. Switch Phantom to Devnet to see the transfer. Withdraw is only for leftover pending from older custodial tasks.",
  },
  {
    question: "What do I get when the batch finishes?",
    answer:
      "You see the vote split, the winning image (or a tie), turnaround, and you can export votes as CSV or JSON. CrowdLens does not invent click-through rates.",
  },
  {
    question: "What can I test?",
    answer:
      "Image comparisons only in this MVP: thumbnails, posters, or similar stills. Two to five images per task. Caption and text tasks are not live.",
  },
  {
    question: "Which network is this?",
    answer: "Solana Devnet only. Use the faucet if your wallet is empty, and keep Phantom on Devnet.",
  },
];

const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title="Frequently asked questions"
            subtitle="What the live MVP actually does."
            centered
          />
        </Reveal>
        <div className="mx-auto max-w-3xl space-y-3">
          {ITEMS.map((item, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={item.question} delayMs={index * 50}>
              <div className="rounded-xl border border-line bg-card">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span className="pr-4 font-medium text-fg">{item.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-fg-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-fg-muted" />
                  )}
                </button>
                {isOpen ? <p className="px-5 pb-4 text-sm leading-relaxed text-fg-muted">{item.answer}</p> : null}
              </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
