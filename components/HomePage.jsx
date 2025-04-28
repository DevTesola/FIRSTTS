"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MintSection from "./MintSection";
import SolaraHeader from "./SolaraHeader";
import CollectionInfo from "./CollectionInfo";
import InfoModal from "./InfoModal";
import RefundPolicyModal from "./RefundPolicyModal";
import FooterLinks from "./FooterLinks";
import MintResultModal from "./MintResultModal";

// Dynamic import for better performance
const VideoPlayer = dynamic(() => import("./VideoPlayer"), { ssr: false });

const COLLECTION_SIZE = 1000;
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function HomePage({ initialMintedCount = 0 }) {
  // State management
  const [loading, setLoading] = useState(false);
  const [minted, setMinted] = useState(initialMintedCount);
  const [showHow, setShowHow] = useState(false);
  const [mintPrice] = useState("1.5 SOL");
  const [isClient, setIsClient] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch minted count on load
  useEffect(() => {
    const fetchMintedCount = async () => {
      try {
        const res = await fetch("/api/getMintedCount");
        if (!res.ok) {
          throw new Error(`Failed to fetch minted count: ${res.statusText}`);
        }
        const { count } = await res.json();
        setMinted(count);
      } catch (err) {
        console.error("Failed to fetch minted count:", err);
      }
    };
    fetchMintedCount();
  }, []);

  // ESC key handler for modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowHow(false);
        setShowRefundPolicy(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Callback for when minting is complete
  const handleMintComplete = (result) => {
    // Update minted count
    const fetchUpdatedCount = async () => {
      try {
        const countRes = await fetch("/api/getMintedCount");
        if (countRes.ok) {
          const { count } = await countRes.json();
          setMinted(count);
        }
      } catch (error) {
        console.error("Error updating count:", error);
      }
    };
    
    fetchUpdatedCount();
    setMintResult(result);
  };

  return (
    <div className="relative z-20 mx-auto w-full max-w-3xl px-4">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {/* Modals */}
      <MintResultModal result={mintResult} onClose={() => setMintResult(null)} />
      <RefundPolicyModal isVisible={showRefundPolicy} onClose={() => setShowRefundPolicy(false)} />
      <InfoModal isVisible={showHow} onClose={() => setShowHow(false)} />
      
      {/* Main content */}
      <SolaraHeader />
      <VideoPlayer src="/SOLARA.mp4" />
      <CollectionInfo minted={minted} collectionSize={COLLECTION_SIZE} />
      
      {/* Mint section */}
      <MintSection
        mintPrice={mintPrice}
        onMintComplete={handleMintComplete}
        isClient={isClient}
        setErrorMessage={setErrorMessage}
        setLoading={setLoading}
        showRefundPolicy={() => setShowRefundPolicy(true)}
      />
      
      {/* Error message display */}
      {errorMessage && (
        <div className="text-red-500 font-mono text-sm md:text-base mt-4 text-center">
          {errorMessage}
        </div>
      )}
      
      {/* Footer links */}
      <FooterLinks onShowHowItWorks={() => setShowHow(true)} />
    </div>
  );
}