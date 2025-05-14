# TESOLA NFT Staking Fix Test Plan

This document outlines a comprehensive testing plan to verify the fixes made to the NFT staking system. The testing process focuses on ensuring the correct functionality of staking, unstaking, and reward claiming operations.

## Test Environment Setup

1. **Prerequisites**:
   - Solana devnet environment for testing
   - A wallet with SOL for transaction fees
   - At least 2-3 test NFTs for staking tests
   - Pool state initialized with known parameters

2. **Environment Variables**:
   - `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com`
   - `ADMIN_WALLET_KEY=[Private key for admin wallet]` (if admin operations needed)

## Core Functionality Tests

### 1. Staking NFT Tests

#### Test 1A: Basic Staking Flow
1. Verify the NFT is owned by the test wallet
2. Call `/api/staking/prepareStaking` with NFT mint address, wallet, and staking period
3. Sign and submit the resulting transaction
4. Verify the NFT is now staked:
   - Check escrow account holds the NFT
   - Verify stake info account was created with correct data
   - Verify user staking info account was updated

#### Test 1B: Edge Cases
1. Attempt to stake an NFT that is already staked (should fail)
2. Attempt to stake an NFT that doesn't belong to the wallet (should fail)
3. Test staking with different tier NFTs to verify tier-based rewards
4. Test with auto-compound enabled

### 2. Unstaking NFT Tests

#### Test 2A: Basic Unstaking Flow
1. With a staked NFT, call `/api/staking/prepareUnstaking` with NFT mint address
2. Sign and submit the resulting transaction
3. Verify the NFT is correctly unstaked:
   - Check NFT returned to user wallet
   - Verify stake info account marked as unstaked
   - Verify user staking info account updated

#### Test 2B: Edge Cases
1. Attempt to unstake before the staking period completes (should fail)
2. Attempt to unstake an NFT that isn't staked (should fail)
3. Attempt to unstake someone else's NFT (should fail)

### 3. Reward Claiming Tests

#### Test 3A: Basic Reward Claiming
1. With a staked NFT that has accrued rewards, call `/api/staking/prepareClaimRewards`
2. Sign and submit the resulting transaction
3. Verify rewards were correctly processed:
   - Check rewards received in wallet
   - Verify last_claim_time updated in stake info account

#### Test 3B: Reward Calculation Verification
1. Stake an NFT for a known period (e.g., 7 days)
2. Calculate expected rewards based on tier and time
3. Claim rewards and verify the amount matches the calculation

## Integration Tests

### 1. Full Lifecycle Tests
1. Stake an NFT
2. Query staking info periodically to verify reward accrual
3. Claim rewards mid-staking
4. Continue staking until end of period
5. Unstake NFT
6. Verify all accounts are correctly updated

### 2. Multi-NFT Tests
1. Stake multiple NFTs from the same wallet
2. Verify user staking info correctly tracks all NFTs
3. Test claiming rewards from multiple NFTs
4. Verify unstaking one NFT doesn't affect others

## API Endpoint Tests

Test each API endpoint with various input combinations:

### 1. `/api/staking/getStakingInfo`
- Verify returns correct staking data for a wallet
- Verify includes all staked NFTs

### 2. `/api/staking/getStakingStats`
- Verify includes global staking statistics
- Check that calculated APY is correct

### 3. `/api/staking/getRewards`
- Verify calculated rewards are correct for various NFT tiers and staking periods

## Instrumentation Tests

1. **Discriminator Validation**:
   - Add instrumentation to log discriminator values used in transactions
   - Verify these match the IDL-derived values

2. **Account Structure Validation**:
   - Add instrumentation to log account data parsing
   - Verify structures match on-chain account definitions

3. **Transaction Composition Validation**:
   - Log account arrays in transaction composition
   - Verify accounts are in correct order with correct writable/signer flags

## Regression Tests

1. **Previous Failure Cases**:
   - Test specific cases that were previously failing
   - Document error messages and compare with previous failures

2. **Error Handling**:
   - Verify appropriate error messages for all failure cases
   - Ensure frontend properly handles and displays errors

## Test Reporting

For each test:
1. Record transaction signatures
2. Document expected vs. actual outcomes
3. Capture any error messages or unexpected behavior
4. Save logs for analysis

## Test Automation

Where possible, create automated scripts for:
1. NFT staking/unstaking flow
2. Reward calculation validation
3. API endpoint testing with various inputs

## Implementation Plan

1. Set up devnet testing environment
2. Create test NFTs with various tier attributes
3. Initialize pool state with test parameters
4. Execute tests in sequence:
   - Core functionality
   - Integration scenarios
   - API validations
   - Regression cases
5. Document results and any remaining issues

## Success Criteria

The fixes will be considered successful when:

1. All staking operations complete without errors
2. Account data parsing correctly handles all account types
3. Rewards are calculated correctly for all tier types
4. No regressions in previously working functionality
5. Frontend displays correct information for all operations