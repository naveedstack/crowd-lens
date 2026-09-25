import {
  decodeCreateTaskArgs,
  findTaskPda,
  isCreateTaskInstruction,
} from "crowdlens-idl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

type AccountKeys = {
  length: number;
  get: (index: number) => { toBase58: () => string } | undefined;
};

export type ConfirmedCreateTx = {
  meta?: {
    postBalances: number[];
    preBalances: number[];
    loadedAddresses?: {
      writable: Array<{ toBase58: () => string } | string>;
      readonly: Array<{ toBase58: () => string } | string>;
    };
  } | null;
  transaction: {
    message: {
      compiledInstructions?: Array<{
        programIdIndex: number;
        accountKeyIndexes: number[];
        data: string | number[] | Uint8Array;
      }>;
      instructions?: Array<{
        programIdIndex?: number;
        programId?: { toBase58: () => string } | string;
        accounts?: Array<number | { toBase58: () => string } | string>;
        data: string | number[] | Uint8Array;
      }>;
      getAccountKeys: (args?: {
        accountKeysFromLookups?: {
          writable: PublicKey[];
          readonly: PublicKey[];
        };
      }) => AccountKeys;
    };
  };
};

function instructionData(raw: string | number[] | Uint8Array): Buffer {
  if (typeof raw !== "string") {
    return Buffer.from(raw);
  }
  const candidates: Buffer[] = [];
  try {
    candidates.push(Buffer.from(bs58.decode(raw)));
  } catch {
    // not base58
  }
  candidates.push(Buffer.from(raw, "base64"));
  return (
    candidates.find((buf) => buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([194, 80, 6, 180, 232, 127, 48, 171]))) ??
    candidates[0] ??
    Buffer.from(raw)
  );
}

function toPublicKey(value: { toBase58: () => string } | string | undefined): PublicKey | null {
  if (!value) {
    return null;
  }
  try {
    return new PublicKey(typeof value === "string" ? value : value.toBase58());
  } catch {
    return null;
  }
}

export function verifyCreateTask(
  transaction: ConfirmedCreateTx,
  args: {
    expectedLamports: number;
    expectedRequired: number;
    programId: string;
    sender: string;
  },
): { ok: true; nonce: number; taskPda: string } | { ok: false; error: string } {
  if (!transaction.meta) {
    return { ok: false, error: "Transaction not found" };
  }

  const programId = new PublicKey(args.programId);
  let keys: AccountKeys;
  try {
    const loaded = transaction.meta.loadedAddresses;
    keys = transaction.transaction.message.getAccountKeys(
      loaded
        ? {
            accountKeysFromLookups: {
              writable: loaded.writable.map((item) => toPublicKey(item)!).filter(Boolean) as PublicKey[],
              readonly: loaded.readonly.map((item) => toPublicKey(item)!).filter(Boolean) as PublicKey[],
            },
          }
        : undefined,
    );
  } catch {
    return { ok: false, error: "Unable to read transaction accounts" };
  }

  const compiled = transaction.transaction.message.compiledInstructions ?? [];
  const legacy = transaction.transaction.message.instructions ?? [];
  const instructions = compiled.length > 0
    ? compiled.map((ix) => ({
        programIdIndex: ix.programIdIndex,
        accountIndexes: ix.accountKeyIndexes,
        data: instructionData(ix.data),
        programId: null as PublicKey | null,
      }))
    : legacy.map((ix) => ({
        programIdIndex: ix.programIdIndex,
        accountIndexes: (ix.accounts ?? []).map((account) =>
          typeof account === "number" ? account : -1,
        ),
        data: instructionData(ix.data),
        programId: toPublicKey(ix.programId ?? undefined),
      }));

  for (const ix of instructions) {
    const ixProgram = ix.programId ?? toPublicKey(keys.get(ix.programIdIndex ?? -1)?.toBase58());
    if (!ixProgram || !isCreateTaskInstruction(programId, ixProgram, ix.data)) {
      continue;
    }
    const decoded = decodeCreateTaskArgs(ix.data);
    if (!decoded) {
      return { ok: false, error: "Unable to decode create_task" };
    }
    if (decoded.amount !== args.expectedLamports) {
      return { ok: false, error: "Incorrect transaction amount" };
    }
    if (decoded.required !== args.expectedRequired) {
      return { ok: false, error: "Incorrect batch size" };
    }

    const creatorKey = toPublicKey(keys.get(ix.accountIndexes[0] ?? -1)?.toBase58());
    const taskKey = toPublicKey(keys.get(ix.accountIndexes[3] ?? -1)?.toBase58());
    if (!creatorKey || creatorKey.toBase58() !== args.sender) {
      return { ok: false, error: "Sent from wrong address" };
    }
    if (!taskKey) {
      return { ok: false, error: "Missing task PDA" };
    }

    const [expectedPda] = findTaskPda(creatorKey, decoded.nonce, programId);
    if (!taskKey.equals(expectedPda)) {
      return { ok: false, error: "Task PDA mismatch" };
    }

    let taskIndex = -1;
    for (let i = 0; i < keys.length; i++) {
      if (keys.get(i)?.toBase58() === taskKey.toBase58()) {
        taskIndex = i;
        break;
      }
    }
    if (taskIndex === -1) {
      return { ok: false, error: "Task PDA not in transaction" };
    }

    const received =
      (transaction.meta.postBalances[taskIndex] ?? 0) -
      (transaction.meta.preBalances[taskIndex] ?? 0);
    if (received < args.expectedLamports) {
      return { ok: false, error: "Incorrect transaction amount" };
    }

    return { ok: true, nonce: decoded.nonce, taskPda: taskKey.toBase58() };
  }

  return { ok: false, error: "create_task instruction not found" };
}
