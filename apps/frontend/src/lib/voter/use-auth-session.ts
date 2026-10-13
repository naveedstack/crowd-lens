"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { getToken, subscribeAuth } from "./auth";

export function useAuthSession() {
  const { publicKey, connected, connecting } = useWallet();
  const [authTick, setAuthTick] = useState(0);
  const [adapterSettled, setAdapterSettled] = useState(false);
  const [signInTimedOut, setSignInTimedOut] = useState(false);

  const walletReady = Boolean(publicKey) || connected;

  useEffect(() => subscribeAuth(() => setAuthTick((tick) => tick + 1)), []);

  useEffect(() => {
    if (getToken() || walletReady) {
      setAdapterSettled(true);
      return;
    }

    if (connecting) {
      setAdapterSettled(false);
      return;
    }

    const id = window.setTimeout(() => setAdapterSettled(true), 500);
    return () => window.clearTimeout(id);
  }, [connecting, walletReady, authTick]);

  const token = getToken();

  useEffect(() => {
    if (token || !walletReady || connecting) {
      setSignInTimedOut(false);
      return;
    }

    const id = window.setTimeout(() => setSignInTimedOut(true), 20000);
    return () => window.clearTimeout(id);
  }, [token, walletReady, connecting]);

  const waitingForAuth =
    !token && !signInTimedOut && (!adapterSettled || connecting || walletReady);
  const unauthenticated = Boolean(
    !token && adapterSettled && !connecting && !walletReady,
  );

  return {
    token,
    waitingForAuth,
    unauthenticated,
    signInTimedOut,
    connected: walletReady,
    connecting,
    authTick,
  };
}
