import { env } from "./env";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const CACHE_MS = 60_000;

type CachedQuote = {
  usd: number;
  source: string;
  at: number;
};

let cache: CachedQuote | null = null;

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "CrowdLens/1.0" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function asPositiveNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchFromJupiter(): Promise<number> {
  const payload = (await fetchJson(
    `https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`,
  )) as Record<string, { usdPrice?: unknown; price?: unknown }>;
  const usd =
    asPositiveNumber(payload?.[SOL_MINT]?.usdPrice) ??
    asPositiveNumber(payload?.[SOL_MINT]?.price);
  if (!usd) {
    throw new Error("Jupiter price missing");
  }
  return usd;
}

async function fetchFromCoinGecko(): Promise<number> {
  const payload = (await fetchJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
  )) as { solana?: { usd?: unknown } };
  const usd = asPositiveNumber(payload?.solana?.usd);
  if (!usd) {
    throw new Error("CoinGecko price missing");
  }
  return usd;
}

export async function getSolUsd(): Promise<{ usd: number; source: string }> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return { usd: cache.usd, source: cache.source };
  }

  const sources: Array<[string, () => Promise<number>]> = [
    ["jupiter", fetchFromJupiter],
    ["coingecko", fetchFromCoinGecko],
  ];

  for (const [source, fetchPrice] of sources) {
    try {
      const usd = await fetchPrice();
      cache = { usd, source, at: Date.now() };
      return { usd, source };
    } catch (err) {
      console.warn(`SOL/USD ${source} failed:`, err instanceof Error ? err.message : err);
    }
  }

  if (cache) {
    return { usd: cache.usd, source: `${cache.source}-stale` };
  }

  return { usd: env.SOL_USD_FALLBACK, source: "fallback" };
}
