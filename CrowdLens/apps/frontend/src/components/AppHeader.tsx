"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import { isUiPreview } from "@/lib/ui-preview";
import * as creatorAuth from "@/lib/auth";
import * as voterAuth from "@/lib/voter/auth";
import { clearAllSessions, ensureWalletSessions, hasFullSession } from "@/lib/ensure-sessions";
import { validatorPaths } from "@/lib/routes";
import { WalletButton } from "@/components/WalletButton";
import { FaucetHint } from "@/components/FaucetHint";
import { WorkerBalance } from "@/components/voter/WorkerBalance";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV = [
  {
    href: "/creator",
    label: "Tasks",
    active: (path: string) => path === "/creator" || path.startsWith("/creator/task/"),
  },
  {
    href: "/creator/new",
    label: "New task",
    active: (path: string) => path.startsWith("/creator/new"),
  },
  {
    href: validatorPaths.votes,
    label: "Votes",
    active: (path: string) =>
      path === validatorPaths.votes || path.startsWith("/validators/task/"),
  },
  {
    href: validatorPaths.history,
    label: "History",
    active: (path: string) => path.startsWith(validatorPaths.history),
  },
  {
    href: validatorPaths.earnings,
    label: "Earnings",
    active: (path: string) => path.startsWith(validatorPaths.earnings),
  },
] as const;

export function AppHeader() {
  const { publicKey, signMessage, connecting, connected } = useWallet();
  const [hasSigned, setHasSigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const hadSession = useRef(false);
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const onValidatorPages = pathname.startsWith("/validators");

  useEffect(() => {
    if (isUiPreview) return;

    const resign = async () => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }
      await ensureWalletSessions(publicKey, signMessage);
    };

    creatorAuth.setResignHandler(resign);
    voterAuth.setResignHandler(resign);
    return () => {
      creatorAuth.setResignHandler(null);
      voterAuth.setResignHandler(null);
    };
  }, [publicKey, signMessage]);

  useEffect(() => {
    if (isUiPreview) return;

    if (connecting) {
      return;
    }

    if (!publicKey || !connected) {
      if (hadSession.current && !connected) {
        clearAllSessions();
        setHasSigned(false);
        hadSession.current = false;
      }
      return;
    }

    hadSession.current = true;

    if (hasSigned || hasFullSession(publicKey.toBase58())) {
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
        await ensureWalletSessions(publicKey, signMessage);
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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark compact />
          {isUiPreview && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
              Preview
            </span>
          )}
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {NAV.map((item) => {
              const active = item.active(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-md bg-subtle px-3 py-1.5 font-medium text-fg"
                      : "rounded-md px-3 py-1.5 text-fg-muted hover:bg-subtle/70 hover:text-fg"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {loading && <span className="hidden text-sm text-cyan-400 animate-pulse sm:inline">Signing in…</span>}
          <ThemeToggle />
          <FaucetHint />
          {onValidatorPages ? <WorkerBalance /> : null}
          <WalletButton />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-fg-muted hover:text-fg md:hidden"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {isMenuOpen ? (
        <nav className="border-t border-line bg-canvas/95 md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
            {NAV.map((item) => {
              const active = item.active(pathname);
              return (
                <Link
                  key={`m-${item.href}`}
                  href={item.href}
                  className={
                    active
                      ? "block rounded-md bg-subtle px-3 py-2 font-medium text-fg"
                      : "block rounded-md px-3 py-2 text-fg-muted hover:bg-subtle hover:text-fg"
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
