"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "../components/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useWallet } from "@solana/wallet-adapter-react";

const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { publicKey } = useWallet();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (publicKey) {
      router.push("/creator");
      return;
    }
    toast.error("Connect your wallet to continue", {
      duration: 3000,
      position: "top-center",
    });
  };

  return (
    <section className="overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className={`transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div className="mb-6 inline-flex items-center rounded-full border border-cyan-500/30 bg-slate-900 px-3 py-1 text-sm font-medium text-cyan-400">
              <span className="mr-2 h-2 w-2 rounded-full bg-cyan-400" />
              Solana Devnet · community-powered content oracle
            </div>
            <h1 className="font-display mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-white">Real humans pick the thumbnail</span>
              <span className="headline-gradient mt-2 block">before you publish</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg text-slate-400">
              Upload two to five images, escrow SOL, and let validators vote. When the batch fills, the winner is committed on-chain and voters are paid in Devnet SOL.
            </p>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={handleGetStarted}>
                Create a task
              </Button>
              <Link href="/validators">
                <Button variant="outline" size="lg" className="w-full">
                  Vote as a validator
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500">Creators pay $1 per vote · Validators earn $0.80 per vote · Settled in SOL</p>
          </div>

          <div className={`relative transition-all delay-200 duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/15 to-cyan-500/15 blur-3xl" />
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>Live comparison</span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">Done</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-xl ring-2 ring-violet-500">
                  <span className="absolute top-2 left-2 z-10 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-semibold text-white">
                    Winner
                  </span>
                  <Image
                    src="https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg"
                    alt="Winning thumbnail"
                    className="h-40 w-full object-cover"
                    width={400}
                    height={160}
                  />
                  <div className="bg-slate-950 px-3 py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Option A</span>
                      <span className="font-medium text-white">72%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[72%] bg-violet-500" />
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-800">
                  <Image
                    src="https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg"
                    alt="Runner-up thumbnail"
                    className="h-40 w-full object-cover"
                    width={400}
                    height={160}
                  />
                  <div className="bg-slate-950 px-3 py-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Option B</span>
                      <span className="font-medium text-white">28%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[28%] bg-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
