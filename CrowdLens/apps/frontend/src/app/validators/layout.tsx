import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "CrowdLens | Validators",
  description:
    "Earn 80% of every creator escrow in Devnet SOL by voting on image comparisons.",
};

export default function ValidatorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <AppHeader />
      {children}
    </div>
  );
}
