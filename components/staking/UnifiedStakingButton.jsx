/**
 * UnifiedStakingButton.jsx
 * 통합 NFT 스테이킹 버튼 컴포넌트
 * 
 * - vec<pubkey> 타입 오류와 IllegalOwner 오류가 수정된 통합 솔루션
 * - 사용자에게 단일 스테이킹 흐름만 제공하여 혼란 방지
 * - 계정 초기화 자동 처리 및 최소한의 사용자 상호작용
 */
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { GlassButton } from "../Buttons";

/**
 * 통합된 NFT 스테이킹 버튼 컴포넌트
 * vec<pubkey> 및 IllegalOwner 오류가 모두 수정된 최신 구현
 */
const UnifiedStakingButton = ({ 
  nft, 
  stakingPeriod, 
  onSuccess, 
  onError,
  disabled = false,
  onStartLoading,
  onEndLoading,
  className = ""
}) => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [status, setStatus] = useState("idle"); // idle, preparing, processing, signing, submitting, confirming, success, error
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [txResults, setTxResults] = useState({
    setup: null,
    stake: null
  });
  
  // 로딩 효과 처리
  useEffect(() => {
    if (status === "idle" || status === "success" || status === "error") {
      if (onEndLoading) onEndLoading();
    } else {
      if (onStartLoading) onStartLoading();
    }
  }, [status, onStartLoading, onEndLoading]);
  
  // 진행률 업데이트
  useEffect(() => {
    if (status === "preparing") setProgress(10);
    else if (status === "processing") setProgress(30);
    else if (status === "signing") setProgress(50);
    else if (status === "submitting") setProgress(70);
    else if (status === "confirming") setProgress(90);
    else if (status === "success") setProgress(100);
  }, [status]);
  
  // 트랜잭션 서명 및 제출 처리
  const processTransaction = async (phase, txBase64, description, nextStatus, skipWhenNull = true) => {
    if (!txBase64 && skipWhenNull) {
      console.log(`${phase} 트랜잭션이 필요 없음, 건너뜀`);
      return { success: true, signature: null, skipped: true };
    }
    
    try {
      console.log(`${phase} 트랜잭션 처리 중: ${description}`);
      // 트랜잭션 역직렬화 및 서명
      const txBuffer = Buffer.from(txBase64, "base64");
      const transaction = Transaction.from(txBuffer);

      setStatus("signing");

      // 참고: escrow_nft_account는 PDA(Program Derived Address)로서
      // 이전에는 서명자로 요구되었지만 온체인 프로그램 업데이트 후에는 더 이상 서명자로 표시되지 않습니다.
      // 사용자는 자신의 지갑으로만 서명하고, 나머지는 블록체인에서 처리됩니다.
      // IDL이 업데이트되어 이제 이 계정이 서명자가 아닌 것으로 올바르게 표시됩니다.
      const signedTx = await signTransaction(transaction);

      // 서명된 트랜잭션 직렬화
      const serializedTx = Buffer.from(signedTx.serialize()).toString("base64");
      
      // 트랜잭션 제출
      setStatus("submitting");
      const response = await fetch("/api/staking/submitTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: serializedTx,
          type: `staking_${phase}`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `${phase} 트랜잭션 제출 실패`);
      }
      
      const data = await response.json();
      
      // 블록체인 상태 업데이트 대기
      setStatus("confirming");
      const waitTime = phase === "setup" ? 2000 : 2000;
      console.log(`${phase} 트랜잭션 확인 대기 중... (${waitTime}ms)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // 상태 업데이트
      setStatus(nextStatus);
      
      return { 
        success: true, 
        signature: data.data?.signature || "unknown",
        skipped: false
      };
    } catch (err) {
      console.error(`${phase} 트랜잭션 오류:`, err);
      setError(`${description}: ${err.message}`);
      setStatus("error");
      return { success: false, error: err };
    }
  };
  
  // 스테이킹 프로세스 실행
  const handleStake = async () => {
    if (!connected || !publicKey || !nft || !nft.mint) {
      setError("지갑 연결 또는 NFT 정보가 없습니다");
      return;
    }
    
    try {
      // 상태 및 에러 초기화
      setStatus("preparing");
      setError(null);
      setProgress(0);
      setTxResults({
        setup: null,
        stake: null
      });
      
      // API 요청을 통해 스테이킹 준비
      const tierAttr = nft.attributes?.find(attr => attr.trait_type?.toLowerCase() === "tier");
      console.log("NFT 티어 정보:", tierAttr);
      
      console.log("향상된 스테이킹 준비 API 요청...");
      // 향상된 스테이킹 API 엔드포인트 사용
      const prepareResponse = await fetch("/api/staking/enhanced-staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint,
          stakingPeriod: stakingPeriod,
          nftTier: tierAttr?.value,
          nftName: nft.name || nft.metadata?.name,
          autoCompound: false
        })
      });
      
      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.message || "스테이킹 준비 중 오류가 발생했습니다");
      }
      
      const prepareData = await prepareResponse.json();
      
      if (!prepareData.success) {
        throw new Error(prepareData.message || "스테이킹 준비 실패");
      }
      
      console.log("스테이킹 준비 데이터:", prepareData.data);
      
      const { 
        transactions, 
        requiredPhases,
        accountInitialization,
        accounts
      } = prepareData.data;
      
      setStatus("processing");
      
      // 모든 계정이 이미 초기화되어 있는지 확인
      if (accountInitialization.allReady) {
        console.log("모든 계정이 이미 초기화되어 있습니다. 스테이킹 단계로 직접 진행합니다.");
        setStatus("signing");
      } else {
        // 1. 계정 초기화 트랜잭션 처리
        if (requiredPhases.phase1) {
          const setupResult = await processTransaction(
            "setup",
            transactions.phase1,
            "계정 초기화",
            "signing" // 바로 서명 단계로 진행
          );
          
          setTxResults(prev => ({ ...prev, setup: setupResult }));
          
          if (!setupResult.success) {
            return; // 실패 시 중단
          }
        } else {
          console.log("계정 초기화가 필요 없음, 스테이킹으로 진행");
          setStatus("signing");
        }
      }
      
      // 2. 스테이킹 트랜잭션 처리
      const stakeResult = await processTransaction(
        "stake",
        transactions.phase3,
        "NFT 스테이킹",
        "success",
        false // 이 단계는 항상 실행되어야 함
      );
      
      setTxResults(prev => ({ ...prev, stake: stakeResult }));
      
      if (!stakeResult.success) {
        return; // 실패 시 중단
      }
      
      // 3. 성공 처리
      setStatus("success");
      
      // 4. 스테이킹 완료 기록
      try {
        console.log("스테이킹 완료 기록 중...");
        const completeResponse = await fetch("/api/staking/completeStaking-unified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature: stakeResult.signature,
            mintAddress: nft.mint,
            stakingPeriod: stakingPeriod,
            walletAddress: publicKey.toString(),
            accounts: accounts,
            autoCompound: false
          })
        });
        
        if (!completeResponse.ok) {
          console.warn("스테이킹 완료 기록 중 오류가 발생했지만, 블록체인 트랜잭션은 성공했습니다.");
        }
      } catch (completeError) {
        console.warn("스테이킹 완료 기록 중 오류:", completeError);
      }
      
      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess({
          signature: stakeResult.signature,
          nft: nft,
          stakingPeriod: stakingPeriod,
          accounts: accounts,
          estimatedRewards: prepareData.data.rewardDetails,
          transactionResults: {
            setup: txResults.setup,
            stake: stakeResult
          }
        });
      }
      
    } catch (err) {
      console.error("스테이킹 오류:", err);
      setStatus("error");
      setError(err.message || "Unknown error during staking");
      
      // 오류 메시지 개선
      let enhancedErrorMessage = err.message;
      
      // MaxNftsExceeded 오류 특별 처리
      if (err.message.includes("MaxNftsExceeded") || err.message.includes("maximum")) {
        enhancedErrorMessage = "최대 NFT 스테이킹 한도에 도달했습니다. 다른 NFT를 스테이킹하기 전에 하나를 언스테이킹하세요.";
      }
      // 계정 역직렬화 오류 특별 처리
      else if (err.message.includes("deserialize") || err.message.includes("AccountDidNotDeserialize")) {
        enhancedErrorMessage = "계정 구조 문제가 발생했습니다. 비상 언스테이킹을 시도해보세요.";
      }
      
      // 에러 콜백 호출
      if (onError) {
        onError({
          message: enhancedErrorMessage,
          originalError: err
        });
      }
    }
  };
  
  // 스테이킹 취소 또는 재시도
  const handleCancel = () => {
    setStatus("idle");
    setError(null);
    setProgress(0);
    setTxResults({
      setup: null,
      stake: null
    });
  };
  
  // 로딩 상태 UI 처리
  const renderLoadingState = () => {
    if (status === "idle" || status === "success") return null;
    
    return (
      <div className="mt-4">
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="mt-2 text-sm text-gray-300">
          {status === "preparing" && "스테이킹 준비 중..."}
          {status === "processing" && "계정 초기화 처리 중..."}
          {status === "signing" && "트랜잭션 서명 중..."}
          {status === "submitting" && "트랜잭션 제출 중..."}
          {status === "confirming" && "블록체인 확인 중..."}
          {status === "error" && "오류 발생"}
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-400">
            오류: {error}
          </div>
        )}
      </div>
    );
  };
  
  // 트랜잭션 결과 정보 표시
  const renderTransactionResults = () => {
    if (status !== "success") return null;
    
    return (
      <div className="mt-3 text-xs text-gray-400">
        <div className="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>NFT를 성공적으로 스테이킹했습니다!</span>
        </div>
        
        <div className="text-xxs text-gray-500 space-y-1">
          {txResults.setup && !txResults.setup.skipped && (
            <div>계정 초기화: {txResults.setup.signature?.slice(0, 8)}...</div>
          )}
          {txResults.stake && (
            <div>스테이킹 트랜잭션: {txResults.stake.signature?.slice(0, 8)}...</div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full">
      <GlassButton
        onClick={handleStake}
        disabled={disabled || !connected || !publicKey || status !== "idle" && status !== "error"}
        className={`w-full py-3 ${className}`}
      >
        {status === "success" ? "스테이킹 완료!" : "NFT 스테이킹"}
      </GlassButton>
      
      {renderLoadingState()}
      {renderTransactionResults()}
      
      {status === "error" && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={handleCancel}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedStakingButton;