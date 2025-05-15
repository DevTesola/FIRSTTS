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

      // API 응답 구조 검증
      if (!data.data) {
        debugError('EmergencyUnstakeButton', 'API 응답 데이터 형식 오류:', data);
        throw new Error('서버 응답 형식이 올바르지 않습니다. 관리자에게 문의하세요.');
      }

      // 페널티 정보 검증
      if (!data.data.emergencyFee || !data.data.rewards) {
        debugError('EmergencyUnstakeButton', '페널티 또는 보상 정보가 없습니다:', data.data);
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
      debugError('EmergencyUnstakeButton', '비상 언스테이킹 준비 오류:', err);
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
        debugError('EmergencyUnstakeButton', '트랜잭션 객체 생성 오류:', txError);
        throw new Error('트랜잭션 데이터가 유효하지 않습니다.');
      }
      
      // 트랜잭션 서명
      const signedTransaction = await signTransaction(transaction);
      
      // 트랜잭션 전송
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      debugLog('EmergencyUnstakeButton', '언스테이킹 트랜잭션 전송됨:', signature);
      
      // 트랜잭션 확인
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      // 확인 중 오류 확인
      if (confirmation.value && confirmation.value.err) {
        debugError('EmergencyUnstakeButton', '트랜잭션 확인 오류:', confirmation.value.err);
        throw new Error('트랜잭션 확인 중 오류가 발생했습니다.');
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
        debugError('EmergencyUnstakeButton', 'API 응답 파싱 오류:', jsonError);
        throw new Error('완료 API 응답을 파싱할 수 없습니다.');
      }

      // API 오류 응답 처리
      if (!completeResponse.ok) {
        debugError('EmergencyUnstakeButton', '완료 API 오류 응답:', completeData);
        // 온체인 트랜잭션은 성공했으므로 UI에서 성공으로 처리
        debugLog('EmergencyUnstakeButton', '온체인 트랜잭션은 성공했지만 완료 API에서 오류가 발생했습니다. 트랜잭션 ID:', signature);
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
      debugError('EmergencyUnstakeButton', '비상 언스테이킹 실행 오류:', err);
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