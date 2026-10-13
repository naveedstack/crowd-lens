import Image from "next/image";
import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const heightClass = compact ? "h-8" : "h-10";

  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label="CrowdLens home">
      <Image
        src="/brand/logo-light.png"
        alt=""
        width={456}
        height={96}
        className={`brand-mark-light ${heightClass} w-auto`}
        priority={compact}
      />
      <Image
        src="/brand/logo-dark.png"
        alt=""
        width={456}
        height={96}
        className={`brand-mark-dark ${heightClass} w-auto`}
        priority={compact}
      />
    </Link>
  );
}
