import * as creatorAuth from "./auth";
import * as workerAuth from "./voter/auth";

type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;

function backend(path: string) {
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`;
}

async function exchange(fromToken: string, path: string): Promise<string> {
  const { default: axios } = await import("axios");
  const response = await axios.post<{ token: string }>(
    backend(path),
    {},
    { headers: { Authorization: fromToken } },
  );
  return response.data.token;
}

export function clearAllSessions() {
  creatorAuth.clearToken();
  workerAuth.clearToken();
}

export function hasFullSession(address: string | undefined) {
  return Boolean(
    address && creatorAuth.hasValidSession(address) && workerAuth.hasValidSession(address),
  );
}

/** One Phantom signature. Creator and validator JWTs are issued from that proof. */
export async function ensureWalletSessions(
  publicKey: { toBase58: () => string },
  signMessage: SignMessage | undefined,
) {
  const address = publicKey.toBase58();
  const creatorOk = creatorAuth.hasValidSession(address);
  const workerOk = workerAuth.hasValidSession(address);

  if (creatorOk && workerOk) {
    return;
  }

  if (creatorOk && !workerOk) {
    const creatorToken = creatorAuth.getToken();
    if (creatorToken) {
      try {
        workerAuth.setToken(await exchange(creatorToken, "/api/v1/worker/signin/from-session"));
        return;
      } catch {
        creatorAuth.clearToken();
      }
    }
  }

  if (workerOk && !creatorOk) {
    const workerToken = workerAuth.getToken();
    if (workerToken) {
      try {
        creatorAuth.setToken(await exchange(workerToken, "/api/v1/user/signin/from-session"));
        return;
      } catch {
        workerAuth.clearToken();
      }
    }
  }

  await creatorAuth.signInWithWallet(publicKey, signMessage);
  const creatorToken = creatorAuth.getToken();
  if (!creatorToken) {
    throw new Error("Sign-in did not return a session");
  }
  workerAuth.setToken(await exchange(creatorToken, "/api/v1/worker/signin/from-session"));
}
