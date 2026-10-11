"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { BrandMark } from "./BrandMark";
import { useWallet } from "@solana/wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";
import { isUiPreview } from "@/lib/ui-preview";
import { clearAllSessions, ensureWalletSessions, hasFullSession } from "@/lib/ensure-sessions";
import { validatorPaths } from "@/lib/routes";

const LINKS = [
  { href: "/validators", label: "Validators", page: true },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Results" },
  { href: "#faq", label: "FAQ" },
  { href: "/stats", label: "Stats", page: true },
  { href: "/case-studies", label: "Case studies", page: true },
] as const;

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { publicKey, signMessage, connected } = useWallet();
  const hadWallet = useRef(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isUiPreview) return;

    if (connected && publicKey) {
      hadWallet.current = true;
      if (hasFullSession(publicKey.toBase58())) {
        return;
      }
      if (!signMessage) {
        return;
      }
      ensureWalletSessions(publicKey, signMessage).catch((err) => {
        console.error("Login failed:", err);
      });
      return;
    }

    if (hadWallet.current && !connected) {
      clearAllSessions();
      hadWallet.current = false;
    }
  }, [connected, publicKey, signMessage]);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        isScrolled ? "border-b border-slate-800 bg-slate-950/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <BrandMark />
          <nav className="hidden items-center gap-6 lg:flex">
            {LINKS.map((link) =>
              "page" in link && link.page ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "text-sm font-medium text-white"
                      : "text-sm font-medium text-slate-400 hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-400 hover:text-white"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/creator/new"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Create a task
            </Link>
            <Link
              href={validatorPaths.votes}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Vote
            </Link>
            <WalletButton />
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:text-white lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {isMenuOpen ? (
        <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {LINKS.map((link) =>
              "page" in link && link.page ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "block rounded-md bg-slate-800 px-3 py-2 text-white"
                      : "block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ),
            )}
            <Link
              href="/creator/new"
              className="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Create a task
            </Link>
            <Link
              href={validatorPaths.votes}
              className="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Vote
            </Link>
            <div className="px-3 pt-2">
              <WalletButton />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
