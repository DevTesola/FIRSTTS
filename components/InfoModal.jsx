"use client";

import React from "react";

export default function InfoModal({ isVisible, onClose }) {
  if (!isVisible) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-gray-900 p-6 rounded-xl max-w-xl w-full space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close modal"
        >
          ✕
        </button>
        <h3 id="modal-title" className="text-2xl font-bold">How SOLARA GEN:0 Works</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Each NFT is fully randomly generated On-chain.</li>
          <li>Instant minting at 1.5 SOL, with pre-signed transactions provided by the seller.</li>
          <li>Transfer 3+ times after minting to qualify for Tiered Rewards.</li>
          <li>Additional benefits unlocked through community events and partnerships.</li>
        </ul>
      </div>
    </div>
  );
}