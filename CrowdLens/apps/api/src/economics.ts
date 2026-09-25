import { env } from "./env";

export const LAMPORTS_PER_VOTE = env.LAMPORTS_PER_VOTE;
export const TASK_BATCH_SIZES = env.TASK_BATCH_SIZES;
export const TREASURY_ADDRESS = env.TREASURY_ADDRESS;

export function isAllowedBatchSize(size: number): boolean {
  return TASK_BATCH_SIZES.includes(size);
}

export function priceFor(batchSize: number): number {
  return batchSize * LAMPORTS_PER_VOTE;
}

export function rewardFor(taskAmount: number, requiredSubmissions: number): number {
  if (requiredSubmissions <= 0) {
    return 0;
  }
  return Math.floor(taskAmount / requiredSubmissions);
}

export function isOnchainSettlement() {
  return env.SETTLEMENT_MODE === "onchain";
}

export function economicsPayload() {
  return {
    treasuryAddress: TREASURY_ADDRESS,
    lamportsPerVote: LAMPORTS_PER_VOTE,
    batchSizes: TASK_BATCH_SIZES,
    settlementMode: env.SETTLEMENT_MODE,
    programId: isOnchainSettlement() ? env.CROWDLENS_PROGRAM_ID : null,
  };
}
