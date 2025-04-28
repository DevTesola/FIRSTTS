"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  HeartIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { Connection, Transaction } from "@solana/web3.js";
import MintResultModal from "./MintResultModal";

// WalletMultiButton 스타일 임포트
import "@solana/wallet-adapter-react-ui/styles.css";

const VideoPlayer = dynamic(() => import("./VideoPlayer"), { ssr: false });

const COLLECTION_SIZE = 1000;
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function HomePage({ initialMintedCount = 0 }) {
  const [loading, setLoading] = useState(false);
  const [minted, setMinted] = useState(initialMintedCount);
  const [showHow, setShowHow] = useState(false);
  const [mintPrice] = useState("1.5 SOL");
  const [isClient, setIsClient] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  
  // 환불 정책 관련 state 추가
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const { publicKey, connected, signTransaction } = useWallet() || {};

  useEffect(() => {
    setIsClient(true);
    console.log("isClient set to true");
  }, []);

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

  useEffect(() => {
    console.log("Phantom available:", !!window.solana);
    console.log("Solflare available:", !!window.solflare);
    console.log("Wallet connected:", connected);
    if (connected && publicKey) {
      console.log("Connected wallet address:", publicKey.toBase58());
    }
  }, [connected, publicKey]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowHow(false);
      if (e.key === "Escape") setShowRefundPolicy(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      if (!connected || !publicKey) throw new Error("Please connect a wallet");

      // 1단계: 구매 준비 - NFT 예약 및 결제 트랜잭션 생성
      console.log("Preparing purchase...");
      const res = await fetch("/api/purchaseNFT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server response error: ${errorText}`);
        }
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const { transaction, mint, filename, mintIndex, lockId, paymentId } = await res.json();
      console.log("Received transaction data:", { transaction, mint, filename, mintIndex, lockId });

      // 2단계: 결제 트랜잭션 서명 및 제출
      const txBuf = Buffer.from(transaction, "base64");
      if (txBuf.length > 1232) {
        throw new Error("Transaction size exceeds Solana limit (1232 bytes)");
      }

      const tx = Transaction.from(txBuf);
      if (!tx.feePayer) tx.feePayer = publicKey;

      console.log("Signing transaction...");
      const signedTx = await signTransaction(tx);
      console.log("Transaction signed:", signedTx);
      const rawTx = signedTx.serialize();

      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      const signature = await connection.sendRawTransaction(rawTx);
      await connection.confirmTransaction(signature);

      // 추가: 결제 확인 후 민팅 완료 API 호출
      console.log("Completing minting process...");
      const completeRes = await fetch("/api/completeMinting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          paymentTxId: signature,
          mintIndex,
          lockId
        }),
      });

      if (!completeRes.ok) {
        const completeErrData = await completeRes.json();
        throw new Error(completeErrData.error || "Failed to complete minting");
      }

      const completeMintData = await completeRes.json();
      console.log("Minting completed:", completeMintData);

      // 민팅 카운트 즉시 업데이트
      const countRes = await fetch("/api/getMintedCount");
      if (!countRes.ok) {
        throw new Error(`Failed to fetch updated count: ${countRes.statusText}`);
      }
      const { count } = await countRes.json();
      setMinted(count);

      // 메타데이터 로드
      const metadataUrl = `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${process.env.NEXT_PUBLIC_RESOURCE_CID}/${filename}.json`;
      const metadataRes = await fetch(metadataUrl);
      if (!metadataRes.ok) throw new Error("Failed to load metadata from IPFS");
      const metadata = await metadataRes.json();

      setMintResult({ metadata, filename });
      alert(`✅ Minting successful! TX: ${signature}`);
    } catch (err) {
      console.error("Minting error:", err);
      let userMessage = "Minting failed. Please try again.";
      if (err.message.includes("wallet")) userMessage = "Wallet not connected.";
      else if (err.message.includes("No available NFT")) userMessage = "All NFTs are sold out.";
      else if (err.message.includes("metadata")) userMessage = "Failed to load NFT metadata. Please check IPFS connection and try again.";
      else if (err.message.includes("Invalid wallet")) userMessage = "Invalid wallet address.";
      else if (err.message.includes("buffer")) userMessage = "Invalid transaction data from server.";
      else if (err.message.includes("blockhash")) userMessage = "Invalid transaction configuration.";
      setErrorMessage(userMessage);
      alert(`Error: ${userMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 환불 정책 모달
  const RefundPolicyModal = () => (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={() => setShowRefundPolicy(false)}>
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
          <button onClick={() => setShowRefundPolicy(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">
            Close
          </button>
          <Link href="/solara/refund-policy" target="_blank" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
            Full Policy
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-20 mx-auto w-full max-w-3xl px-4">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      <MintResultModal result={mintResult} onClose={() => setMintResult(null)} />
      
      {showRefundPolicy && <RefundPolicyModal />}
      
      <div id="home" className="text-center mt-16 space-y-2">
        <h1 className="neon-title text-7xl md:text-8xl">
          SOLARA <span className="text-orange-400">GEN:0</span>
        </h1>
        <p className="text-md md:text-lg font-semibold">
          <span className="text-purple-400">SOLARA</span> : the ultimate symbol of{" "}
          <span className="text-purple-400">Solana Maxis</span>
        </p>
      </div>
      <VideoPlayer src="/SOLARA.mp4" />
      <div className="text-center mt-8 space-y-1">
        <p className="text-xl md:text-2xl">
          <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500">
            {COLLECTION_SIZE}
          </span>{" "}
          uniquely generated{" "}
          <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-300">
            NFTs
          </span>
          . Verified.
        </p>
        <p className="text-lg md:text-xl flex items-center justify-center space-x-2">
          <span>Tiered. Built for Holders.</span>
          <HeartIcon className="h-6 w-6 text-pink-400" />
        </p>
        <p className="text-purple-300 font-mono text-sm md:text-base">
          {minted} / {COLLECTION_SIZE} Minted
        </p>
      </div>
      <div className="flex flex-col items-center space-y-6 mt-10 w-full max-w-sm mx-auto">
        {isClient ? (
          <>
            <div style={{ border: "2px solid red", padding: "10px" }}>
              <p>Wallet Button Container</p>
              <WalletMultiButton />
            </div>
            {connected && publicKey && (
              <div className="bg-gray-800 text-purple-300 font-mono text-sm md:text-base rounded-lg px-4 py-2 shadow-md">
                Connected Wallet: {publicKey.toBase58()}
              </div>
            )}
          </>
        ) : (
          <div>Loading wallet button...</div>
        )}
        
        {isClient && connected && (
          <div className="w-full">
            {/* 환불 정책 동의 체크박스 */}
            <div className="mb-4 flex items-start space-x-2">
              <input
                type="checkbox"
                id="agreeToPolicy"
                checked={agreedToPolicy}
                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="agreeToPolicy" className="text-sm">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowRefundPolicy(true)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  refund policy
                </button>
                {" "}and understand that NFT sales are final.
              </label>
            </div>
            
            <button
              onClick={handlePurchase}
              disabled={loading || !agreedToPolicy}
              className={`w-full mint-button inline-flex items-center justify-center ${
                !agreedToPolicy ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Minting..." : `Mint Now (${mintPrice})`}
              <span className="ml-3">
                <Image src="/logo2.png" alt="SOLARA Logo" width={32} height={32} priority />
              </span>
            </button>
          </div>
        )}
        
        {isClient && !connected && (
          <div className="text-red-500 font-mono text-sm md:text-base">
            Wallet not connected. Please connect a wallet to mint.
          </div>
        )}
        
        {errorMessage && (
          <div className="text-red-500 font-mono text-sm md:text-base mt-4">
            {errorMessage}
          </div>
        )}
      </div>
      <div className="flex justify-center space-x-8 mt-8">
        
       {/* Corrected "Verified on Magic Eden" link */}
<a
  href="https://magiceden.io/marketplace/slr"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center space-x-2 hover:underline"
>
  <CheckBadgeIcon className="h-6 w-6 text-green-400" />
  <span className="font-semibold text-purple-400">Verified on Magic Eden</span>
</a>
        <button
          onClick={() => setShowHow(true)}
          className="flex items-center space-x-2 text-white bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
        >
          <InformationCircleIcon className="h-5 w-5" />
          <span>How it works</span>
        </button>
      </div>
      {showHow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setShowHow(false)}
          role="dialog"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-gray-900 p-6 rounded-xl max-w-xl w-full space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHow(false)}
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
      )}
      

      
    </div>
  );
}