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
import LoadingOverlay from "./LoadingOverlay";
import ErrorMessage from "./ErrorMessage";
import NFTPreviewMinter from "./NFTPreviewMinter";

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
  const [errorDetails, setErrorDetails] = useState(null);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mintAttempts, setMintAttempts] = useState(0);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    
    // Check local storage for previously visited previews
    const hasSeenPreview = localStorage.getItem("hasSeen_NFTPreview");
    if (!hasSeenPreview) {
      setTimeout(() => {
        setShowPreview(true);
      }, 3000); // Show NFT preview after 3 seconds on site
    }
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
    
    // Set up interval to refresh minted count periodically
    const countInterval = setInterval(fetchMintedCount, 60000); // Refresh every minute
    
    return () => clearInterval(countInterval);
  }, []);

  // ESC key handler for modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowHow(false);
        setShowRefundPolicy(false);
        // Don't close the preview modal with ESC
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Handle mint preview closing
  const handleClosePreview = () => {
    setShowPreview(false);
    localStorage.setItem("hasSeen_NFTPreview", "true");
  };

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
    setMintAttempts(0); // Reset mint attempts counter on successful mint
  };

  // Handle mint button click from the preview
  const handleMintFromPreview = () => {
    handleClosePreview();
    setMintAttempts(prevAttempts => prevAttempts + 1);
    
    // Focus the main mint button after closing preview (if possible)
    setTimeout(() => {
      const mintButton = document.querySelector(".mint-section .mint-button");
      if (mintButton) {
        mintButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mintButton.focus();
      }
    }, 500);
  };

  // Handle retry after error
  const handleErrorRetry = () => {
    setErrorMessage(null);
    setErrorDetails(null);
  };

  return (
    <div className="relative z-20 mx-auto w-full max-w-3xl px-4">
      {/* Loading overlay */}
      {loading && <LoadingOverlay message="Processing transaction..." />}
      
      {/* Modals */}
      <MintResultModal result={mintResult} onClose={() => setMintResult(null)} />
      <RefundPolicyModal isVisible={showRefundPolicy} onClose={() => setShowRefundPolicy(false)} />
      <InfoModal isVisible={showHow} onClose={() => setShowHow(false)} />
      
      {/* NFT Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl">
            <div className="flex justify-end mb-2">
              <button 
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-white p-2"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            
            <NFTPreviewMinter 
              mintPrice={mintPrice}
              onMint={handleMintFromPreview}
              loading={loading}
            />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <SolaraHeader />
      <VideoPlayer src="/SOLARA.mp4" />
      <CollectionInfo minted={minted} collectionSize={COLLECTION_SIZE} />
      
      {/* Mint section */}
      <div className="mint-section">
        <MintSection
          mintPrice={mintPrice}
          onMintComplete={handleMintComplete}
          isClient={isClient}
          setErrorMessage={setErrorMessage}
          setErrorDetails={setErrorDetails}
          setLoading={setLoading}
          showRefundPolicy={() => setShowRefundPolicy(true)}
          mintAttempts={mintAttempts}
        />
      </div>
      
 {/* Error message display */}
 {errorMessage && (
        <div className="mt-4">
          <ErrorMessage 
            message={errorMessage} 
            type="error" 
            errorDetails={errorDetails}
            onDismiss={() => {
              setErrorMessage(null);
              setErrorDetails(null);
            }}
          />
        </div>
      )}
      
      {/* Footer links */}
      <FooterLinks onShowHowItWorks={() => setShowHow(true)} />
      
      {/* Preview button - bottom right */}
      {!showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-20 flex items-center"
          aria-label="Show NFT previews"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="ml-2 hidden md:inline">Preview NFTs</span>
        </button>
      )}
    </div>
  );
}