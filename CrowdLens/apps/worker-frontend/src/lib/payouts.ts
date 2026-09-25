type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribePayouts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyPayouts() {
  for (const listener of listeners) {
    listener();
  }
}

export function formatSol(lamports: number) {
  return (lamports / 1_000_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function isOnChainSignature(signature: string) {
  return !signature.startsWith("pending:");
}
