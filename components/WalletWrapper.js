"use client";

import { useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { Connection } from "@solana/web3.js";

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function WalletWrapper({ children }) {
  if (!SOLANA_RPC_ENDPOINT) {
    throw new Error("NEXT_PUBLIC_SOLANA_RPC_ENDPOINT environment variable not set.");
  }

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const endpoints = useMemo(
    () => [SOLANA_RPC_ENDPOINT, "https://api.devnet.solana.com"],
    []
  );
  const [endpoint, setEndpoint] = useState(endpoints[0]);

  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        const connection = new Connection(endpoint);
        await connection.getVersion();
      } catch {
        setEndpoint(endpoints[1]);
      }
    };
    checkEndpoint();
  }, [endpoint, endpoints]);

  console.log("Rendering WalletModalProvider with wallets:", wallets);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error) => alert(`Wallet connection error: ${error.message}`)}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}