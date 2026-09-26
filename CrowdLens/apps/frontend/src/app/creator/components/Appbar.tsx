"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { isUiPreview } from "@/lib/ui-preview";
import { clearToken, hasValidSession, setResignHandler, signInWithWallet } from "@/lib/auth";
import { WalletButton } from "@/components/WalletButton";
import { FaucetHint } from "@/components/FaucetHint";
import toast from "react-hot-toast";

const NAV = [
  { href: "/creator", label: "Tasks" },
  { href: "/creator/new", label: "New task" },
] as const;

export const Appbar = () => {
  const { publicKey, signMessage, connecting, connected } = useWallet();
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

    if (!publicKey || !connected) {
      if (hadSession.current && !connected) {
        clearToken();
        setHasSigned(false);
        hadSession.current = false;
      }
      return;
    }

    hadSession.current = true;

    if (hasSigned || hasValidSession(publicKey.toBase58())) {
      setHasSigned(true);
      return;
    }

    if (!signMessage) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await signInWithWallet(publicKey, signMessage);
        if (!cancelled) {
          setHasSigned(true);
        }
      } catch (err) {
        console.error("Login failed:", err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Sign-in failed";
          toast.error(
            message.includes("Network Error") || message.includes("ECONNREFUSED")
              ? "API is not running. Start it, then reconnect."
              : message,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey, hasSigned, signMessage, connecting, connected]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BarChart3 className="h-7 w-7 text-violet-500" />
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
                item.href === "/creator"
                  ? pathname === "/creator" || pathname.startsWith("/creator/task/")
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
          <WalletButton
            connectClassName="!bg-violet-600 hover:!bg-violet-500 !rounded-lg !h-9 !text-sm"
            disconnectClassName="!bg-slate-800 hover:!bg-slate-700 !rounded-lg !h-9 !text-sm !border !border-slate-700"
          />
        </div>
      </div>
    </header>
  );
};
