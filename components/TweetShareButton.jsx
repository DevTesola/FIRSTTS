import React from 'react';

export default function TweetShareButton({ mintId, tier }) {
  const text = `I just minted SOLARA #${mintId} – ${tier} tier! 🚀 #TESOLA`;
  const url = `${window.location.origin}/solara/${mintId}`;
  const tweetUrl =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mint-button inline-block mt-2"
    >
      Tweet it!
    </a>
  );
}

// -------------------------------
// File: components/WalletButton.js
// -------------------------------
"use client";

import dynamic from "next/dynamic";

export const WalletButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
    loading: () => <span>Loading Wallet...</span>,
  }
);