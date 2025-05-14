# Emergency Unstaking Implementation Plan

This document outlines the implementation of the Emergency Unstaking feature for the TESOLA NFT Staking system.

## Overview

Emergency unstaking allows users to withdraw their staked NFTs before the staking period has completed, with a penalty fee applied proportional to how early they unstake.

## Current Status

✅ The emergency unstaking feature is implemented in the on-chain program (`emergency_unstake_nft` instruction)  
✅ The feature is properly defined in the IDL (nft_staking.json)  
✅ API endpoints exist for preparing and completing emergency unstaking transactions  
✅ Client-side helper function for instruction data creation has been added  
✅ Discriminator constants have been updated to include emergency unstaking  

## Implementations

### 1. On-Chain Implementation

The `emergency_unstake_nft` instruction is implemented in the on-chain program with the following functionality:

- Verifies the staking state and ownership
- Calculates penalty fee based on staking completion ratio
- Transfers the NFT back to the user's wallet
- Calculates and provides partial rewards
- Updates staking records
- Emits `EmergencyNftUnstaked` event

### 2. Client-Side Implementation

#### A. API Endpoints

Two API endpoints have been created:

1. **`/api/staking/prepareEmergencyUnstaking.js`**
   - Prepares the transaction for emergency unstaking
   - Calculates fee and rewards based on staking duration
   - Returns transaction data to be signed by the user

2. **`/api/staking/completeEmergencyUnstaking.js`**
   - Processes the completion of the emergency unstaking transaction
   - Updates database records
   - Calculates final rewards after fee deduction

#### B. Helper Functions

Added the following helper functions to support emergency unstaking:

1. **`createEmergencyUnstakeNftInstructionData()`** in `instruction-utils.js`
   - Creates the instruction data buffer for emergency unstaking
   - Uses the correct discriminator from the IDL

2. Updated `discriminators.js` to include:
   - `EMERGENCY_UNSTAKE_NFT` discriminator from IDL

### 3. Front-End Integration

To fully implement emergency unstaking in the front-end, these remaining components need to be created:

#### A. UI Components to Build

1. **EmergencyUnstakeButton component**
   - Displayed on StakedNFTCard when unstaking before the staking period ends
   - Shows warning about penalty fees

2. **EmergencyUnstakeConfirmationModal**
   - Displays detailed information about penalty and rewards
   - Requires explicit confirmation from user

3. **EmergencyUnstakeResultModal**
   - Shows results of emergency unstaking
   - Displays final rewards after penalty

#### B. Client-Side Logic

1. **Emergency unstaking workflow in StakingDashboard**
   - Function to handle emergency unstaking requests
   - API calls to prepare and complete transactions
   - Transaction signing and error handling

2. **Fee and reward calculation helpers**
   - Function to preview fee calculation
   - Function to estimate rewards after penalty

## Implementation Steps

### Completed Steps

1. ✅ Added `createEmergencyUnstakeNftInstructionData()` function to `instruction-utils.js`
2. ✅ Updated `discriminators.js` to include the emergency unstaking discriminator
3. ✅ Updated `prepareEmergencyUnstaking.js` to import and use the new helper function

### Pending Steps

1. Test the emergency unstaking functionality end-to-end
2. Create front-end components for emergency unstaking
3. Implement client-side logic for calculating and displaying fees
4. Add unit tests for emergency unstaking
5. Update documentation for users and developers

## Testing Plan

1. **Unit Tests**
   - Test instruction data creation
   - Test fee calculation logic
   - Test reward calculation with penalty

2. **Integration Tests**
   - Test complete emergency unstaking flow
   - Test different staking durations and penalty calculations
   - Test error handling and edge cases

3. **UI Testing**
   - Verify UI components display correctly
   - Test confirmation flows and user interactions

## References

- **IDL**: `/idl/nft_staking.json` (lines 442-670)
- **API Endpoints**: 
  - `/pages/api/staking/prepareEmergencyUnstaking.js`
  - `/pages/api/staking/completeEmergencyUnstaking.js`
- **Helper Functions**: 
  - `/utils/staking-helpers/instruction-utils.js`
  - `/shared/constants/discriminators.js`

---

*Last updated: May 12, 2025*