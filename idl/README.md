# NFT Staking IDL Documentation

This directory contains the Interface Description Language (IDL) files for the TESOLA NFT Staking Program.

## Files

- `nft_staking.json` - Complete IDL with all staking functionality
- `nft_staking_fixed.json` - IDL with size attributes added for Anchor compatibility
- `backup/` - Directory containing previous versions of IDL files

## Common Issues and Solutions

### Missing 'size' Property

A common issue when working with Anchor-generated IDLs is the missing `size` property in account definitions. This property is required by Anchor client libraries to correctly calculate account layouts.

Error you might see:
```
TypeError: Cannot read properties of undefined (reading 'size')
```

### Usage Instructions

To avoid these issues, follow one of these approaches:

#### Option 1: Use the Fixed IDL

```javascript
// Import the fixed IDL that includes size attributes
import fixedIdl from './idl/nft_staking_fixed.json';
import { Program } from '@project-serum/anchor';

// Create the program using the fixed IDL
const program = new Program(fixedIdl, programId, provider);
```

#### Option 2: Use the Client Helper

```javascript
// Import the helper and regular IDL
import { prepareClientIdl } from '../shared/utils/prepare-client-idl';
import nftStakingIdl from './idl/nft_staking.json';
import { Program } from '@project-serum/anchor';

// Prepare the IDL before using it with Anchor
const preparedIdl = prepareClientIdl(nftStakingIdl);
const program = new Program(preparedIdl, programId, provider);

// Or use the convenience function:
import { createProgramWithPreparedIdl } from '../shared/utils/prepare-client-idl';
const program = createProgramWithPreparedIdl(nftStakingIdl, programId, provider);
```

#### Option 3: Generate a Fixed IDL

Run the fix-idl-issues.js script to create a fixed version of the IDL and add the helper utilities:

```bash
node fix-idl-issues.js
```

## Features in NFT Staking IDL

The IDL includes the following features:

### 1. Core Staking System
- Standard NFT staking and unstaking
- Reward claiming functionality
- Auto-compound functionality for staking rewards
- Collection bonus based on number of staked NFTs
- Time-based reward multipliers that increase over time

### 2. Emergency Unstaking
- `emergency_unstake_nft` instruction: Emergency unstake an NFT with an early unstaking penalty
- Penalty fee is proportional to how early the unstaking occurs
- Full implementation with penalty calculation based on completion ratio
- Returns the NFT to the user's wallet and calculates partial rewards
- Emits `EmergencyNftUnstaked` event with details about penalty and rewards

### 3. Governance System
Allows stakers to participate in on-chain voting for project decisions:
- Proposal creation
- Voting mechanisms
- Proposal execution

### 4. Referral System
Enables users to refer others and earn rewards:
- Referral code generation
- Tracking referred users
- Claiming referral rewards

### 5. Social Activity Verification
Verifies and rewards users for social media participation:
- Social activity registration
- Verification mechanisms
- Social reward claiming

## Account Size Reference

Here's a reference for the typical sizes of accounts in the NFT Staking program:

| Account | Size (bytes) |
|---------|--------------|
| PoolState | 1024 |
| StakeInfo | 1024 |
| UserStakingInfo | 1024 |
| EnhancedProposal | 1024 |
| EnhancedVote | 1024 |
| UserReferralStats | 1024 |

For complete details, refer to the IDL files in this directory.

---

*Last updated: May 12, 2025*