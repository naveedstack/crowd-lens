"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

type WalletButtonProps = {
  connectClassName?: string;
  disconnectClassName?: string;
};

export function WalletButton({
  connectClassName,
  disconnectClassName,
}: WalletButtonProps) {
  const { publicKey } = useWallet();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="h-9 w-9 rounded-full bg-subtle sm:min-w-[148px] sm:w-auto sm:rounded-lg"
        aria-hidden
      />
    );
  }

  return publicKey ? (
    <WalletDisconnectButton className={disconnectClassName} />
  ) : (
    <WalletMultiButton className={connectClassName} />
  );
}
