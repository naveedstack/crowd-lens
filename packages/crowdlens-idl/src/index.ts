import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";

export const PROGRAM_ID = new PublicKey(
  "4DcAdpaXFFvzLVDxjHoswyKojaueMuQBF4cMTY4XNfw4",
);

export const LAMPORTS_PER_VOTE = 1_000_000;
export const MAX_SETTLE_CHUNK = 4;

export const DISCRIMINATOR = {
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  createTask: Buffer.from([194, 80, 6, 180, 232, 127, 48, 171]),
  commitVotes: Buffer.from([87, 6, 135, 227, 18, 249, 159, 163]),
  settleChunk: Buffer.from([214, 141, 97, 183, 51, 94, 40, 60]),
  closeTask: Buffer.from([55, 234, 77, 69, 245, 208, 54, 167]),
};

const ACCOUNT_DISCRIMINATOR = {
  config: Buffer.from([155, 12, 170, 224, 30, 250, 204, 130]),
  creatorStats: Buffer.from([239, 158, 112, 237, 227, 82, 97, 129]),
  taskEscrow: Buffer.from([209, 72, 197, 54, 17, 55, 3, 187]),
};

function u32le(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return buf;
}

function u64le(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function readU64(data: Buffer, offset: number): bigint {
  return data.readBigUInt64LE(offset);
}

function nonceSeed(nonce: number | bigint): Buffer {
  return u64le(nonce);
}

export function findConfigPda(programId: PublicKey = PROGRAM_ID) {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
}

export function findCreatorPda(
  creator: PublicKey,
  programId: PublicKey = PROGRAM_ID,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator"), creator.toBuffer()],
    programId,
  );
}

export function findTaskPda(
  creator: PublicKey,
  nonce: number | bigint,
  programId: PublicKey = PROGRAM_ID,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("task"), creator.toBuffer(), nonceSeed(nonce)],
    programId,
  );
}

export function initializeInstruction(args: {
  payer: PublicKey;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = args.programId ?? PROGRAM_ID;
  const [config] = findConfigPda(programId);
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.payer, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATOR.initialize,
  });
}

export function createTaskInstruction(args: {
  creator: PublicKey;
  amount: number;
  required: number;
  nonce: number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = args.programId ?? PROGRAM_ID;
  const [config] = findConfigPda(programId);
  const [creatorStats] = findCreatorPda(args.creator, programId);
  const [task] = findTaskPda(args.creator, args.nonce, programId);
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.creator, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: creatorStats, isSigner: false, isWritable: true },
      { pubkey: task, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      DISCRIMINATOR.createTask,
      u64le(args.amount),
      u32le(args.required),
      u64le(args.nonce),
    ]),
  });
}

export function commitVotesInstruction(args: {
  authority: PublicKey;
  creator: PublicKey;
  nonce: number;
  voteCommitment: Uint8Array;
  winnerOptionId?: number;
  programId?: PublicKey;
}): TransactionInstruction {
  if (args.voteCommitment.length !== 32) {
    throw new Error("voteCommitment must be 32 bytes");
  }
  const programId = args.programId ?? PROGRAM_ID;
  const [config] = findConfigPda(programId);
  const [task] = findTaskPda(args.creator, args.nonce, programId);
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.authority, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: task, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      DISCRIMINATOR.commitVotes,
      Buffer.from(args.voteCommitment),
      u32le(args.winnerOptionId ?? 0),
    ]),
  });
}

export function settleChunkInstruction(args: {
  authority: PublicKey;
  creator: PublicKey;
  nonce: number;
  workers: PublicKey[];
  amounts: number[];
  programId?: PublicKey;
}): TransactionInstruction {
  if (args.workers.length !== args.amounts.length) {
    throw new Error("workers and amounts length mismatch");
  }
  if (args.workers.length < 1 || args.workers.length > MAX_SETTLE_CHUNK) {
    throw new Error("settle chunk must include 1 to 4 workers");
  }
  const programId = args.programId ?? PROGRAM_ID;
  const [config] = findConfigPda(programId);
  const [task] = findTaskPda(args.creator, args.nonce, programId);
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.authority, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: task, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ...args.workers.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
    ],
    data: Buffer.concat([
      DISCRIMINATOR.settleChunk,
      u32le(args.amounts.length),
      ...args.amounts.map((amount) => u64le(amount)),
    ]),
  });
}

export function closeTaskInstruction(args: {
  authority: PublicKey;
  creator: PublicKey;
  nonce: number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = args.programId ?? PROGRAM_ID;
  const [config] = findConfigPda(programId);
  const [task] = findTaskPda(args.creator, args.nonce, programId);
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: args.authority, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: task, isSigner: false, isWritable: true },
      { pubkey: args.creator, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATOR.closeTask,
  });
}

export type CreatorStatsAccount = {
  creator: PublicKey;
  taskCount: number;
};

export type TaskEscrowAccount = {
  creator: PublicKey;
  nonce: number;
  amount: number;
  required: number;
  remainingLamports: number;
  voteCommitment: Buffer;
  chunksPaid: number;
  settled: boolean;
  winnerOptionId: number;
};

function hasPrefix(data: Buffer, prefix: Buffer): boolean {
  return data.subarray(0, prefix.length).equals(prefix);
}

export function decodeCreatorStats(data: Buffer): CreatorStatsAccount | null {
  if (data.length < 48 || !hasPrefix(data, ACCOUNT_DISCRIMINATOR.creatorStats)) {
    return null;
  }
  return {
    creator: new PublicKey(data.subarray(8, 40)),
    taskCount: Number(readU64(data, 40)),
  };
}

export function decodeTaskEscrow(data: Buffer): TaskEscrowAccount | null {
  if (data.length < 105 || !hasPrefix(data, ACCOUNT_DISCRIMINATOR.taskEscrow)) {
    return null;
  }
  return {
    creator: new PublicKey(data.subarray(8, 40)),
    nonce: Number(readU64(data, 40)),
    amount: Number(readU64(data, 48)),
    required: data.readUInt32LE(56),
    remainingLamports: Number(readU64(data, 60)),
    voteCommitment: Buffer.from(data.subarray(68, 100)),
    chunksPaid: data.readUInt32LE(100),
    settled: data[104] !== 0,
    winnerOptionId: data.length >= 109 ? data.readUInt32LE(105) : 0,
  };
}

export function decodeCreateTaskArgs(data: Buffer): {
  amount: number;
  required: number;
  nonce: number;
} | null {
  if (data.length < 28 || !hasPrefix(data, DISCRIMINATOR.createTask)) {
    return null;
  }
  return {
    amount: Number(readU64(data, 8)),
    required: data.readUInt32LE(16),
    nonce: Number(readU64(data, 20)),
  };
}

export function isCreateTaskInstruction(
  programId: PublicKey,
  ixProgramId: PublicKey,
  data: Buffer,
): boolean {
  return ixProgramId.equals(programId) && hasPrefix(data, DISCRIMINATOR.createTask);
}
