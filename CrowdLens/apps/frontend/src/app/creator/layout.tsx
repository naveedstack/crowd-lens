import { Appbar } from "./components/Appbar";

export default function CreatorLayout({
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
