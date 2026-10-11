import { AppHeader } from "@/components/AppHeader";

export default function CreatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <AppHeader />
      {children}
    </div>
  );
}
