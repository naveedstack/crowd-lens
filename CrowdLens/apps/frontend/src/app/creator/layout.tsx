import { AppHeader } from "@/components/AppHeader";

export default function CreatorLayout({
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
