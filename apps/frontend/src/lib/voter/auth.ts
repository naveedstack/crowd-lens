import { sessionMatchesWallet } from "../jwt-session";

const TOKEN_KEY = "crowdlens.worker.token";

type AuthListener = () => void;
const listeners = new Set<AuthListener>();

function notifyAuth() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAuth(listener: AuthListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  const value = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  localStorage.setItem(TOKEN_KEY, value);
  notifyAuth();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  notifyAuth();
}

export function hasValidSession(address: string | undefined): boolean {
  return sessionMatchesWallet(getToken(), address);
}

let inflight: Promise<string> | null = null;

type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;

export async function signInWithWallet(
  publicKey: { toBase58: () => string },
  signMessage: SignMessage | undefined,
): Promise<string> {
  const address = publicKey.toBase58();
  if (hasValidSession(address)) {
    return getToken() as string;
  }
  if (inflight) {
    return inflight;
  }
  if (!signMessage) {
    throw new Error("Wallet does not support message signing");
  }

  inflight = (async () => {
    const { default: axios } = await import("axios");
    const baseURL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/worker`;

    const nonceRes = await axios.post(`${baseURL}/signin/nonce`, { publicKey: address });
    const signature = await signMessage(new TextEncoder().encode(nonceRes.data.message));
    const signInRes = await axios.post(`${baseURL}/signin`, {
      publicKey: address,
      nonce: nonceRes.data.nonce,
      signature: Array.from(signature),
    });

    setToken(signInRes.data.token);
    return signInRes.data.token as string;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

type ResignHandler = () => Promise<void>;
let resignHandler: ResignHandler | null = null;

export function setResignHandler(handler: ResignHandler | null) {
  resignHandler = handler;
}

export function getResignHandler() {
  return resignHandler;
}
