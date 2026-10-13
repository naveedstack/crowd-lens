import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export function hashVoteCommitment(
  rows: { address: string; optionId: number; amount: number }[],
): Buffer {
  const sorted = [...rows].sort((a, b) => a.address.localeCompare(b.address));
  const hash = createHash("sha256");
  for (const row of sorted) {
    hash.update(new PublicKey(row.address).toBytes());
    const option = Buffer.alloc(8);
    option.writeBigUInt64LE(BigInt(row.optionId));
    hash.update(option);
    const amount = Buffer.alloc(8);
    amount.writeBigUInt64LE(BigInt(row.amount));
    hash.update(amount);
  }
  return hash.digest();
}
