"use client";

import React from "react";
import Link from "next/link";

export default function RefundPolicyModal({ isVisible, onClose }) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 max-w-2xl w-full mx-4 p-6 rounded-xl shadow-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">SOLARA NFT Refund Policy</h2>
        
        <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
          <section>
            <h3 className="font-semibold text-purple-300">1. Basic Principle</h3>
            <p>SOLARA NFT sales are final and non-refundable.</p>
          </section>
          
          <section>
            <h3 className="font-semibold text-purple-300">2. Exceptional Refund Conditions</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Technical errors causing NFT minting to fail while SOL was deducted</li>
              <li>Duplicate minting of the same NFT</li>
              <li>Server errors resulting in incorrect metadata assignment</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-semibold text-purple-300">3. How to Request a Refund</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Refund requests must be made within 48 hours of minting</li>
              <li>Submit requests through our Telegram channel: @TESLAINSOLANA</li>
              <li>Include transaction hash, wallet address, and problem description</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-semibold text-purple-300">4. Refund Processing</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Requests will be processed within 7 days after review</li>
              <li>Refunds will only be made to the original purchasing wallet</li>
              <li>Network fees (gas fees) are not refundable</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-semibold text-purple-300">5. Additional Notes</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Refunds are not available for change of mind or dissatisfaction with NFT design</li>
              <li>All refund decisions are at the discretion of the SOLARA team</li>
            </ul>
          </section>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">
            Close
          </button>
          <Link href="/solara/refund-policy" target="_blank" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
            Full Policy
          </Link>
        </div>
      </div>
    </div>
  );
}