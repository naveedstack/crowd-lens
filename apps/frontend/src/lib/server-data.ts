import { FALLBACK_ECONOMICS, type Economics } from "./economics";
import { isUiPreview, MOCK_ECONOMICS, MOCK_PLATFORM_STATS, type PreviewPlatformStats } from "./ui-preview";

function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "";
}

export async function fetchEconomics(): Promise<Economics | null> {
  if (isUiPreview) {
    return { ...FALLBACK_ECONOMICS, ...MOCK_ECONOMICS, source: "preview" };
  }

  const base = backendUrl();
  if (!base) {
    return null;
  }

  try {
    const response = await fetch(`${base}/api/v1/user/economics`, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as Economics;
    if (!(data.lamportsPerVote > 0)) {
      return null;
    }
    return { ...FALLBACK_ECONOMICS, ...data };
  } catch {
    return null;
  }
}

export async function fetchPlatformStats(): Promise<PreviewPlatformStats | null> {
  if (isUiPreview) {
    return MOCK_PLATFORM_STATS;
  }

  const base = backendUrl();
  if (!base) {
    return null;
  }

  try {
    const response = await fetch(`${base}/api/v1/stats`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PreviewPlatformStats;
  } catch {
    return null;
  }
}
