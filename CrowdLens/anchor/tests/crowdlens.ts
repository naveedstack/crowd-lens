import assert from "node:assert/strict";
import * as anchor from "@anchor-lang/core";
import { Program, BN } from "@anchor-lang/core";
import { Crowdlens } from "../target/types/crowdlens";

const LAMPORTS_PER_VOTE = 1_000_000;

function configPda(programId: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId,
  )[0];
}

function creatorPda(programId: anchor.web3.PublicKey, creator: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("creator"), creator.toBuffer()],
    programId,
  )[0];
}

function taskPda(
  programId: anchor.web3.PublicKey,
  creator: anchor.web3.PublicKey,
  nonce: number,
) {
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64LE(BigInt(nonce));
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("task"), creator.toBuffer(), nonceBuf],
    programId,
  )[0];
}

async function expectFail(fn: () => Promise<unknown>, pattern: RegExp) {
  try {
    await fn();
  } catch (err) {
    assert.match(String(err), pattern);
    return;
  }
  assert.fail("expected transaction to fail");
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = (anchor.workspace.crowdlens ??
    anchor.workspace.Crowdlens) as Program<Crowdlens>;
  const creator = provider.wallet.publicKey;
  const config = configPda(program.programId);
  const creatorStats = creatorPda(program.programId, creator);
  const workerA = anchor.web3.Keypair.generate();
  const workerB = anchor.web3.Keypair.generate();
  const stranger = anchor.web3.Keypair.generate();
  const required = 2;
  const amount = required * LAMPORTS_PER_VOTE;
  const nonce = 0;
  const task = taskPda(program.programId, creator, nonce);
  const voteCommitment = Buffer.alloc(32, 7);

  await program.methods.initialize().accounts({ config }).rpc();
  const configAccount = await program.account.config.fetch(config);
  assert.equal(configAccount.authority.toBase58(), creator.toBase58());

  const before = await provider.connection.getBalance(creator);
  await program.methods
    .createTask(new BN(amount), required, new BN(nonce))
    .accounts({ creator, config, creatorStats, task })
    .rpc();
  const escrow = await program.account.taskEscrow.fetch(task);
  assert.equal(Number(escrow.amount), amount);
  assert.equal(escrow.required, required);
  assert.equal(Number(escrow.remainingLamports), amount);
  assert.equal(escrow.settled, false);
  const taskLamports = await provider.connection.getBalance(task);
  assert.ok(taskLamports >= amount, "PDA should hold at least the escrowed amount");
  const after = await provider.connection.getBalance(creator);
  assert.ok(before - after >= amount, "creator should pay the escrow");

  await expectFail(
    () =>
      program.methods
        .createTask(new BN(0), required, new BN(1))
        .accounts({
          creator,
          config,
          creatorStats,
          task: taskPda(program.programId, creator, 1),
        })
        .rpc(),
    /BadAmount|custom program error/i,
  );

  const airdrop = await provider.connection.requestAirdrop(
    stranger.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL,
  );
  await provider.connection.confirmTransaction(airdrop, "confirmed");
  await expectFail(
    () =>
      program.methods
        .commitVotes([...voteCommitment], 0)
        .accounts({ authority: stranger.publicKey, config, task })
        .signers([stranger])
        .rpc(),
    /Unauthorized|has_one|custom program error/i,
  );

  await program.methods
    .commitVotes([...voteCommitment], 7)
    .accounts({ authority: creator, config, task })
    .rpc();
  const committed = await program.account.taskEscrow.fetch(task);
  assert.deepEqual(Buffer.from(committed.voteCommitment), voteCommitment);
  assert.equal(committed.winnerOptionId, 7);

  await expectFail(
    () =>
      program.methods
        .commitVotes([...Buffer.alloc(32, 9)], 7)
        .accounts({ authority: creator, config, task })
        .rpc(),
    /VotesAlreadyCommitted|custom program error/i,
  );

  await expectFail(
    () =>
      program.methods
        .settleChunk([new BN(amount + 1)])
        .accounts({ authority: creator, config, task })
        .remainingAccounts([
          { pubkey: workerA.publicKey, isWritable: true, isSigner: false },
        ])
        .rpc(),
    /Overpay|custom program error/i,
  );

  const beforeA = await provider.connection.getBalance(workerA.publicKey);
  const beforeB = await provider.connection.getBalance(workerB.publicKey);
  await program.methods
    .settleChunk([new BN(LAMPORTS_PER_VOTE), new BN(LAMPORTS_PER_VOTE)])
    .accounts({ authority: creator, config, task })
    .remainingAccounts([
      { pubkey: workerA.publicKey, isWritable: true, isSigner: false },
      { pubkey: workerB.publicKey, isWritable: true, isSigner: false },
    ])
    .rpc();
  const afterA = await provider.connection.getBalance(workerA.publicKey);
  const afterB = await provider.connection.getBalance(workerB.publicKey);
  assert.equal(afterA - beforeA, LAMPORTS_PER_VOTE);
  assert.equal(afterB - beforeB, LAMPORTS_PER_VOTE);
  const paid = await program.account.taskEscrow.fetch(task);
  assert.equal(Number(paid.remainingLamports), 0);

  const beforeCreator = await provider.connection.getBalance(creator);
  await program.methods
    .closeTask()
    .accounts({ authority: creator, config, task, creator })
    .rpc();
  const closed = await provider.connection.getAccountInfo(task);
  assert.equal(closed, null);
  const afterCreator = await provider.connection.getBalance(creator);
  assert.ok(afterCreator > beforeCreator, "rent should return to creator");

  const partialNonce = 1;
  const partialAmount = 2 * LAMPORTS_PER_VOTE;
  const partialTask = taskPda(program.programId, creator, partialNonce);
  await program.methods
    .createTask(new BN(partialAmount), required, new BN(partialNonce))
    .accounts({ creator, config, creatorStats, task: partialTask })
    .rpc();
  await program.methods
    .commitVotes([...voteCommitment], 0)
    .accounts({ authority: creator, config, task: partialTask })
    .rpc();
  await program.methods
    .settleChunk([new BN(LAMPORTS_PER_VOTE)])
    .accounts({ authority: creator, config, task: partialTask })
    .remainingAccounts([
      { pubkey: workerA.publicKey, isWritable: true, isSigner: false },
    ])
    .rpc();
  const beforeSweep = await provider.connection.getBalance(creator);
  await program.methods
    .closeTask()
    .accounts({ authority: creator, config, task: partialTask, creator })
    .rpc();
  const afterSweep = await provider.connection.getBalance(creator);
  assert.ok(
    afterSweep - beforeSweep >= LAMPORTS_PER_VOTE,
    "platform share should return to the authority",
  );
  assert.equal(await provider.connection.getAccountInfo(partialTask), null);

  console.log("ok crowdlens escrow program");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
