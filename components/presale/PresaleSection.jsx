"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Transaction } from "@solana/web3.js";
import Image from "next/image";
import ErrorMessage from "./ErrorMessage";
import WalletGuide from "./WalletGuide";
import { useAnalytics } from "./AnalyticsProvider";

// 환경 변수와 기본값
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
const MINT_PRICE = process.env.NEXT_PUBLIC_MINT_PRICE || "1.5 SOL";

/**
 * 개선된 민팅 섹션 컴포넌트
 * 향상된 사용자 경험 및 오류 처리
 */
export default function MintSection({ 
  mintPrice = MINT_PRICE, 
  onMintComplete, 
  isClient = false,
  setErrorMessage,
  setErrorDetails,
  setLoading,
  showRefundPolicy,
  mintAttempts = 0
}) {
  const { publicKey, connected, signTransaction } = useWallet() || {};
  const { trackEvent } = useAnalytics();
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [solBalance, setSolBalance] = useState(null);
  const [hasSufficientFunds, setHasSufficientFunds] = useState(true);

  // 사용자의 SOL 잔액 조회
  const checkBalance = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    try {
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      const balance = await connection.getBalance(publicKey);
      
      // lamports를 SOL로 변환 (1 SOL = 10^9 lamports)
      const balanceInSol = balance / 1_000_000_000;
      setSolBalance(balanceInSol);
      
      // 민팅 가격 (문자열에서 숫자로 변환)
      const mintPriceValue = parseFloat(mintPrice.replace(' SOL', ''));
      
      // 민팅에 충분한 SOL이 있는지 확인 (거래 수수료 0.01 SOL 추가)
      setHasSufficientFunds(balanceInSol >= (mintPriceValue + 0.01));
    } catch (err) {
      console.error('Error checking balance:', err);
      // 오류가 발생해도 민팅은 허용 (실제 트랜잭션에서 다시 확인됨)
      setHasSufficientFunds(true);
    }
  }, [publicKey, connected, mintPrice]);
  
  // 지갑 연결 시 잔액 확인
  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
      
      // 10초마다 잔액 업데이트
      const interval = setInterval(checkBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, checkBalance]);
  
  // 민팅 시도 횟수가 변경되면 UI 상태 리셋
  useEffect(() => {
    if (mintAttempts > 0) {
      setAgreedToPolicy(false);
      setTransactionPending(false);
    }
  }, [mintAttempts]);

  // 민팅 처리 함수
  const handlePurchase = async () => {
    // 애널리틱스 이벤트 - 민팅 시작
    trackEvent('mint_started', { wallet: publicKey?.toString()?.slice(0, 8) });
    
    try {
      setLoading(true);
      setTransactionPending(true);
      setErrorMessage(null);
      setErrorDetails(null);
      
      if (!connected || !publicKey) {
        throw new Error("Please connect a wallet");
      }
      
      // 잔액 다시 확인
      await checkBalance();
      if (!hasSufficientFunds && solBalance !== null) {
        throw new Error(`Insufficient funds. You need at least ${mintPrice} plus transaction fees. Current balance: ${solBalance.toFixed(4)} SOL`);
      }

      // 1단계: NFT 구매 준비 - NFT 예약 및 결제 트랜잭션 생성
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
      console.log("Received transaction data:", { mint, filename, mintIndex, lockId });
      
      // 애널리틱스 이벤트 - 트랜잭션 생성됨
      trackEvent('mint_transaction_created', { 
        mintIndex: mintIndex, 
        filename: filename 
      });

      // 2단계: 트랜잭션 크기 검증
      const txBuf = Buffer.from(transaction, "base64");
      if (txBuf.length > 1232) {
        throw new Error("Transaction size exceeds Solana limit (1232 bytes)");
      }

      // 3단계: 트랜잭션 서명 요청
      console.log("Signing transaction...");
      const tx = Transaction.from(txBuf);
      if (!tx.feePayer) tx.feePayer = publicKey;

      let signedTx;
      try {
        signedTx = await signTransaction(tx);
      } catch (signError) {
        // 애널리틱스 이벤트 - 서명 실패
        trackEvent('mint_signature_rejected', { error: signError.message });
        throw new Error('Transaction signing was cancelled or failed');
      }
      
      console.log("Transaction signed:", signedTx);
      
      // 애널리틱스 이벤트 - 트랜잭션 서명됨
      trackEvent('mint_transaction_signed');

      // 4단계: 서명된 트랜잭션 전송
      const rawTx = signedTx.serialize();
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      
      console.log("Sending transaction to blockchain...");
      const signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      // 애널리틱스 이벤트 - 트랜잭션 전송됨
      trackEvent('mint_transaction_sent', { signature: signature });

      // 5단계: 트랜잭션 확인 대기
      console.log("Waiting for transaction confirmation...");
      await connection.confirmTransaction(signature, 'confirmed');
      
      // 애널리틱스 이벤트 - 트랜잭션 확인됨
      trackEvent('mint_transaction_confirmed', { signature: signature });

      // 6단계: 민팅 완료 처리
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
      
      // 애널리틱스 이벤트 - 민팅 완료
      trackEvent('mint_completed', { 
        mintAddress: completeMintData.mintAddress,
        filename: filename
      });

      // 7단계: UI 업데이트 및 결과 표시
      if (onMintComplete) {
        try {
          // IPFS 게이트웨이로 메타데이터 가져오기
          const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
          const resourceCID = process.env.NEXT_PUBLIC_RESOURCE_CID || '';
          const metadataUrl = `${ipfsGateway}/ipfs/${resourceCID}/${filename}.json`;
          console.log("Loading metadata from:", metadataUrl);
          
          const metadataRes = await fetch(metadataUrl);
          if (!metadataRes.ok) {
            throw new Error(`Failed to load metadata from IPFS: ${metadataRes.status}`);
          }
          
          const metadata = await metadataRes.json();
          
          // 민트 주소가 메타데이터에 없으면 추가
          if (!metadata.mintAddress && completeMintData.mintAddress) {
            metadata.mintAddress = completeMintData.mintAddress;
          }
          
          // 결과 콜백 호출
          onMintComplete({ metadata, filename });
          
          // 애널리틱스 이벤트 - 메타데이터 로드 완료
          trackEvent('mint_metadata_loaded', { 
            filename: filename,
            tier: metadata.attributes?.find(a => a.trait_type === 'Tier')?.value || 'Unknown'
          });
        } catch (metadataErr) {
          console.error("Metadata loading error:", metadataErr);
          
          // 애널리틱스 이벤트 - 메타데이터 로드 실패
          trackEvent('mint_metadata_error', { error: metadataErr.message });
          
          // 메타데이터 로드 실패해도 민팅은 성공했으므로 기본 정보로 콜백
          onMintComplete({
            metadata: {
              name: `SOLARA #${filename}`,
              description: "A unique SOLARA NFT from the GEN:0 collection.",
              mintAddress: completeMintData.mintAddress
            },
            filename
          });
        }
      }
    } catch (err) {
      console.error("Minting error:", err);
      
      // 애널리틱스 이벤트 - 민팅 실패
      trackEvent('mint_failed', { error: err.message });
      
      // 사용자 친화적인 오류 메시지 생성
      let userMessage = "Minting failed. Please try again.";
      
      if (err.message.includes("wallet")) userMessage = "Wallet not connected.";
      else if (err.message.includes("No available NFT")) userMessage = "All NFTs are sold out.";
      else if (err.message.includes("metadata")) userMessage = "Failed to load NFT metadata. Please check IPFS connection and try again.";
      else if (err.message.includes("Invalid wallet")) userMessage = "Invalid wallet address.";
      else if (err.message.includes("buffer")) userMessage = "Invalid transaction data from server.";
      else if (err.message.includes("blockhash")) userMessage = "Invalid transaction configuration.";
      else if (err.message.includes("insufficient") || err.message.includes("Insufficient")) userMessage = "Insufficient funds in your wallet.";
      else if (err.message.includes("rejected")) userMessage = "Transaction rejected by wallet.";
      else if (err.message.includes("timeout")) userMessage = "Network timeout. Please try again.";
      
      setErrorMessage(userMessage);
      setErrorDetails(err.message || err.toString());
    } finally {
      setLoading(false);
      setTransactionPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-10 w-full max-w-sm mx-auto">
      {/* 지갑 연결 가이드 */}
      <WalletGuide />
      
      {isClient ? (
        <>
          <div className="wallet-button-container">
            <WalletMultiButton />
          </div>
          
          {connected && publicKey && (
            <div className="bg-gray-800 text-purple-300 font-mono text-sm md:text-base rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center justify-between">
                <span>Connected Wallet: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
                
                {solBalance !== null && (
                  <span className={`ml-2 font-bold ${hasSufficientFunds ? 'text-green-400' : 'text-red-400'}`}>
                    {solBalance.toFixed(4)} SOL
                  </span>
                )}
              </div>
              
              {/* 잔액 부족 경고 */}
              {!hasSufficientFunds && solBalance !== null && (
                <div className="mt-1 text-xs text-red-400">
                  Insufficient funds for minting. You need at least {mintPrice} plus fees.
                </div>
              )}
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
              onChange={(e) => {
                setAgreedToPolicy(e.target.checked);
                if (e.target.checked) {
                  // 애널리틱스 이벤트 - 환불 정책 동의
                  trackEvent('refund_policy_agreed');
                }
              }}
              className="mt-1"
            />
            <label htmlFor="agreeToPolicy" className="text-sm">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => {
                  showRefundPolicy();
                  // 애널리틱스 이벤트 - 환불 정책 조회
                  trackEvent('refund_policy_viewed');
                }}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                refund policy
              </button>
              {" "}and understand that NFT sales are final.
            </label>
          </div>
          
          <button
            onClick={handlePurchase}
            disabled={!agreedToPolicy || transactionPending || !hasSufficientFunds}
            className={`w-full mint-button inline-flex items-center justify-center ${
              !agreedToPolicy || transactionPending || !hasSufficientFunds ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Mint an NFT"
          >
            {transactionPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Mint Now ({mintPrice})
                <span className="ml-3">
                  <Image src="/logo2.png" alt="SOLARA Logo" width={32} height={32} priority />
                </span>
              </>
            )}
          </button>
          
          {/* 잔액 부족 경고 별도 표시 */}
          {!hasSufficientFunds && solBalance !== null && connected && (
            <div className="mt-2 text-xs text-center text-red-400">
              Please add more SOL to your wallet to mint.
            </div>
          )}
        </div>
      )}
      
      {isClient && !connected && (
        <div className="text-red-500 font-mono text-sm md:text-base">
          Wallet not connected. Please connect a wallet to mint.
        </div>
      )}
    </div>
  );
}