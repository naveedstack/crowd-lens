export type ConfirmedBalances = {
  meta?: {
    postBalances: number[];
    preBalances: number[];
  } | null;
  transaction: {
    message: {
      getAccountKeys: () => {
        length: number;
        get: (index: number) => { toBase58: () => string } | undefined;
      };
    };
  };
};

export function verifyTaskPayment(
  transaction: ConfirmedBalances,
  args: {
    expectedLamports: number;
    treasury: string;
    sender: string;
  },
): { ok: true } | { ok: false; error: string } {
  if (!transaction.meta) {
    return { ok: false, error: "Transaction not found" };
  }

  let keys;
  try {
    keys = transaction.transaction.message.getAccountKeys();
  } catch {
    return { ok: false, error: "Unable to read transaction accounts" };
  }

  let treasuryIndex = -1;
  let senderIndex = -1;

  for (let i = 0; i < keys.length; i++) {
    const address = keys.get(i)?.toBase58();
    if (address === args.treasury) {
      treasuryIndex = i;
    }
    if (address === args.sender) {
      senderIndex = i;
    }
  }

  if (senderIndex === -1) {
    return { ok: false, error: "Sent from wrong address" };
  }

  if (treasuryIndex === -1) {
    return { ok: false, error: "Sent to wrong address" };
  }

  const received =
    (transaction.meta.postBalances[treasuryIndex] ?? 0) -
    (transaction.meta.preBalances[treasuryIndex] ?? 0);

  if (received !== args.expectedLamports) {
    return { ok: false, error: "Incorrect transaction amount" };
  }

  return { ok: true };
}
