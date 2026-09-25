export const FAUCET_URL = "https://faucet.solana.com";

export function FaucetHint() {
  return (
    <a
      href={FAUCET_URL}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-slate-400 hover:text-white whitespace-nowrap"
    >
      Need devnet SOL?
    </a>
  );
}
