import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V5M4 19h16M8 16V9M12 16V7M16 16v-4" strokeLinecap="round" />
        </svg>
      </span>
      <span className={`font-display font-bold headline-gradient ${compact ? "text-lg" : "text-xl"}`}>
        CrowdLens
      </span>
    </Link>
  );
}
