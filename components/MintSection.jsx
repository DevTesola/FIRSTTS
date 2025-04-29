"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Transaction } from "@solana/web3.js";
import Image from "next/image";
import ErrorMessage from "./ErrorMessage";
import WalletGuide from "./WalletGuide";

// Environment variable with fallback
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export default function MintSection({ 
  mintPrice = "1.5 SOL", 
  onMintComplete, 
  isClient = false,
  setErrorMessage,
  setErrorDetails,
  setLoading,
  showRefundPolicy,
  mintAttempts = 0
}) {
  const { publicKey, connected, signTransaction } = useWallet() || {};
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setErrorDetails(null);
      if (!connected || !publicKey) throw new Error("Please connect a wallet");

      // Step 1: Prepare purchase - Reserve NFT and create payment transaction
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

      // Step 2: Sign and submit payment transaction
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

      // Additional: Call the minting completion API after payment confirmation
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

      // Update the minting count and show result
      if (onMintComplete) {
        // Use Pinata gateway with fallback
        const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
        const resourceCID = process.env.NEXT_PUBLIC_RESOURCE_CID || '';
        const metadataUrl = `${ipfsGateway}/ipfs/${resourceCID}/${filename}.json`;
        console.log("Loading metadata from:", metadataUrl);
        
        const metadataRes = await fetch(metadataUrl);
        if (!metadataRes.ok) throw new Error("Failed to load metadata from IPFS");
        const metadata = await metadataRes.json();
        
        onMintComplete({ metadata, filename });
      }

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
      else if (err.message.includes("insufficient")) userMessage = "Insufficient funds in your wallet.";
      else if (err.message.includes("rejected")) userMessage = "Transaction rejected by wallet.";
      else if (err.message.includes("timeout")) userMessage = "Network timeout. Please try again.";
      
      setErrorMessage(userMessage);
      setErrorDetails(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-8 md:mt-10 w-full max-w-sm mx-auto">
      {/* Wallet connection guide */}
      <WalletGuide />
      
      {isClient ? (
        <>
          <div className="wallet-button-container w-full">
            <WalletMultiButton className="w-full max-w-xs mx-auto" />
          </div>
          {connected && publicKey && (
            <div className="bg-gray-800 text-purple-300 font-mono text-sm md:text-base rounded-lg px-4 py-2 shadow-md w-full text-center truncate">
              Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </div>
          )}
        </>
      ) : (
        <div className="w-full text-center p-4 bg-gray-800 rounded-lg">
          <div className="animate-pulse h-10 bg-gray-700 rounded w-3/4 mx-auto"></div>
        </div>
      )}
      
      {isClient && connected && (
        <div className="w-full">
          {/* Refund policy agreement checkbox */}
          <div className="mb-4 flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeToPolicy"
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
              className="mt-1 w-5 h-5" // Larger checkbox for better mobile tapping
            />
            <label htmlFor="agreeToPolicy" className="text-sm">
              I agree to the{" "}
              <button
                type="button"
                onClick={showRefundPolicy}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                refund policy
              </button>
              {" "}and understand that NFT sales are final.
            </label>
          </div>
          
          <button
            onClick={handlePurchase}
            disabled={!agreedToPolicy}
            className={`w-full mint-button inline-flex items-center justify-center ${
              !agreedToPolicy ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Mint Now ({mintPrice})
            <span className="ml-3">
              <Image src="/logo2.png" alt="SOLARA Logo" width={32} height={32} priority />
            </span>
          </button>
        </div>
      )}
      
      {isClient && !connected && (
        <div className="text-red-500 font-mono text-sm md:text-base text-center w-full p-4 bg-red-900/20 rounded-lg">
          Wallet not connected. Please connect a wallet to mint.
        </div>
      )}
    </div>
  );
}