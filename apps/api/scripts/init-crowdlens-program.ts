import { PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { findConfigPda, initializeInstruction } from "crowdlens-idl";
import { env } from "../src/env";
import { treasuryConnection, treasuryKeypair } from "../src/solana/treasury";

async function main() {
  const programId = new PublicKey(env.CROWDLENS_PROGRAM_ID);
  const [config] = findConfigPda(programId);
  const existing = await treasuryConnection.getAccountInfo(config, "confirmed");
  if (existing) {
    console.log("config already initialized", config.toBase58());
    return;
  }

  const ix = initializeInstruction({
    payer: treasuryKeypair.publicKey,
    programId,
  });
  const signature = await sendAndConfirmTransaction(
    treasuryConnection,
    new Transaction().add(ix),
    [treasuryKeypair],
    { commitment: "confirmed" },
  );
  console.log("initialized config", config.toBase58(), signature);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
