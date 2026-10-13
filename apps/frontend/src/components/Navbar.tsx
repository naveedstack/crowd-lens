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
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

function linkHref(href: string, page: boolean | undefined, pathname: string) {
  if (page) {
    return href;
  }
  return pathname === "/" ? href : `/${href}`;
}

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
    setIsMenuOpen(false);
  }, [pathname]);

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
        isScrolled ? "border-b border-line bg-canvas/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-2 md:h-20">
          <BrandMark compact />
          <nav className="ml-4 hidden items-center gap-6 lg:flex">
            {LINKS.map((link) =>
              "page" in link && link.page ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "text-sm font-medium text-fg"
                      : "text-sm font-medium text-fg-muted hover:text-fg"
                  }
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={linkHref(link.href, false, pathname)}
                  className="text-sm font-medium text-fg-muted hover:text-fg"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/creator/new"
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted hover:text-fg md:inline"
            >
              Create a task
            </Link>
            <Link
              href={validatorPaths.votes}
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted hover:text-fg md:inline"
            >
              Vote
            </Link>
            <ThemeToggle />
            <WalletButton />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-fg-muted hover:text-fg lg:hidden"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen ? (
        <div className="border-t border-line bg-canvas/95 backdrop-blur-md lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {LINKS.map((link) =>
              "page" in link && link.page ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "block rounded-md bg-subtle px-3 py-2 text-fg"
                      : "block rounded-md px-3 py-2 text-fg-muted hover:bg-subtle hover:text-fg"
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={linkHref(link.href, false, pathname)}
                  className="block rounded-md px-3 py-2 text-fg-muted hover:bg-subtle hover:text-fg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ),
            )}
            <Link
              href="/creator/new"
              className="block rounded-md px-3 py-2 text-fg-muted hover:bg-subtle md:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              Create a task
            </Link>
            <Link
              href={validatorPaths.votes}
              className="block rounded-md px-3 py-2 text-fg-muted hover:bg-subtle md:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              Vote
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
