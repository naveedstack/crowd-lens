const LAMPORTS_PER_SOL = 1_000_000_000;

export function formatSol(lamports: number) {
  return (lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export function formatUsd(usd: number) {
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function lamportsToUsd(lamports: number, solUsd: number) {
  if (!(solUsd > 0)) {
    return 0;
  }
  return (lamports / LAMPORTS_PER_SOL) * solUsd;
}

export function shownUsd(lamports: number, solUsd?: number | null) {
  return Math.round(lamportsToUsd(lamports, solUsd ?? 0) * 100) / 100;
}

/** Matches the $0.50 on screen, even when the live lamport minimum is a few units higher. */
export function pendingCanWithdraw(
  pendingLamports: number,
  minLamports: number,
  solUsd?: number | null,
  minUsd = 0.5,
) {
  if (!(pendingLamports > 0)) {
    return false;
  }
  if (minLamports > 0 && pendingLamports >= minLamports) {
    return true;
  }
  return shownUsd(pendingLamports, solUsd) >= minUsd;
}

export function formatUsdAndSol(lamports: number, solUsd?: number | null) {
  const sol = `${formatSol(lamports)} SOL`;
  if (!solUsd || solUsd <= 0) {
    return sol;
  }
  return `${formatUsd(lamportsToUsd(lamports, solUsd))} · ${sol}`;
}
