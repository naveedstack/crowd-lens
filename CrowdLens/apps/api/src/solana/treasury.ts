import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { env } from "../env";
import { TREASURY_ADDRESS } from "../economics";

const FEE_BUFFER_LAMPORTS = 10_000;

function loadTreasuryKeypair(): Keypair {
  const keypair = Keypair.fromSecretKey(env.TREASURY_SECRET_KEY);
  const derived = keypair.publicKey.toBase58();
  if (derived !== TREASURY_ADDRESS) {
    console.error(
      "TREASURY_SECRET_KEY does not match TREASURY_ADDRESS.",
      `derived=${derived}`,
      `expected=${TREASURY_ADDRESS}`,
    );
    process.exit(1);
  }
  return keypair;
}

export const treasuryKeypair = loadTreasuryKeypair();
export const treasuryConnection = new Connection(env.RPC_URL, "confirmed");

export async function getTreasuryBalance(): Promise<number> {
  return treasuryConnection.getBalance(treasuryKeypair.publicKey);
}

export async function sendPayout(to: string, lamports: number): Promise<{
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  const destination = new PublicKey(to);
  const balance = await getTreasuryBalance();
  if (balance < lamports + FEE_BUFFER_LAMPORTS) {
    throw new Error("Insufficient treasury balance");
  }

  const { blockhash, lastValidBlockHeight } =
    await treasuryConnection.getLatestBlockhash("confirmed");

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasuryKeypair.publicKey,
      toPubkey: destination,
      lamports,
    }),
  );
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = treasuryKeypair.publicKey;
  transaction.sign(treasuryKeypair);

  const signature = await treasuryConnection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
  });

  return { signature, blockhash, lastValidBlockHeight };
}

export async function confirmPayout(args: {
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
}) {
  const result = await treasuryConnection.confirmTransaction(args, "confirmed");
  if (result.value.err) {
    throw new Error("Payout transaction failed on chain");
  }
}

export async function signatureStatus(signature: string) {
  return treasuryConnection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  });
}
