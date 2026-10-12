export type Economics = {
  treasuryAddress: string;
  solUsd: number;
  usdPerVoteCreator: number;
  usdPerVoteVoter: number;
  lamportsPerVote: number;
  lamportsPerVotePayout: number;
  minVotes: number;
  maxVotes: number;
  settlementMode?: "custodial" | "onchain";
  programId?: string | null;
  quotedAt?: string;
  source?: string;
};

export const FALLBACK_ECONOMICS: Economics = {
  treasuryAddress: "5tm9oN2bpTxFdELx9ddcxjFG9HD4NQHdkdz3CYm25EQj",
  solUsd: 0,
  usdPerVoteCreator: 1,
  usdPerVoteVoter: 0.8,
  lamportsPerVote: 0,
  lamportsPerVotePayout: 0,
  minVotes: 1,
  maxVotes: 100,
  settlementMode: "custodial",
  programId: null,
  source: "fallback",
};

export function isLiveSolQuote(economics: Pick<Economics, "solUsd" | "source"> | null | undefined) {
  return Boolean(
    economics &&
      economics.solUsd > 0 &&
      economics.source &&
      economics.source !== "fallback" &&
      economics.source !== "preview",
  );
}

export function formatSolUsdRate(economics: Pick<Economics, "solUsd" | "source">) {
  if (!isLiveSolQuote(economics)) {
    return "live SOL rate";
  }
  return `SOL at $${economics.solUsd.toFixed(2)}`;
}

export function displaySolUsd(economics: Pick<Economics, "solUsd" | "source"> | null | undefined) {
  return isLiveSolQuote(economics) ? economics!.solUsd : null;
}

export function clampVoteCount(value: number, economics: Pick<Economics, "minVotes" | "maxVotes">) {
  const min = economics.minVotes || 1;
  const max = Math.max(min, economics.maxVotes || min);
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}
