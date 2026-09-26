import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { env } from "./env";
import { getSolUsd } from "./solPrice";

export const CREATOR_USD_PER_VOTE = 1;
export const VOTER_USD_PER_VOTE = 0.5;
export const TASK_MIN_VOTES = env.TASK_MIN_VOTES;
export const TASK_MAX_VOTES = env.TASK_MAX_VOTES;
export const TREASURY_ADDRESS = env.TREASURY_ADDRESS;

export type VoteQuote = {
  solUsd: number;
  source: string;
  creatorLamports: number;
  voterLamports: number;
  quotedAt: string;
};

export function usdToLamports(usd: number, solUsd: number): number {
  if (!(usd > 0) || !(solUsd > 0)) {
    return 1;
  }
  return Math.max(1, Math.round((usd / solUsd) * LAMPORTS_PER_SOL));
}

export function quoteFromSolUsd(solUsd: number, source: string): VoteQuote {
  const creatorLamports = usdToLamports(CREATOR_USD_PER_VOTE, solUsd);
  return {
    solUsd,
    source,
    creatorLamports,
    voterLamports: Math.max(1, Math.floor(creatorLamports / 2)),
    quotedAt: new Date().toISOString(),
  };
}

export async function getVoteQuote(): Promise<VoteQuote> {
  const { usd, source } = await getSolUsd();
  return quoteFromSolUsd(usd, source);
}

export function isAllowedBatchSize(size: number): boolean {
  return Number.isInteger(size) && size >= TASK_MIN_VOTES && size <= TASK_MAX_VOTES;
}

export function voteCountBounds() {
  return { minVotes: TASK_MIN_VOTES, maxVotes: TASK_MAX_VOTES };
}

export function priceFor(batchSize: number, lamportsPerVote: number): number {
  return batchSize * lamportsPerVote;
}

export async function quotedPriceFor(batchSize: number): Promise<number> {
  const quote = await getVoteQuote();
  return priceFor(batchSize, quote.creatorLamports);
}

export function rewardFor(taskAmount: number, requiredSubmissions: number): number {
  if (requiredSubmissions <= 0) {
    return 0;
  }
  return Math.floor(taskAmount / (2 * requiredSubmissions));
}

export function acceptQuotedCreatorLamports(
  quoted: number | undefined,
  live: number,
): { ok: true; lamports: number } | { ok: false; error: string } {
  if (quoted == null || !Number.isFinite(quoted)) {
    return { ok: true, lamports: live };
  }
  if (!Number.isInteger(quoted) || quoted <= 0) {
    return { ok: false, error: "Invalid quoted price" };
  }
  const drift = Math.abs(quoted - live) / Math.max(live, 1);
  if (drift > env.PRICE_QUOTE_TOLERANCE) {
    return { ok: false, error: "SOL price moved. Refresh and try again." };
  }
  return { ok: true, lamports: quoted };
}

export async function minPayoutLamports(): Promise<number> {
  const quote = await getVoteQuote();
  return quote.voterLamports;
}

export function isOnchainSettlement() {
  return env.SETTLEMENT_MODE === "onchain";
}

export async function economicsPayload() {
  const quote = await getVoteQuote();
  return {
    treasuryAddress: TREASURY_ADDRESS,
    solUsd: quote.solUsd,
    usdPerVoteCreator: CREATOR_USD_PER_VOTE,
    usdPerVoteVoter: VOTER_USD_PER_VOTE,
    lamportsPerVote: quote.creatorLamports,
    lamportsPerVotePayout: quote.voterLamports,
    minVotes: TASK_MIN_VOTES,
    maxVotes: TASK_MAX_VOTES,
    settlementMode: env.SETTLEMENT_MODE,
    programId: isOnchainSettlement() ? env.CROWDLENS_PROGRAM_ID : null,
    quotedAt: quote.quotedAt,
    source: quote.source,
  };
}
