import type { Metadata } from "next";
import { Appbar } from "@/components/voter/Appbar";

export const metadata: Metadata = {
  title: "CrowdLens Worker | Earn by Providing Content Feedback",
  description:
    "Join CrowdLens as a content validator and earn rewards for providing valuable feedback. Our worker platform connects you with creators seeking authentic human insights. Powered by Solana blockchain for instant, transparent payments. Start contributing to the future of content creation today.",
};

export default function VoterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Appbar />
      {children}
    </div>
  );
}
