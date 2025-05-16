/**
 * Emergency Unstake Result Modal
 * 
 * Result modal component for emergency unstaking
 * Shows the unstaking result and detailed information to the user
 */

import React from 'react';

/**
 * Emergency unstaking result modal component
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Modal display status
 * @param {Function} props.onClose - Callback function called on close button click
 * @param {Object} props.result - Unstaking result information
 * @param {string} props.signature - Transaction signature
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
          <h3>Unstaking Complete</h3>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        <div style={successBlockStyle}>
          <h4 style={{ color: '#2ecc71', marginTop: 0 }}>Successfully Unstaked!</h4>
          <p>Your NFT has been returned to your wallet.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Staking Completion:</span>
            <span>{completionPercentage}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Penalty Rate:</span>
            <span>{result.unstaking?.fee?.percent?.toFixed(2) || 0}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Penalty Amount:</span>
            <span>{formattedPenalty} Tokens</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Final Rewards:</span>
            <span style={{ fontWeight: 'bold' }}>{formattedRewards} Tokens</span>
          </div>
        </div>

        <div style={infoBlockStyle}>
          <h4 style={{ marginTop: 0 }}>Transaction Information</h4>
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

        <button style={buttonStyle} onClick={onClose}>Confirm</button>
      </div>
    </div>
  );
};