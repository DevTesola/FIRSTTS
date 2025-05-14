/**
 * Emergency Unstake Result Modal
 * 
 * 비상 언스테이킹 결과 모달 컴포넌트
 * 사용자에게 언스테이킹 결과와 상세 정보를 보여줌
 */

import React from 'react';

/**
 * 비상 언스테이킹 결과 모달 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onClose - 닫기 버튼 클릭 시 호출되는 콜백 함수
 * @param {Object} props.result - 언스테이킹 결과 정보
 * @param {string} props.signature - 트랜잭션 서명
 */
export const EmergencyUnstakeResultModal = ({ 
  isOpen, 
  onClose, 
  result, 
  signature 
}) => {
  if (!isOpen || !result) return null;

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

  const successBlockStyle = {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderLeft: '4px solid #2ecc71',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '4px',
  };

  const infoBlockStyle = {
    backgroundColor: 'rgba(77, 155, 255, 0.1)',
    borderLeft: '4px solid #4d9bff',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '4px',
  };

  const transactionLinkStyle = {
    color: '#4d9bff',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  };

  const buttonStyle = {
    backgroundColor: '#4d9bff',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    marginTop: '16px',
  };

  // 트랜잭션 조회를 위한 Solana Explorer URL
  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`;

  // 보상 금액 포맷팅 (천 단위 구분기호 포함)
  const formattedRewards = result.unstaking?.rewards?.final?.toLocaleString() || '0';

  // 페널티 금액 포맷팅
  const formattedPenalty = result.unstaking?.fee?.amount?.toLocaleString() || '0';

  // 스테이킹 완료율 계산 (0-100%)
  const completionPercentage = Math.round((result.unstaking?.completionRatio || 0) * 100);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3>언스테이킹 완료</h3>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        <div style={successBlockStyle}>
          <h4 style={{ color: '#2ecc71', marginTop: 0 }}>성공적으로 언스테이킹되었습니다!</h4>
          <p>NFT가 지갑으로 반환되었습니다.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>스테이킹 완료율:</span>
            <span>{completionPercentage}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>페널티 요율:</span>
            <span>{result.unstaking?.fee?.percent?.toFixed(2) || 0}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>페널티 금액:</span>
            <span>{formattedPenalty} 토큰</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>최종 보상:</span>
            <span style={{ fontWeight: 'bold' }}>{formattedRewards} 토큰</span>
          </div>
        </div>

        <div style={infoBlockStyle}>
          <h4 style={{ marginTop: 0 }}>트랜잭션 정보</h4>
          <a 
            href={explorerUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={transactionLinkStyle}
            title={signature}
          >
            {signature.slice(0, 16)}...{signature.slice(-16)}
          </a>
        </div>

        <button style={buttonStyle} onClick={onClose}>확인</button>
      </div>
    </div>
  );
};