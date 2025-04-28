"use client";

import { useMemo, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { Connection } from "@solana/web3.js";

// Default to devnet if environment variable is not set
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function WalletWrapper({ children }) {
  // Validate RPC endpoint is available
  if (!SOLANA_RPC_ENDPOINT) {
    console.error("Warning: NEXT_PUBLIC_SOLANA_RPC_ENDPOINT environment variable not set. Using default devnet endpoint.");
  }

  // Create wallet adapters array
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Define endpoint
  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  
  // Load wallet adapter styles
  useEffect(() => {
    // This will load the styles client-side
    import('@solana/wallet-adapter-react-ui/styles.css')
      .catch(err => console.error('Error loading wallet adapter styles:', err));
  }, []);

  // Handle wallet connection errors
  const onWalletError = (error) => {
    console.error("Wallet connection error:", error);
    alert(`Wallet connection error: ${error.message || 'Unknown error'}`);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={onWalletError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}