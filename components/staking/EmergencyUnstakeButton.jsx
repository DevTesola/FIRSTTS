/**
 * Emergency Unstake Button Component
 * 
 * 비상 언스테이킹 기능을 위한 버튼 컴포넌트
 * 스테이킹 기간이 끝나기 전에 NFT를 긴급하게 언스테이킹할 때 사용
 */

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

import ErrorMessage from '../ErrorMessage';
import { EmergencyUnstakeConfirmationModal } from './EmergencyUnstakeConfirmationModal';

// 스타일링
const buttonStyle = {
  backgroundColor: '#ff4d4d',
  color: 'white',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontSize: '0.9rem',
};

const buttonHoverStyle = {
  backgroundColor: '#ff3333',
  transform: 'translateY(-2px)',
};

/**
 * 비상 언스테이킹 버튼 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {string} props.nftMint - NFT 민트 주소
 * @param {Object} props.stakeInfo - 스테이킹 정보 객체
 * @param {Function} props.onSuccess - 언스테이킹 성공 시 호출되는 콜백 함수
 * @param {boolean} props.disabled - 버튼 비활성화 여부
 */
export const EmergencyUnstakeButton = ({ nftMint, stakeInfo, onSuccess, disabled = false }) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [penaltyInfo, setPenaltyInfo] = useState(null);

  /**
   * 비상 언스테이킹 트랜잭션 준비
   */
  const prepareEmergencyUnstaking = async () => {
    if (!publicKey || !nftMint) return;
    setLoading(true);
    setError(null);

    try {
      // API 호출하여 트랜잭션 데이터 가져오기
      const response = await fetch('/api/staking/prepareEmergencyUnstaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nftMint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '비상 언스테이킹 준비 중 오류가 발생했습니다.');
      }

      // 페널티 정보 설정
      setPenaltyInfo({
        percent: data.data.emergencyFee.percent,
        description: data.data.emergencyFee.description,
        rewards: data.data.rewards,
      });

      // 확인 모달 표시
      setShowConfirmationModal(true);
      
      return data.data;
    } catch (err) {
      console.error('비상 언스테이킹 준비 오류:', err);
      setError(err.message || '비상 언스테이킹을 준비하는 동안 오류가 발생했습니다.');
      toast.error('비상 언스테이킹 준비 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 비상 언스테이킹 실행
   */
  const executeEmergencyUnstaking = async () => {
    if (!publicKey || !nftMint) return;
    setLoading(true);
    setError(null);

    try {
      // 트랜잭션 데이터 가져오기
      const txData = await prepareEmergencyUnstaking();
      if (!txData) return;

      // 트랜잭션 객체 생성
      const transaction = Transaction.from(Buffer.from(txData.transaction.data));
      
      // 트랜잭션 서명
      const signedTransaction = await signTransaction(transaction);
      
      // 트랜잭션 전송
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // 트랜잭션 확인
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('트랜잭션 확인 중 오류가 발생했습니다.');
      }

      // 트랜잭션 완료 API 호출
      const completeResponse = await fetch('/api/staking/completeEmergencyUnstaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          wallet: publicKey.toString(),
          mintAddress: nftMint,
        }),
      });

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(completeData.error || '비상 언스테이킹 완료 중 오류가 발생했습니다.');
      }

      // 성공 메시지 표시
      toast.success('NFT가 성공적으로 언스테이킹되었습니다.');
      
      // 모달 닫기
      setShowConfirmationModal(false);
      
      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess(signature, completeData.data);
      }

    } catch (err) {
      console.error('비상 언스테이킹 실행 오류:', err);
      setError(err.message || '비상 언스테이킹 실행 중 오류가 발생했습니다.');
      toast.error('비상 언스테이킹 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 비상 언스테이킹 버튼 클릭 핸들러
   */
  const handleClick = async () => {
    await prepareEmergencyUnstaking();
  };

  /**
   * 모달 확인 핸들러
   */
  const handleConfirm = async () => {
    await executeEmergencyUnstaking();
  };

  /**
   * 모달 닫기 핸들러
   */
  const handleCancel = () => {
    setShowConfirmationModal(false);
  };

  return (
    <>
      <button
        style={buttonStyle}
        className="emergency-unstake-button hover:bg-red-600"
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {loading ? '처리 중...' : '긴급 언스테이킹'}
      </button>

      {error && <ErrorMessage message={error} />}

      {showConfirmationModal && penaltyInfo && (
        <EmergencyUnstakeConfirmationModal
          isOpen={showConfirmationModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          penaltyInfo={penaltyInfo}
          loading={loading}
        />
      )}
    </>
  );
};