import type { Metadata } from "next";
import { ValidatorsShell } from "./ValidatorsShell";

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
  return <ValidatorsShell>{children}</ValidatorsShell>;
}
