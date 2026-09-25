"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getToken, subscribeAuth } from "./auth";

export function useAuthSession() {
  const { connected, connecting } = useWallet();
  const [authTick, setAuthTick] = useState(0);
  const [adapterSettled, setAdapterSettled] = useState(false);
  const [signInTimedOut, setSignInTimedOut] = useState(false);

  useEffect(() => subscribeAuth(() => setAuthTick((tick) => tick + 1)), []);

  useEffect(() => {
    if (getToken() || connected) {
      setAdapterSettled(true);
      return;
    }

    if (connecting) {
      setAdapterSettled(false);
      return;
    }

    const id = window.setTimeout(() => setAdapterSettled(true), 500);
    return () => window.clearTimeout(id);
  }, [connecting, connected, authTick]);

  const token = getToken();

  useEffect(() => {
    if (token || !connected || connecting) {
      setSignInTimedOut(false);
      return;
    }

    const id = window.setTimeout(() => setSignInTimedOut(true), 20000);
    return () => window.clearTimeout(id);
  }, [token, connected, connecting]);

  const waitingForAuth = !token && !signInTimedOut && (!adapterSettled || connecting || connected);
  const unauthenticated = Boolean(
    !token && (signInTimedOut || (adapterSettled && !connecting && !connected)),
  );

  return { token, waitingForAuth, unauthenticated, connected, connecting, authTick };
}
