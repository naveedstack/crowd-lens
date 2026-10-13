"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";

export function ValidatorsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGuide = pathname === "/validators";

  return (
    <div className="min-h-screen bg-canvas text-fg">
      {isGuide ? null : <AppHeader />}
      {children}
    </div>
  );
}
