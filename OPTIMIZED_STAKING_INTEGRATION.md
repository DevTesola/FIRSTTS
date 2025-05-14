# Optimized Staking Integration Guide

This document provides instructions for integrating the new optimized staking approach into your existing TESOLA NFT staking implementation.

## Overview

The new `OptimizedStakingButton` component provides a streamlined user experience for NFT staking with fewer required signatures and better error handling. This component integrates with the three-phase staking approach but optimizes the process for improved UX.

## Key Features

1. **Reduced User Friction**:
   - Maximum of two wallet signatures (instead of three)
   - Automatic account initialization checks
   - Smart transaction sequencing

2. **Enhanced Reliability**:
   - Proper account initialization before staking
   - Improved error handling and recovery
   - Clear, detailed feedback to users

3. **Improved Performance**:
   - Parallel account checks where possible
   - Optimized transaction sequencing
   - Better transaction status reporting

## Integration Steps

### 1. Add OptimizedStakingButton to StakingComponent

Update your `StakingComponent.jsx` to include the optimized staking button:

```jsx
import OptimizedStakingButton from './staking/OptimizedStakingButton';

// In your StakingComponent render method:
{!isStaked && (
  <div className="mb-6 animate-fadeIn">
    {/* Staking options UI... */}
    
    {/* Add the Optimized Staking Button */}
    <OptimizedStakingButton
      nft={nft}
      stakingPeriod={stakingPeriod}
      onSuccess={handleStakingSuccess}
      onError={handleStakingError}
      onStartLoading={() => setLoading(true)}
      onEndLoading={() => setLoading(false)}
      disabled={!verifiedOwnership || !isOnline}
      className="mb-2"
    />
    
    {/* Existing buttons can remain as fallback options */}
  </div>
)}
```

### 2. Add Success and Error Handlers

Implement the success and error handler functions:

```jsx
const handleStakingSuccess = (result) => {
  console.log("Staking successful:", result);
  
  // Update UI state
  setIsStaked(true);
  setStakingInfo({
    staked_at: new Date().toISOString(),
    staking_period: stakingPeriod,
    release_date: new Date(Date.now() + parseInt(stakingPeriod, 10) * 24 * 60 * 60 * 1000).toISOString(),
    total_rewards: result.estimatedRewards.totalRewards,
    progress_percentage: 0,
    earned_so_far: 0
  });
  
  // Show success popup
  setSuccessData({
    nftName: nft.name,
    image: nft.image ? processImageUrl(nft.image) : createPlaceholder(nft.name),
    tier: currentTier,
    period: stakingPeriod,
    rewards: result.estimatedRewards.totalRewards,
    releaseDate: new Date(Date.now() + parseInt(stakingPeriod, 10) * 24 * 60 * 60 * 1000).toLocaleDateString()
  });
  setShowSuccessPopup(true);
  
  // Call the original onSuccess if provided
  if (onSuccess) {
    onSuccess(result);
  }
};

const handleStakingError = (error) => {
  console.error("Staking error:", error);
  
  // Format user-friendly error message
  let errorMessage = "Failed to stake NFT";
  
  if (error.message) {
    if (error.message.includes("blockhash")) {
      errorMessage = "Transaction expired. Please try again.";
    } else if (error.message.includes("insufficient funds")) {
      errorMessage = "Not enough SOL to pay for transaction fees.";
    } else if (error.message.includes("timed out")) {
      errorMessage = "The operation timed out. Please try again later.";
    } else {
      errorMessage = error.message;
    }
  }
  
  setError(errorMessage);
  
  // Call the original onError if provided
  if (onError) {
    onError(error);
  }
};
```

### 3. Update the Frontend UI

Add a notification to inform users about the optimized staking option:

```jsx
{/* New Optimized Staking Banner */}
<div className="mb-6 p-3 bg-indigo-50 rounded-md border border-indigo-200">
  <h3 className="text-sm font-bold text-indigo-700 mb-1">최적화된 스테이킹 방식이 적용되었습니다</h3>
  <p className="text-xs text-indigo-600">
    더 빠르고 안정적인 스테이킹이 가능합니다. 지갑 서명 횟수가 줄어들고 더 명확한 상태 정보를 제공합니다.
  </p>
</div>
```

## API Setup Requirements

The optimized staking button works with the following API endpoints:

1. `/api/staking/prepareStaking-anchor-fixed`: The main API endpoint that prepares all transactions
2. `/api/staking/submitTransaction`: For submitting signed transactions to the blockchain
3. `/api/staking/completeStaking-anchor`: For recording staking completion

Make sure these endpoints are implemented correctly and are accessible to the client.

## Backend Implementation Details

### prepareStaking-anchor-fixed.js

This API should:

1. Check which accounts need initialization
2. Generate PDA addresses correctly
3. Prepare separate transactions for account initialization and staking
4. Return account status information

Example response structure:

```json
{
  "success": true,
  "message": "Staking transactions prepared successfully",
  "data": {
    "transactions": {
      "phase1": "base64_encoded_tx_for_token_accounts",
      "phase3": "base64_encoded_tx_for_staking"
    },
    "requiredPhases": {
      "phase1": true,
      "phase3": true
    },
    "accountInitialization": {
      "userTokenAccount": "needs_init",
      "escrowTokenAccount": "ready",
      "userStakingInfo": "ready",
      "allReady": false
    },
    "accounts": {
      "userTokenAccount": "pubkey",
      "escrowTokenAccount": "pubkey",
      "escrowAuthority": "pubkey",
      "stakeInfo": "pubkey",
      "poolState": "pubkey",
      "userStakingInfo": "pubkey"
    },
    "rewardDetails": {
      "totalRewards": 10000,
      "nftTier": "LEGENDARY"
    }
  }
}
```

### submitTransaction.js

This endpoint should:

1. Accept base64 encoded transactions
2. Submit them to the Solana blockchain
3. Return the transaction signature and status
4. Include detailed error information if things fail

### completeStaking-anchor.js

This endpoint should:

1. Record successful staking transactions in your database
2. Update relevant staking statistics
3. Handle any post-staking processes
4. Return success confirmation

## Troubleshooting Common Issues

### Transaction Signature Failures

If users experience transaction signature failures:

1. Check if the wallet has sufficient SOL for transaction fees
2. Verify that the wallet is still connected during the entire process
3. Ensure proper error handling for user-rejected transactions

### Account Initialization Errors

If account initialization fails:

1. Verify that your PDA seeds match those in the Anchor program
2. Check that account sizes are specified correctly in the IDL
3. Make sure the user has sufficient SOL for account rent

### Staking Transaction Failures

If the staking transaction fails:

1. Check that all required accounts were properly initialized
2. Verify that the NFT is still in the user's wallet
3. Ensure you're using the correct program ID and instruction data

## Best Practices

1. **Always Check Account Existence**: Before any operation, verify that accounts exist or need initialization
2. **Use Proper Error Handling**: Provide clear, actionable error messages to users
3. **Minimize User Interactions**: Reduce wallet signature requests to the minimum needed
4. **Provide Clear Status Updates**: Show detailed progress information during the staking process
5. **Implement Fallback Mechanisms**: Always provide alternative methods if the optimized approach fails

## Conclusion

By implementing the optimized staking button, you'll provide a more reliable and user-friendly staking experience with fewer required signatures and clearer feedback. This approach handles the complexities of account initialization behind the scenes while ensuring transactions are processed correctly.

If you encounter any issues during implementation, refer to the troubleshooting section or contact the development team for assistance.

---

Last Updated: May 12, 2025