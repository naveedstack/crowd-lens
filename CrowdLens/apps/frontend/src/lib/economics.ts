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
  solUsd: 120,
  usdPerVoteCreator: 1,
  usdPerVoteVoter: 0.5,
  lamportsPerVote: 8_333_333,
  lamportsPerVotePayout: 4_166_666,
  minVotes: 1,
  maxVotes: 100,
  settlementMode: "custodial",
  programId: null,
};

export function clampVoteCount(value: number, economics: Pick<Economics, "minVotes" | "maxVotes">) {
  const min = economics.minVotes || 1;
  const max = Math.max(min, economics.maxVotes || min);
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}
