import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function RefundPolicy() {
  return (
    <>
      <Head>
        <title>SOLARA NFT Refund Policy | TESOLA</title>
        <meta name="description" content="Refund policy for SOLARA NFT collection on Solana blockchain." />
      </Head>
      
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          SOLARA NFT Refund Policy
        </h1>
        
        <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 space-y-6 shadow-lg">
          <section>
            <h2 className="text-xl font-semibold text-purple-300 mb-3">1. Basic Principle</h2>
            <p className="text-gray-200">
              SOLARA NFT sales are final and non-refundable.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-purple-300 mb-3">2. Exceptional Refund Conditions</h2>
            <ul className="list-disc pl-5 text-gray-200 space-y-2">
              <li>Technical errors causing NFT minting to fail while SOL was deducted</li>
              <li>Duplicate minting of the same NFT</li>
              <li>Server errors resulting in incorrect metadata assignment</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-purple-300 mb-3">3. How to Request a Refund</h2>
            <ul className="list-disc pl-5 text-gray-200 space-y-2">
              <li>Refund requests must be made within 48 hours of minting</li>
              <li>Submit requests through our Telegram channel: <a href="https://t.me/TESLAINSOLANA" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View @TESLAINSOLANA</a></li>
              <li>Include transaction hash, wallet address, and problem description</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-purple-300 mb-3">4. Refund Processing</h2>
            <ul className="list-disc pl-5 text-gray-200 space-y-2">
              <li>Requests will be processed within 7 days after review</li>
              <li>Refunds will only be made to the original purchasing wallet</li>
              <li>Network fees (gas fees) are not refundable</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-purple-300 mb-3">5. Additional Notes</h2>
            <ul className="list-disc pl-5 text-gray-200 space-y-2">
              <li>Refunds are not available for change of mind or dissatisfaction with NFT design</li>
              <li>All refund decisions are at the discretion of the SOLARA team</li>
            </ul>
          </section>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link href="/solara" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition duration-200">
            Return to SOLARA Mint Page
          </Link>
        </div>
      </div>
    </>
  );
}