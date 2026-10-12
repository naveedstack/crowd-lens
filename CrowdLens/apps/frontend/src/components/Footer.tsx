import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { FAUCET_URL } from "./FaucetHint";

const Footer = () => {
  return (
    <footer className="border-t border-line bg-canvas pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-sm text-sm text-fg-muted">
              Community-powered content oracle on Solana Devnet. Creators escrow SOL. Humans vote. Winners are public.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
            <Link href="/stats" className="hover:text-fg">
              Stats
            </Link>
            <Link href="/case-studies" className="hover:text-fg">
              Case studies
            </Link>
            <Link href="/validators" className="hover:text-fg">
              Validators
            </Link>
            <Link href="/creator/new" className="hover:text-fg">
              Create a task
            </Link>
            <Link href="/validators/votes" className="hover:text-fg">
              Vote
            </Link>
            <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="hover:text-fg">
              Devnet faucet
            </a>
            <a
              href="https://github.com/naveedstack/crowd-lens"
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg"
            >
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-10 text-xs text-fg-muted">
          © {new Date().getFullYear()} CrowdLens. Solana Devnet human oracle.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
