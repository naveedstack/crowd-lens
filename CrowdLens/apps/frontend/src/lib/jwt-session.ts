export function readJwt(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

function decodePayload(token: string): { address?: unknown; exp?: unknown } | null {
  try {
    const part = token.split(".")[1];
    if (!part) {
      return null;
    }
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as { address?: unknown; exp?: unknown };
  } catch {
    return null;
  }
}

export function sessionMatchesWallet(rawToken: string | null, address: string | undefined): boolean {
  const token = readJwt(rawToken);
  if (!token || !address) {
    return false;
  }
  const payload = decodePayload(token);
  if (!payload || payload.address !== address) {
    return false;
  }
  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}
