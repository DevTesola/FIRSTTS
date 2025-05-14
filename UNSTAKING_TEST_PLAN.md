# NFT Unstaking Test Plan

This document outlines the unstaking workflow and provides a plan for testing the unstaking functionality in the TESOLA staking system.

## Unstaking Workflow Overview

1. **Initiate Unstaking (Client)**:
   - User selects an NFT to unstake from the staking dashboard
   - User clicks "Unstake NFT" button on StakedNFTCard component
   - Confirmation dialog shows with penalty information (if applicable)

2. **Prepare Unstaking Transaction (API)**:
   - Client calls `/api/staking/prepareUnstaking` with:
     - `wallet`: User's wallet address
     - `mintAddress`: NFT mint address
     - `stakingId`: Database ID of the staking record
   - API validates staking record in database
   - API calculates early unstaking penalty (if applicable)
   - API creates instruction to initialize user token account (if needed)
   - API creates unstake NFT instruction
   - API returns serialized transaction and penalty information

3. **Sign and Send Transaction (Client)**:
   - User signs transaction using wallet
   - Client sends transaction to Solana network
   - Client waits for transaction confirmation

4. **Complete Unstaking (API)**:
   - Client calls `/api/staking/completeUnstaking` with:
     - `wallet`: User's wallet address
     - `mintAddress`: NFT mint address
     - `txSignature`: Transaction signature
     - `stakingId`: Database ID of the staking record
   - API verifies transaction success on Solana
   - API calculates final rewards and penalties
   - API updates staking record status to 'unstaked'
   - API creates reward record for earned tokens
   - API returns success response with reward information

5. **Update UI (Client)**:
   - Client displays success message with earned rewards
   - Client refreshes staking dashboard to show updated NFT collection

## Test Cases

### 1. Basic Unstaking Flow (NFT with Completed Staking Period)

- **Precondition**: User has a staked NFT with completed staking period
- **Test Steps**:
  1. Log in with test wallet
  2. Navigate to staking dashboard
  3. Confirm staked NFT displays "Unlocked" status
  4. Click "Claim & Unstake" button
  5. Confirm unstaking dialog shows no penalty
  6. Confirm transaction
  7. Verify success message shows full rewards
  8. Verify NFT appears back in user's collection
  9. Verify reward record created in database

### 2. Early Unstaking with Penalty

- **Precondition**: User has a staked NFT with active staking period
- **Test Steps**:
  1. Log in with test wallet
  2. Navigate to staking dashboard
  3. Confirm staked NFT shows time remaining
  4. Click "Unstake NFT" button
  5. Confirm unstaking dialog shows penalty warning
  6. Confirm transaction
  7. Verify success message shows reduced rewards with penalty
  8. Verify NFT appears back in user's collection
  9. Verify reward record created in database with penalty applied

### 3. Unstaking with Token Account Initialization

- **Precondition**: User has a staked NFT but no associated token account
- **Test Steps**:
  1. Log in with test wallet that has closed the token account
  2. Navigate to staking dashboard
  3. Click "Unstake NFT" button
  4. Confirm transaction (should include token account initialization)
  5. Verify success message shows rewards
  6. Verify NFT appears back in user's collection
  7. Verify token account was created automatically

### 4. Failed Transaction Handling

- **Precondition**: User has a staked NFT
- **Test Steps**:
  1. Log in with test wallet
  2. Navigate to staking dashboard
  3. Click "Unstake NFT" button
  4. Reject transaction signing in wallet
  5. Verify appropriate error message is shown
  6. Verify NFT remains in staking dashboard

### 5. Emergency Unstaking

- **Precondition**: User has a staked NFT with active staking period
- **Test Steps**:
  1. Log in with test wallet
  2. Navigate to staking dashboard
  3. Click "Emergency Unstake" button
  4. Confirm emergency unstaking dialog
  5. Confirm transaction
  6. Verify success message shows emergency unstaking result
  7. Verify NFT appears back in user's collection
  8. Verify staking record updated in database

## Potential Issues to Watch For

1. **Token Account Errors**: If the user's token account is not properly initialized or closed, this can cause transaction failures.

2. **Database Synchronization**: Ensure that database and on-chain state are properly synchronized after unstaking.

3. **PublicKey Errors**: Look for "PublicKey is not defined" errors in console logs.

4. **Transaction Schema Errors**: Watch for errors related to `transaction_signature` column in database schemas.

5. **Image Loading Issues**: After unstaking, verify that NFT images load properly in the user's collection.

## Testing Environment

- Use Solana Devnet for testing
- Use test wallet with sufficient SOL for transactions
- Use test NFTs with various staking periods and tiers
- Monitor console logs for errors
- Check database for correct record updates

## Success Criteria

- User can successfully unstake NFTs with both completed and active staking periods
- Penalties are correctly calculated and applied for early unstaking
- NFTs are returned to user's wallet after unstaking
- Reward records are correctly created in database
- UI updates to reflect unstaked NFTs