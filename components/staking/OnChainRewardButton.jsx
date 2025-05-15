import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import styles from '../../styles/wallet.css';
import { apiClient } from '../../utils/apiClient';

/**
 * 온체인 리워드 청구 버튼 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 프로퍼티
 * @param {string} props.mintAddress - NFT 민트 주소
 * @param {function} props.onSuccess - 성공 시 콜백 함수
 * @param {function} props.onError - 오류 발생 시 콜백 함수
 * @param {Object} props.rewardInfo - 사전 계산된 리워드 정보 (옵션)
 */
export default function OnChainRewardButton({ 
  mintAddress, 
  onSuccess, 
  onError,
  rewardInfo: initialRewardInfo
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(initialRewardInfo || null);
  const [claimable, setClaimable] = useState(false);
  const [error, setError] = useState(null);
  
  // 리워드 정보 로드
  const loadRewardInfo = useCallback(async () => {
    if (!publicKey || !mintAddress) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiClient.post('/api/staking/on-chain-rewards', {
        action: 'calculateRewards',
        wallet: publicKey.toString(),
        mintAddress
      });
      
      if (result.success) {
        setRewardInfo(result);
        setClaimable(result.canClaim && result.rewards > 0);
      } else {
        setError(result.error || '리워드 정보를 로드할 수 없습니다');
        setClaimable(false);
      }
    } catch (err) {
      console.error('리워드 정보 로드 오류:', err);
      setError('리워드 정보를 로드할 수 없습니다');
      setClaimable(false);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, mintAddress]);
  
  useEffect(() => {
    if (!initialRewardInfo) {
      loadRewardInfo();
    } else {
      setRewardInfo(initialRewardInfo);
      setClaimable(initialRewardInfo.canClaim && initialRewardInfo.rewards > 0);
    }
  }, [initialRewardInfo, loadRewardInfo]);
  
  // 리워드 토큰 계정 생성 처리
  const createTokenAccount = useCallback(async (rewardMint) => {
    if (!publicKey || !rewardMint) return null;
    
    try {
      const ata = await getAssociatedTokenAddress(
        rewardMint,
        publicKey
      );
      
      const ix = createAssociatedTokenAccountInstruction(
        publicKey,
        ata,
        publicKey,
        rewardMint
      );
      
      const transaction = new Transaction().add(ix);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      return ata;
    } catch (err) {
      console.error('토큰 계정 생성 오류:', err);
      throw err;
    }
  }, [publicKey, connection, sendTransaction]);
  
  // 리워드 청구 처리
  const handleClaimRewards = async () => {
    if (!publicKey || !mintAddress || !claimable) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 리워드 청구 트랜잭션 준비
      const prepareResult = await apiClient.post('/api/staking/on-chain-rewards', {
        action: 'prepareClaimRewards',
        wallet: publicKey.toString(),
        mintAddress
      });
      
      // 토큰 계정이 없는 경우 먼저 생성
      if (prepareResult.needsTokenAccount) {
        await createTokenAccount(prepareResult.rewardMint);
        
        // 토큰 계정 생성 후 다시 시도
        const retryResult = await apiClient.post('/api/staking/on-chain-rewards', {
          action: 'prepareClaimRewards',
          wallet: publicKey.toString(),
          mintAddress
        });
        
        if (!retryResult.success) {
          throw new Error(retryResult.error || '리워드 청구 준비 실패');
        }
        
        // 트랜잭션 실행
        await executeTransaction(retryResult.transaction);
      } else if (prepareResult.success) {
        // 트랜잭션 실행
        await executeTransaction(prepareResult.transaction);
      } else {
        throw new Error(prepareResult.error || '리워드 청구 준비 실패');
      }
      
      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }
      
      // 리워드 정보 새로고침
      await loadRewardInfo();
    } catch (err) {
      console.error('리워드 청구 오류:', err);
      setError(err.message || '리워드 청구 중 오류가 발생했습니다');
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 트랜잭션 실행 함수
  const executeTransaction = async (serializedTx) => {
    try {
      // 트랜잭션 디코딩 및 서명
      const transaction = Transaction.from(Buffer.from(serializedTx, 'base64'));
      transaction.feePayer = publicKey;
      
      // 트랜잭션 서명 및 전송
      const signature = await sendTransaction(transaction, connection);
      
      // 트랜잭션 확인
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`트랜잭션 확인 오류: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log('리워드 청구 성공:', signature);
      return signature;
    } catch (err) {
      console.error('트랜잭션 실행 오류:', err);
      throw err;
    }
  };
  
  // 지갑 연결이 필요한 경우
  if (!publicKey) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-sm mb-2">리워드를 받으려면 지갑을 연결하세요</p>
        <WalletMultiButton />
      </div>
    );
  }
  
  // 리워드 정보 로딩 중
  if (isLoading && !rewardInfo) {
    return (
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded opacity-70 cursor-not-allowed"
        disabled
      >
        리워드 정보 로딩 중...
      </button>
    );
  }
  
  // 리워드 정보 오류
  if (error && !rewardInfo) {
    return (
      <button
        className="bg-red-500 text-white py-2 px-4 rounded"
        onClick={loadRewardInfo}
      >
        다시 시도
      </button>
    );
  }
  
  // 클레임 가능한 리워드가 없는 경우
  if (!claimable && rewardInfo) {
    const rewards = rewardInfo.rewards || 0;
    const daysElapsed = rewardInfo.daysElapsed || 0;
    const isAutoCompound = rewardInfo.isAutoCompound;
    
    // 자동 복리가 활성화된 경우
    if (isAutoCompound) {
      return (
        <div className="flex flex-col items-center">
          <p className="text-sm mb-2">자동 복리 활성화됨: {rewards.toLocaleString()} 토큰 누적 중</p>
          <button
            className="bg-gray-500 text-white py-2 px-4 rounded opacity-70 cursor-not-allowed"
            disabled
          >
            자동 복리 활성화됨
          </button>
        </div>
      );
    }
    
    // 하루가 지나지 않은 경우
    if (daysElapsed === 0) {
      const timeRemaining = rewardInfo.timeRemaining || 0;
      const hours = Math.floor(timeRemaining / 3600);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      
      return (
        <div className="flex flex-col items-center">
          <p className="text-sm mb-2">다음 클레임까지: {hours}시간 {minutes}분</p>
          <button
            className="bg-gray-500 text-white py-2 px-4 rounded opacity-70 cursor-not-allowed"
            disabled
          >
            리워드 청구 불가
          </button>
        </div>
      );
    }
    
    // 클레임할 리워드가 없는 경우
    return (
      <button
        className="bg-gray-500 text-white py-2 px-4 rounded opacity-70 cursor-not-allowed"
        disabled
      >
        클레임할 리워드 없음
      </button>
    );
  }
  
  // 리워드 청구 버튼
  return (
    <button
      className={`${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded transition-colors`}
      onClick={handleClaimRewards}
      disabled={isLoading || !claimable}
    >
      {isLoading ? '처리 중...' : `${rewardInfo.rewards.toLocaleString()} 리워드 청구`}
    </button>
  );
}