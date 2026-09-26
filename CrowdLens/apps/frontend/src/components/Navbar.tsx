"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, BarChart3 } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { useWallet } from "@solana/wallet-adapter-react";
import "@solana/wallet-adapter-react-ui/styles.css";
import { isUiPreview } from '@/lib/ui-preview';
import { clearToken, hasValidSession, signInWithWallet } from '@/lib/auth';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { publicKey, signMessage, connected } = useWallet();
  const hadWallet = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isUiPreview) return;

    if (connected && publicKey) {
      hadWallet.current = true;
      if (hasValidSession(publicKey.toBase58())) {
        return;
      }
      if (!signMessage) {
        return;
      }
      signInWithWallet(publicKey, signMessage).catch((err) => {
        console.error("Login failed:", err);
      });
      return;
    }

    if (hadWallet.current && !connected) {
      clearToken();
      hadWallet.current = false;
    }
  }, [connected, publicKey, signMessage]);


  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-violet-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
                CrowdLens
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Results
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/stats" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Stats
            </Link>
            <Link href="/case-studies" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Case studies
            </Link>
          </nav>

          {/* CTA Buttons */}

          <div className="hidden md:flex items-center space-x-4">
              <div className="rounded-xl px-5 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                <WalletButton />
              </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden ${
          isMenuOpen ? 'block' : 'hidden'
        } bg-slate-900/95 backdrop-blur-md shadow-lg`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <a
            href="#features"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </a>
          <a
            href="#testimonials"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Results
          </a>
          <a
            href="#faq"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            FAQ
          </a>
          <Link
            href="/stats"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Stats
          </Link>
          <Link
            href="/case-studies"
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setIsMenuOpen(false)}
          >
            Case studies
          </Link>
          <div className="px-3 pt-2">
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;