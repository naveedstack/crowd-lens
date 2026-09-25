const PENDING_KEY = "crowdlens.creator.pendingTask";

export type PendingTask = {
  signature: string;
  title: string;
  images: string[];
  requiredSubmissions: number;
};

export function loadPendingTask(): PendingTask | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PendingTask> & { optionKind?: string };
    if (
      parsed.optionKind === "text" ||
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.images) ||
      typeof parsed.requiredSubmissions !== "number"
    ) {
      return null;
    }
    return {
      signature: typeof parsed.signature === "string" ? parsed.signature : "",
      title: parsed.title,
      images: parsed.images.filter((url): url is string => typeof url === "string"),
      requiredSubmissions: parsed.requiredSubmissions,
    };
  } catch {
    return null;
  }
}

export function savePendingTask(draft: PendingTask) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(draft));
}

export function clearPendingTask() {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(PENDING_KEY);
}
