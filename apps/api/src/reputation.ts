export const MIN_TASK_DWELL_MS = 3_000;
export const MIN_VOTE_GAP_MS = 3_000;

export function clampReputation(value: number): number {
  return Math.max(0, Math.min(100, value));
}
