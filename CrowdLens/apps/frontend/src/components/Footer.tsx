import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { FAUCET_URL } from "./FaucetHint";

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-sm text-sm text-slate-500">
              Community-powered content oracle on Solana Devnet. Creators escrow SOL. Humans vote. Winners are public.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/stats" className="hover:text-white">
              Stats
            </Link>
            <Link href="/case-studies" className="hover:text-white">
              Case studies
            </Link>
            <Link href="/validators" className="hover:text-white">
              Validators
            </Link>
            <Link href="/creator/new" className="hover:text-white">
              Create a task
            </Link>
            <Link href="/validators/votes" className="hover:text-white">
              Vote
            </Link>
            <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="hover:text-white">
              Devnet faucet
            </a>
            <a
              href="https://github.com/naveedstack/crowd-lens"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
        <p className="mt-10 text-xs text-slate-600">
          © {new Date().getFullYear()} CrowdLens. Solana Devnet human oracle.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
