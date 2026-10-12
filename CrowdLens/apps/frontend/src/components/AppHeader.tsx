"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <BrandMark />
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
        <div className="flex items-center gap-3">
          {loading && <span className="hidden text-sm text-cyan-400 animate-pulse sm:inline">Signing in…</span>}
          <ThemeToggle />
          <FaucetHint />
          {onValidatorPages ? <WorkerBalance /> : null}
          <WalletButton />
        </div>
        <nav className="flex w-full items-center gap-1 overflow-x-auto pb-3 text-sm md:hidden">
          {NAV.map((item) => {
            const active = item.active(pathname);
            return (
              <Link
                key={`m-${item.href}`}
                href={item.href}
                className={
                  active
                    ? "shrink-0 rounded-md bg-subtle px-3 py-1.5 font-medium text-fg"
                    : "shrink-0 rounded-md px-3 py-1.5 text-fg-muted"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
