/**
 * Emergency Unstake Confirmation Modal
 * 
 * 비상 언스테이킹 확인 모달 컴포넌트
 * 사용자에게 페널티 및 보상 정보를 보여주고 확인을 요청함
 */

import React from 'react';

/**
 * 비상 언스테이킹 확인 모달 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onConfirm - 확인 버튼 클릭 시 호출되는 콜백 함수
 * @param {Function} props.onCancel - 취소 버튼 클릭 시 호출되는 콜백 함수
 * @param {Object} props.penaltyInfo - 페널티 및 보상 정보
 * @param {boolean} props.loading - 로딩 상태
 */
export const EmergencyUnstakeConfirmationModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  penaltyInfo, 
  loading 
}) => {
  if (!isOpen) return null;

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const modalContentStyle = {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '480px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    color: 'white',
    position: 'relative',
  };

  const modalHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '12px',
  };

  const closeButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
  };

  const confirmButtonStyle = {
    backgroundColor: '#ff4d4d',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    marginRight: '12px',
  };

  const cancelButtonStyle = {
    backgroundColor: 'transparent',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
  };

  const warningStyle = {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderLeft: '4px solid #ff4d4d',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '4px',
  };

  const infoStyle = {
    backgroundColor: 'rgba(77, 155, 255, 0.1)',
    borderLeft: '4px solid #4d9bff',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '4px',
  };

  // 스테이킹 완료율 계산 (0-100%)
  const completionPercentage = Math.round(penaltyInfo.rewards.completionRatio * 100);

  // 보상 금액 (천 단위 구분기호 포함)
  const formattedRewards = penaltyInfo.rewards.amount.toLocaleString();

  return (
    <div style={modalOverlayStyle} onClick={onCancel}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3>긴급 언스테이킹 확인</h3>
          <button style={closeButtonStyle} onClick={onCancel}>×</button>
        </div>

        <div style={warningStyle}>
          <h4 style={{ color: '#ff4d4d', marginTop: 0 }}>주의: 조기 언스테이킹 페널티</h4>
          <p>스테이킹 기간이 완료되기 전에 NFT를 언스테이킹하면 보상에 페널티가 적용됩니다.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>페널티 요율:</span>
            <span style={{ fontWeight: 'bold', color: '#ff4d4d' }}>{penaltyInfo.percent.toFixed(2)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>스테이킹 완료율:</span>
            <span>{completionPercentage}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>받을 수 있는 보상:</span>
            <span>{formattedRewards} 토큰</span>
          </div>
        </div>

        <div style={infoStyle}>
          <p><strong>참고:</strong> 페널티는 스테이킹 기간이 얼마나 남았는지에 따라 계산됩니다. 스테이킹 기간이 많이 남아있을수록 페널티가 높아집니다.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button 
            style={cancelButtonStyle} 
            onClick={onCancel} 
            disabled={loading}
          >
            취소
          </button>
          <button 
            style={confirmButtonStyle} 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? '처리 중...' : '언스테이킹 진행'}
          </button>
        </div>
      </div>
    </div>
  );
};