# Tesola NFT Staking Account Initialization Guide

## Overview

This guide explains how to fix the "AccountNotInitialized" error in the NFT staking process. The solution focuses on properly initializing all required accounts before attempting to stake NFTs.

## Problem Description

The staking system is experiencing the following errors:

1. `AnchorError caused by account: user_nft_account. Error Code: AccountNotInitialized` - The user's NFT token account is not properly initialized when staking is attempted.

2. `Cannot use 'in' operator to search for 'vec' in pubkey` - IDL interpretation error often related to account validation issues.

## Solution Overview

We've implemented a comprehensive three-phase approach to ensure all accounts required for staking are properly initialized:

1. **Diagnostic Phase**: Comprehensive validation of all required account states
2. **Token Account Initialization**: Proper initialization of user and escrow token accounts
3. **User Staking Info Initialization**: Creation of required user staking info account

## Implementation Details

### Key Components

1. **Enhanced diagnose.js API**: Provides detailed account validation and readiness status
2. **Three-phase transaction in prepareStaking-anchor.js**: Splits account initialization and staking into separate transactions
3. **Improved TokenAccountInitializer component**: User interface for handling all account initialization steps

### Using the Solution

#### Front-end Implementation

1. Use the enhanced `TokenAccountInitializer` component before staking:

```jsx
import { useState } from 'react';
import TokenAccountInitializer from '../components/staking/TokenAccountInitializer';

function StakingComponent() {
  const [needsInitialization, setNeedsInitialization] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  
  // Check if account initialization is needed before staking
  const handleStakeClick = async (nft) => {
    setSelectedNFT(nft);
    
    try {
      const response = await fetch('/api/staking/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: nft.mint
        }),
      });
      
      const data = await response.json();
      
      if (!data.data.accountReadiness.readyForStaking) {
        setNeedsInitialization(true);
      } else {
        // Proceed directly to staking
        proceedWithStaking(nft);
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  };
  
  // Handle successful account initialization
  const handleInitSuccess = (result) => {
    setNeedsInitialization(false);
    // Proceed with staking using the initialized accounts
    proceedWithStaking(selectedNFT, result);
  };
  
  return (
    <div>
      {/* NFT selection UI */}
      
      {needsInitialization && (
        <TokenAccountInitializer
          mintAddress={selectedNFT?.mint}
          onSuccess={handleInitSuccess}
          onError={(err) => console.error(err)}
          onCancel={() => setNeedsInitialization(false)}
          showDetails={true} // Set to true to show diagnostic information
        />
      )}
    </div>
  );
}
```

#### Back-end Usage

When calling the staking API endpoints directly, use the following approach:

1. First diagnose account status:

```javascript
const diagnosticResult = await fetch('/api/staking/diagnose', {
  method: 'POST',
  body: JSON.stringify({ wallet, mintAddress })
});

const { accountReadiness } = await diagnosticResult.json();
```

2. If initialization is needed, process each transaction phase separately:

```javascript
// Get the prepareStaking response
const stakingPrep = await fetch('/api/staking/prepareStaking-anchor', {
  method: 'POST',
  body: JSON.stringify({ wallet, mintAddress, stakingPeriod, nftTier })
});

const { transactions, accountsNeedingInitialization } = await stakingPrep.json();

// Process each transaction in sequence
if (transactions.phase1 && 
    (accountsNeedingInitialization.userTokenAccount || 
     accountsNeedingInitialization.escrowTokenAccount)) {
  // Sign and submit phase1 transaction to initialize token accounts
}

if (transactions.phase2 && accountsNeedingInitialization.userStakingInfo) {
  // Sign and submit phase2 transaction to initialize user staking info
}

// Finally, sign and submit the actual staking transaction
// Sign and submit transactions.phase3
```

## Account Requirements

For successful staking, the following accounts must be properly initialized:

1. **User Token Account**: Associated Token Account for the user's wallet and NFT mint
2. **Escrow Token Account**: Associated Token Account for the escrow authority and NFT mint
3. **User Staking Info**: On-chain account tracking the user's staking activity

## Common Error Resolutions

1. **AccountNotInitialized Error**: This occurs when any of the accounts isn't properly initialized. Use the `diagnose` endpoint to identify which account needs initialization.

2. **Invalid Staking Transaction**: Make sure to process the transactions in order:
   - First: Token account initialization
   - Second: User staking info initialization
   - Third: Actual staking transaction

3. **Escrow Account Creation Failure**: If escrow token account creation fails, use the `directTokenInitialize` endpoint which handles edge cases.

## Verifying Success

After initialization, verify account status through the `diagnose` endpoint:

```javascript
const verifyResponse = await fetch('/api/staking/diagnose', {
  method: 'POST',
  body: JSON.stringify({ wallet, mintAddress })
});

const { accountReadiness } = await verifyResponse.json();

if (accountReadiness.readyForStaking) {
  console.log('All accounts are properly initialized for staking');
}
```

## Conclusion

This three-phase approach ensures all accounts are properly initialized before staking, eliminating the `AccountNotInitialized` error. By properly validating and initializing each required account, the staking process becomes much more reliable.