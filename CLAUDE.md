# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run all tests
- `npm run test -- -t "test name"` - Run specific test

## NFT Staking Program Integration

The NFT staking program is integrated through Anchor IDL. Key details:
- IDL Location: `/idl/nft_staking.json`
- Program ID: `4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs`
- Features: Core staking, emergency unstaking, governance, referral system, social verification

When working with the staking system, ensure to:
1. Use the latest IDL in `/idl/nft_staking.json`
2. Handle account PDAs correctly as defined in the IDL
3. Implement proper error handling for program transaction errors
4. Follow the seed derivation patterns in `shared/utils/pda.js`

## Code Style Guidelines

- **ESModule Format**: Use ES modules (`import`/`export`)
- **React Components**: Use function components with hooks
- **JSX**: Use .jsx extension for React components
- **Formatting**: 2-space indentation, no semicolons in JSX files
- **Types**: Use JSDoc comments for type documentation
- **Imports**: Group imports (React, libraries, components, utils)
- **Error Handling**: Use try/catch blocks with console.error for graceful degradation
- **State Management**: Use React context for shared state
- **Responsiveness**: Include mobile-specific handling
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Solana Integration**: Follow wallet adapter patterns for blockchain interactions

## Staking Component Connections

The following frontend components connect with the NFT staking program:
- `components/staking/StakingDashboard.jsx`: Main staking interface
- `components/staking/NFTGallery.jsx`: Displays stakable NFTs
- `components/staking/StakedNFTCard.jsx`: Individual staked NFT display
- `components/staking/StakingRewards.jsx`: Displays and manages rewards
- `components/staking/GovernanceTab.jsx`: Governance proposal interface

## Anchor Program Access Pattern

```javascript
import { Program } from '@project-serum/anchor';
import nftStakingIdl from '../idl/nft_staking.json';

// Initialize program
const program = new Program(
  nftStakingIdl,
  new PublicKey('4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs'),
  provider
);

// Access instructions
await program.methods
  .stakeNft(stakingPeriod, nftTier, autoCompound)
  .accounts({...})
  .rpc();
```

---

*Last updated: May 11, 2025*