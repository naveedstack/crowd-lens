"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { isUiPreview } from "@/lib/ui-preview";
import { clearToken, getToken, setResignHandler, signInWithWallet } from "@/lib/auth";
import { WalletButton } from "./WalletButton";
import { WorkerBalance } from "./WorkerBalance";
import { FaucetHint } from "./FaucetHint";

const NAV = [
  { href: "/", label: "Votes" },
  { href: "/history", label: "History" },
  { href: "/earnings", label: "Earnings" },
] as const;

export const Appbar = () => {
  const { publicKey, signMessage, connected, connecting } = useWallet();
  const [hasSigned, setHasSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const hadSession = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isUiPreview) return;

    const resign = async () => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }
      await signInWithWallet(publicKey, signMessage);
    };

    setResignHandler(resign);
    return () => setResignHandler(null);
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (isUiPreview) return;

    if (connecting) {
      return;
    }

    if (connected && publicKey) {
      hadSession.current = true;
    } else {
      if (hadSession.current) {
        clearToken();
        setHasSigned(false);
        hadSession.current = false;
      }
      return;
    }

    if (hasSigned || getToken()) {
      setHasSigned(true);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        await signInWithWallet(publicKey, signMessage);
        setHasSigned(true);
      } catch (err) {
        console.error("Login failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [publicKey, hasSigned, signMessage, connected, connecting]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19V5M4 19h16M8 16V9M12 16V7M16 16v-4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
              CrowdLens
            </span>
          </Link>
          {isUiPreview && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Preview
            </span>
          )}
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/task")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "px-3 py-1.5 rounded-md bg-slate-800 text-white font-medium"
                      : "px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/70"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {loading && <span className="text-sm text-violet-300 animate-pulse">Signing in...</span>}
          <FaucetHint />
          <WorkerBalance />
          <WalletButton
            connectClassName="!bg-violet-600 hover:!bg-violet-500 !rounded-lg !h-9 !text-sm"
            disconnectClassName="!bg-slate-800 hover:!bg-slate-700 !rounded-lg !h-9 !text-sm !border !border-slate-700"
          />
        </div>
      </div>
    </header>
  );
};
