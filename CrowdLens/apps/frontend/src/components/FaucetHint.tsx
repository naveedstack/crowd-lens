export const FAUCET_URL = "https://faucet.solana.com";

export function FaucetHint() {
  return (
    <a
      href={FAUCET_URL}
      target="_blank"
      rel="noreferrer"
      className="hidden whitespace-nowrap rounded-full border border-cyan-500/30 bg-card px-3 py-1.5 text-xs font-medium text-cyan-400 hover:border-cyan-400/60 hover:text-cyan-400 sm:inline-flex"
    >
      Need Devnet SOL?
    </a>
  );
}
