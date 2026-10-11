"use client";

import { Minus, Plus } from "lucide-react";
import { clampVoteCount, type Economics } from "@/lib/economics";

type VoteCountControlProps = {
  value: number;
  economics: Pick<Economics, "minVotes" | "maxVotes">;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function VoteCountControl({
  value,
  economics,
  disabled,
  onChange,
}: VoteCountControlProps) {
  const min = economics.minVotes || 1;
  const max = Math.max(min, economics.maxVotes || min);

  function setVotes(next: number) {
    onChange(clampVoteCount(next, economics));
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => setVotes(value - 1)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-200 hover:border-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Fewer votes"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => setVotes(Number(event.target.value))}
        className="h-11 w-24 rounded-lg border border-slate-800 bg-slate-950 text-center text-lg font-semibold text-white focus:border-violet-500 focus:outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => setVotes(value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-200 hover:border-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="More votes"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
