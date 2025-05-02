import React from 'react';

export default function TweetShareButton({ mintId, tier, mintAddress }) {
  // Use the network from environment variable with fallback to devnet
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  
  // Create Solscan link for the token
  const solscanUrl = mintAddress 
    ? `https://solscan.io/token/${mintAddress}?cluster=${network}`
    : `https://solscan.io`;
  
  // Create Magic Eden link
  const magicEdenUrl = mintAddress
    ? `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`
    : `https://magiceden.io/marketplace/slr`;
    
  // Create TESOLA.xyz link
  const tesolaUrl = `https://tesola.xyz/solara/${mintId}`;
  
  // Create tweet text with proper links including tesola.xyz
  const text = encodeURIComponent(
    `I just minted SOLARA #${mintId} – ${tier} tier! 🚀\n\n` +
    `View on Solscan: ${solscanUrl}\n` +
    `View on Magic Eden: ${magicEdenUrl}\n` +
    `Visit: ${tesolaUrl}\n\n` +
    `#SOLARA #NFT #Solana`
  );
  
  // Twitter share URL (no additional URL parameter needed)
  const tweetUrl = `https://twitter.com/intent/tweet?text=${text}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mint-button inline-block mt-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
      </svg>
      Tweet it!
    </a>
  );
}

// -------------------------------
// File: components/TelegramShareButton.js
// -------------------------------
"use client";

import React from 'react';

export default function TelegramShareButton({ mintId, tier, mintAddress }) {
  // Use the network from environment variable with fallback to devnet
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  
  // Create Solscan link for the token
  const solscanUrl = mintAddress 
    ? `https://solscan.io/token/${mintAddress}?cluster=${network}`
    : `https://solscan.io`;
  
  // Create Magic Eden link
  const magicEdenUrl = mintAddress
    ? `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`
    : `https://magiceden.io/marketplace/slr`;
    
  // Create TESOLA.xyz link
  const tesolaUrl = `https://tesola.xyz/solara/${mintId}`;
  
  // Create Telegram community URL (the TESOLA Telegram community)
  const telegramCommunityUrl = "https://t.me/TESLAINSOLANA";
  
  // Create share text with all links including tesola.xyz
  const text = encodeURIComponent(
    `I just minted SOLARA #${mintId} – ${tier} tier! 🚀\n\n` +
    `View on Solscan: ${solscanUrl}\n` +
    `View on Magic Eden: ${magicEdenUrl}\n` +
    `Visit: ${tesolaUrl}\n\n` +
    `Join our community: ${telegramCommunityUrl}\n\n` +
    `#SOLARA #NFT #Solana`
  );
  
  // Direct to Telegram community with pre-filled message
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramCommunityUrl)}&text=${text}`;

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="telegram-button inline-block mt-2 ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      <svg className="h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.665,3.717l-17.73,6.837c-1.21,0.486-1.203,1.161-0.222,1.462l4.552,1.42l10.532-6.645c0.498-0.303,0.953-0.14,0.579,0.192l-8.533,7.701l-0.332,4.99c0.487,0,0.703-0.223,0.979-0.486l2.353-2.276l4.882,3.604c0.898,0.496,1.552,0.24,1.773-0.832l3.383-15.942l0,0C22.461,3.127,21.873,2.817,20.665,3.717z"/>
      </svg>
      Share on Telegram
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