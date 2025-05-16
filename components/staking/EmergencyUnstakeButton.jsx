/**
 * Emergency Unstake Button Component
 * 
 * Button component for emergency unstaking functionality
 * Used for unstaking NFTs urgently before the staking period ends
 */

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

import ErrorMessage from '../ErrorMessage';
import { EmergencyUnstakeConfirmationModal } from './EmergencyUnstakeConfirmationModal';
import { debugLog, debugError } from '../../utils/debugUtils';

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
 * Emergency unstaking button component
 * 
 * @param {Object} props - Component properties
 * @param {string} props.nftMint - NFT mint address
 * @param {Object} props.stakeInfo - Staking information object
 * @param {Function} props.onSuccess - Callback function called on successful unstaking
 * @param {boolean} props.disabled - Button disabled status
 */
export const EmergencyUnstakeButton = ({ nftMint, stakeInfo, onSuccess, disabled = false }) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [penaltyInfo, setPenaltyInfo] = useState(null);

  /**
   * Prepare emergency unstaking transaction
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
        throw new Error(data.error || 'Error preparing emergency unstaking.');
      }

      // API 응답 구조 검증
      if (!data.data) {
        debugError('EmergencyUnstakeButton', 'API response data format error:', data);
        throw new Error('Invalid server response format. Please contact administrator.');
      }

      // 페널티 정보 검증
      if (!data.data.emergencyFee || !data.data.rewards) {
        debugError('EmergencyUnstakeButton', 'Missing penalty or reward information:', data.data);
        throw new Error('페널티 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
      }

      // 페널티 정보 설정
      setPenaltyInfo({
        percent: data.data.emergencyFee.percent || 0,
        description: data.data.emergencyFee.description || '조기 언스테이킹으로 인한 패널티가 적용됩니다.',
        rewards: data.data.rewards || { amount: 0, completionRatio: 0 },
      });

      // 확인 모달 표시
      setShowConfirmationModal(true);
      
      return data.data;
    } catch (err) {
      debugError('EmergencyUnstakeButton', 'Emergency unstaking preparation error:', err);
      setError(err.message || 'Error occurred while preparing emergency unstaking.');
      toast.error('비상 언스테이킹 준비 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute emergency unstaking
   */
  const executeEmergencyUnstaking = async () => {
    if (!publicKey || !nftMint) return;
    setLoading(true);
    setError(null);

    try {
      // 트랜잭션 데이터 가져오기
      const txData = await prepareEmergencyUnstaking();
      
      // 트랜잭션 데이터가 없거나 트랜잭션 필드가 없는 경우 처리
      if (!txData) {
        throw new Error('트랜잭션 데이터를 가져오지 못했습니다.');
      }
      
      if (!txData.transaction || !txData.transaction.data) {
        debugError('EmergencyUnstakeButton', '트랜잭션 객체 없음:', txData);
        throw new Error('유효한 트랜잭션 데이터가 없습니다.');
      }

      // 트랜잭션 객체 생성
      let transaction;
      try {
        transaction = Transaction.from(Buffer.from(txData.transaction.data));
      } catch (txError) {
        debugError('EmergencyUnstakeButton', 'Transaction object creation error:', txError);
        throw new Error('트랜잭션 데이터가 유효하지 않습니다.');
      }
      
      // 트랜잭션 서명
      const signedTransaction = await signTransaction(transaction);
      
      // 트랜잭션 전송
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      debugLog('EmergencyUnstakeButton', '언스테이킹 트랜잭션 전송됨:', signature);
      
      // 트랜잭션 확인
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      // Check for errors during confirmation
      if (confirmation.value && confirmation.value.err) {
        debugError('EmergencyUnstakeButton', 'Transaction confirmation error:', confirmation.value.err);
        throw new Error('Error occurred during transaction confirmation.');
      }

      // 트랜잭션 완료 API 호출
      debugLog('EmergencyUnstakeButton', 'completeEmergencyUnstaking API 호출 중...');
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

      // API 응답 파싱
      let completeData;
      try {
        completeData = await completeResponse.json();
      } catch (jsonError) {
        debugError('EmergencyUnstakeButton', 'API response parsing error:', jsonError);
        throw new Error('완료 API 응답을 파싱할 수 없습니다.');
      }

      // Handle API error response
      if (!completeResponse.ok) {
        debugError('EmergencyUnstakeButton', 'Completion API error response:', completeData);
        // 온체인 트랜잭션은 성공했으므로 UI에서 성공으로 처리
        debugLog('EmergencyUnstakeButton', 'On-chain transaction succeeded but completion API encountered error. Transaction ID:', signature);
        toast.warn('온체인 트랜잭션은 성공했지만 데이터베이스 업데이트 중 문제가 발생했습니다.');
      } else {
        // 성공 메시지 표시
        toast.success('NFT가 성공적으로 언스테이킹되었습니다.');
      }
      
      // 모달 닫기
      setShowConfirmationModal(false);
      
      // 성공 콜백 호출
      if (onSuccess) {
        // API 응답이 실패해도 UI에서는 성공으로 처리
        const result = completeData && completeData.data ? completeData.data : { status: 'unstaked', txid: signature };
        onSuccess(signature, result);
      }

    } catch (err) {
      debugError('EmergencyUnstakeButton', 'Emergency unstaking execution error:', err);
      setError(err.message || 'Error occurred during emergency unstaking execution.');
      toast.error('비상 언스테이킹 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Emergency unstaking button click handler
   */
  const handleClick = async () => {
    await prepareEmergencyUnstaking();
  };

  /**
   * Modal confirm handler
   */
  const handleConfirm = async () => {
    await executeEmergencyUnstaking();
  };

  /**
   * Modal close handler
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
        {loading ? 'Processing...' : 'Emergency Unstake'}
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