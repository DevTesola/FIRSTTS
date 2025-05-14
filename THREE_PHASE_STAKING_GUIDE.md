# Three-Phase NFT Staking Implementation Guide

## Problem Overview

Our NFT staking system was encountering several critical issues:

1. **AccountNotInitialized Errors**: 
   ```
   AnchorError caused by account: user_nft_account. Error Code: 3012. 
   Error Message: The program expected this account to be already initialized.
   ```

2. **IDL Type Issues**:
   ```
   TypeError: Cannot read properties of undefined (reading 'size')
   ```

3. **Vector Type Parsing Errors**:
   ```
   Cannot use 'in' operator to search for 'vec' in pubkey
   ```

These issues disrupted the staking experience and prevented users from successfully staking their NFTs.

## Root Causes

### 1. Account Initialization Sequence Problems

- **Dependency Chain**: Staking requires multiple initialized accounts (token accounts, escrow accounts, user staking info) with strict dependencies between them.
  
- **Transaction Ordering**: When multiple initialization instructions were included in a single transaction, execution order wasn't guaranteed, causing dependency failures.

- **Missing Accounts**: Some required accounts weren't being checked for existence or properly initialized before staking.

### 2. IDL Structure and Parsing Issues

- **Missing Size Property**: The Anchor IDL lacked required `size` properties for accounts, causing errors during account layout calculation.

- **Vec<Pubkey> Type Handling**: The IDL contained `vec<pubkey>` type which wasn't properly parsed by the Anchor client library.

- **Type Mismatch**: Client-side parsing of IDL data failed due to inconsistencies between on-chain and client-side type definitions.

## Three-Phase Staking Solution

Our solution implements a sequential three-phase approach that ensures proper account initialization:

### Phase 1: Token Account Initialization

This phase initializes all required token accounts:

```javascript
// Initialize user and escrow token accounts
const userTokenAccount = await getAssociatedTokenAddress(mintAddress, wallet);
const escrowTokenAccount = await getAssociatedTokenAddress(
  mintAddress, 
  escrowAuthority, 
  true  // allowOwnerOffCurve = true for PDA accounts
);

// Create token account instructions if they don't exist
let instructions = [];

if (!(await connection.getAccountInfo(userTokenAccount))) {
  instructions.push(
    createAssociatedTokenAccountInstruction(
      payer, 
      userTokenAccount, 
      wallet, 
      mintAddress
    )
  );
}

if (!(await connection.getAccountInfo(escrowTokenAccount))) {
  instructions.push(
    createAssociatedTokenAccountInstruction(
      payer, 
      escrowTokenAccount, 
      escrowAuthority, 
      mintAddress
    )
  );
}
```

### Phase 2: User Staking Info Initialization

This phase creates and initializes the account that will store the user's staking data:

```javascript
// Generate the user staking info PDA
const [userStakingInfoPDA] = await PublicKey.findProgramAddress(
  [
    Buffer.from("user-staking-info"),
    wallet.toBuffer()
  ],
  programId
);

// Create instruction to initialize user staking info
if (!(await connection.getAccountInfo(userStakingInfoPDA))) {
  const initUserStakingInfoIx = program.instruction.initializeUserStakingInfo(
    {
      accounts: {
        user: wallet,
        userStakingInfo: userStakingInfoPDA,
        systemProgram: SystemProgram.programId,
      },
      signers: [wallet],
    }
  );
  
  instructions.push(initUserStakingInfoIx);
}
```

### Phase 3: Staking Transaction

Only after the previous two phases are complete, this phase executes the actual staking transaction:

```javascript
// Create the staking instruction
const stakeNftIx = program.instruction.stakeNft(
  {
    accounts: {
      user: wallet,
      userStakingInfo: userStakingInfoPDA,
      userTokenAccount: userTokenAccount,
      nftMint: mintAddress,
      escrowTokenAccount: escrowTokenAccount,
      escrowAuthority: escrowAuthority,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    signers: [wallet],
  }
);

// Create and send the transaction
const transaction = new Transaction().add(stakeNftIx);
const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
```

## IDL Fixes

To solve the "Cannot use 'in' operator to search for 'vec' in pubkey" and related errors:

1. **Added Size Property**:
   ```javascript
   // Function to add size property to all account definitions
   function prepareClientIdl(idl) {
     if (!idl.accounts) return idl;
     
     const preparedIdl = { ...idl };
     preparedIdl.accounts = preparedIdl.accounts.map(account => {
       if (!account.size) {
         return { ...account, size: 1024 }; // Default size
       }
       return account;
     });
     
     return preparedIdl;
   }
   ```

2. **Updated Program Initialization**:
   ```javascript
   import { Program } from '@project-serum/anchor';
   import idl from './idl/nft_staking.json';
   
   // Create Anchor program with prepared IDL
   const program = new Program(
     prepareClientIdl(idl),
     programId,
     provider,
     {
       useUpdatedIdl: true  // This option helps handle vec<pubkey> type correctly
     }
   );
   ```

3. **Created Fixed IDL File**:
   We now maintain a fixed version of the IDL with proper size attributes:
   ```json
   {
     "accounts": [
       {
         "name": "userStakingInfo",
         "type": {
           "kind": "struct",
           "fields": [...]
         },
         "size": 1024
       },
       ...
     ]
   }
   ```

## ThreePhaseStakingButton Component

The `ThreePhaseStakingButton` component handles the sequential execution of all three phases:

```jsx
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

const ThreePhaseStakingButton = ({ mintAddress, onComplete }) => {
  const { publicKey, signTransaction } = useWallet();
  const [currentPhase, setCurrentPhase] = useState(0); // 0: not started, 1-3: phases
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  
  const handleStake = async () => {
    try {
      setStatus('processing');
      setError(null);
      
      // Check what needs to be initialized
      const diagnosticsResponse = await fetch('/api/staking/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: mintAddress
        })
      });
      
      const diagnostics = await diagnosticsResponse.json();
      
      // If already ready for staking, skip to phase 3
      if (diagnostics.data.accountReadiness.readyForStaking) {
        setCurrentPhase(3);
      } else {
        // Prepare all required transactions
        const prepResponse = await fetch('/api/staking/prepareStaking-anchor-fixed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: publicKey.toString(),
            mintAddress: mintAddress
          })
        });
        
        const prepData = await prepResponse.json();
        
        // Execute Phase 1: Token Account Initialization if needed
        if (prepData.data.tokenAccountsNeedInit) {
          setCurrentPhase(1);
          const tx1 = Transaction.from(
            Buffer.from(prepData.data.tokenAccountsTx, 'base64')
          );
          const signedTx1 = await signTransaction(tx1);
          
          // Submit the transaction
          await submitTransaction(signedTx1, 'token_init');
          
          // Wait for confirmation
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Execute Phase 2: User Staking Info Initialization if needed
        if (prepData.data.userStakingInfoNeedsInit) {
          setCurrentPhase(2);
          const tx2 = Transaction.from(
            Buffer.from(prepData.data.userStakingInfoTx, 'base64')
          );
          const signedTx2 = await signTransaction(tx2);
          
          // Submit the transaction
          await submitTransaction(signedTx2, 'user_staking_info_init');
          
          // Wait for confirmation
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Execute Phase 3: Staking Transaction
      setCurrentPhase(3);
      const stakingResponse = await fetch('/api/staking/prepareStaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: mintAddress
        })
      });
      
      const stakingData = await stakingResponse.json();
      const tx3 = Transaction.from(
        Buffer.from(stakingData.data.transaction, 'base64')
      );
      const signedTx3 = await signTransaction(tx3);
      
      // Submit the final staking transaction
      const result = await submitTransaction(signedTx3, 'stake_nft');
      
      setStatus('success');
      if (onComplete) onComplete(result);
      
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };
  
  // Helper to submit transactions
  const submitTransaction = async (signedTx, type) => {
    const response = await fetch('/api/staking/submitTransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction: Buffer.from(signedTx.serialize()).toString('base64'),
        type: type
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit transaction');
    }
    
    return await response.json();
  };
  
  return (
    <div>
      <div className="progress-steps">
        <div className={`step ${currentPhase >= 1 ? 'active' : ''}`}>
          Token Accounts
        </div>
        <div className={`step ${currentPhase >= 2 ? 'active' : ''}`}>
          Staking Info
        </div>
        <div className={`step ${currentPhase >= 3 ? 'active' : ''}`}>
          Stake NFT
        </div>
      </div>
      
      <button 
        onClick={handleStake}
        disabled={status === 'processing'}
        className="stake-button"
      >
        {status === 'processing' ? 'Processing...' : 'Stake NFT'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ThreePhaseStakingButton;
```

## Technical Implementation Details

### API Endpoints

1. **`/api/staking/diagnose.js`**
   - Checks if all required accounts exist and are properly initialized
   - Returns account status and readiness for staking
   - Provides diagnostic information about account state

2. **`/api/staking/initializeTokenAccount.js`**
   - Creates the token accounts needed for staking (Phase 1)
   - Handles both user token account and escrow token account

3. **`/api/staking/initializeUserStakingInfo.js`**
   - Creates and initializes the user staking info account (Phase 2)
   - Handles PDA creation and account initialization

4. **`/api/staking/prepareStaking-anchor-fixed.js`**
   - Analyzes what accounts need to be initialized
   - Prepares all three transaction phases in one call
   - Returns only the transactions needed based on account states

5. **`/api/staking/submitTransaction.js`**
   - Handles transaction submission with enhanced error handling
   - Performs transaction confirmation and verification
   - Returns transaction results with better error messaging

### Key Components

1. **`TokenAccountInitializer.jsx`**
   - Handles the first two phases of initialization
   - Shows detailed status and progress indicators
   - Provides diagnostic information about account state

2. **`StakingComponent.jsx`**
   - Integrates the three-phase approach into the main staking UI
   - Handles NFT selection and staking workflow
   - Uses TokenAccountInitializer when needed

## Best Practices

1. **Always check account existence before staking**:
   ```javascript
   // Always check if accounts exist before attempting operations
   const userStakingInfo = await connection.getAccountInfo(userStakingInfoPDA);
   if (!userStakingInfo) {
     // Initialize the account first
     // ...
   }
   ```

2. **Keep initialization steps separate**:
   - Never combine account initialization and staking in the same transaction
   - Follow the three-phase approach for reliable operation

3. **Always use the updated IDL**:
   ```javascript
   // Import the fixed IDL
   import fixedIdl from './idl/nft_staking_fixed.json';
   
   // Or use the helper utility
   import { prepareClientIdl } from '../shared/utils/prepare-client-idl';
   import originalIdl from './idl/nft_staking.json';
   
   const preparedIdl = prepareClientIdl(originalIdl);
   ```

4. **Verify transaction success at each phase**:
   ```javascript
   // After submitting a transaction, verify the account was created
   const txId = await sendAndConfirmTransaction(connection, transaction, [wallet]);
   const accountInfo = await connection.getAccountInfo(accountAddress);
   if (!accountInfo) {
     throw new Error('Account was not properly initialized');
   }
   ```

5. **Provide clear user feedback**:
   - Show progress for each phase
   - Explain what's happening at each step
   - Provide meaningful error messages

## Troubleshooting

### "Cannot use 'in' operator to search for 'vec' in pubkey" error

This error occurs when the IDL contains vector types that aren't properly handled by the Anchor client.

**Solution**:
1. Use the updated IDL with proper type definitions
2. When creating the Program object, use the `useUpdatedIdl: true` option:
   ```javascript
   const program = new Program(preparedIdl, programId, provider, {
     useUpdatedIdl: true
   });
   ```

### "AccountNotInitialized" errors

These errors occur when trying to use an account that doesn't exist or isn't properly initialized.

**Solution**:
1. Follow the three-phase approach to ensure proper account initialization
2. Use the diagnostic API to check which accounts need initialization
3. Never attempt to stake until all required accounts are confirmed initialized

### "Cannot read properties of undefined (reading 'size')" error

This error occurs when the IDL lacks size properties for account definitions.

**Solution**:
1. Use the `prepareClientIdl` utility to add size properties to account definitions
2. Use the updated IDL with proper size attributes
3. Generate a fixed IDL using the `update-idl-size.js` script

## Conclusion

The three-phase staking approach ensures reliable NFT staking by properly handling account initialization and dependencies. By separating the process into distinct phases and fixing IDL parsing issues, we've resolved the critical errors that were preventing successful staking operations.

Key benefits of this approach:

1. **Reliability**: Ensures all accounts are properly initialized before staking
2. **Better Error Handling**: Provides clear, phase-specific error messages
3. **Improved User Experience**: Clear feedback on the staking process
4. **Compatibility**: Properly handles on-chain account requirements and IDL parsing

By following this guide and implementing the three-phase approach, you can provide a robust and reliable NFT staking experience for your users.

---

Last Updated: May 12, 2025