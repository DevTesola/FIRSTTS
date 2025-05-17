/**
 * Emergency Unstake Confirmation Modal
 * 
 * Confirmation modal component for emergency unstaking
 * Shows penalty and reward information to the user and requests confirmation
 */

import React from 'react';

/**
 * Emergency unstaking confirmation modal component
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Modal display status
 * @param {Function} props.onConfirm - Callback function called on confirm button click
 * @param {Function} props.onCancel - Callback function called on cancel button click
 * @param {Object} props.penaltyInfo - Penalty and reward information
 * @param {boolean} props.loading - Loading status
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

  // Calculate staking completion rate (0-100%)
  const completionPercentage = penaltyInfo?.rewards?.completionRatio 
    ? Math.round(penaltyInfo.rewards.completionRatio * 100)
    : 0;

  // 보상 금액 (천 단위 구분기호 포함)
  const formattedRewards = penaltyInfo?.rewards?.amount 
    ? penaltyInfo.rewards.amount.toLocaleString()
    : "0";

  return (
    <div style={modalOverlayStyle} onClick={onCancel}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3>Emergency Unstaking Confirmation</h3>
          <button style={closeButtonStyle} onClick={onCancel}>×</button>
        </div>

        <div style={warningStyle}>
          <h4 style={{ color: '#ff4d4d', marginTop: 0 }}>Warning: Early Unstaking Penalty</h4>
          <p>If you unstake your NFT before the staking period is complete, a penalty will be applied to your rewards.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Penalty Rate:</span>
            <span style={{ fontWeight: 'bold', color: '#ff4d4d' }}>{penaltyInfo?.percent ? penaltyInfo.percent.toFixed(2) : "0.00"}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Staking Completion:</span>
            <span>{completionPercentage}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Available Rewards:</span>
            <span>{formattedRewards} Tokens</span>
          </div>
        </div>

        <div style={infoStyle}>
          <p><strong>Note:</strong> The penalty is calculated based on how much time is left in the staking period. The more time remaining, the higher the penalty.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button 
            style={cancelButtonStyle} 
            onClick={onCancel} 
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            style={confirmButtonStyle} 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed with Unstaking'}
          </button>
        </div>
      </div>
    </div>
  );
};