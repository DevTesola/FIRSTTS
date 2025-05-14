# NFT Staking IDL Integration Guide

This guide explains how to properly integrate the NFT Staking IDL with client applications to avoid common issues.

## Common Issues

### Missing 'size' Property

One of the most common issues when working with Anchor-generated IDLs is the missing `size` property in account definitions. This property is required by Anchor client libraries to correctly calculate account layouts, but it's sometimes not included in the IDL.

Error you might see:
```
TypeError: Cannot read properties of undefined (reading 'size')
```

### IDL Version Mismatches

When the on-chain program is updated, the IDL might also change. Using an outdated IDL can lead to errors when interacting with the program.

## Solutions

### 1. Use the Prepared IDL

We provide utilities to ensure your IDL has all required properties:

```javascript
// Import the utility
const { prepareClientIdl } = require('../shared/utils/prepare-client-idl');
// Import your IDL
const nftStakingIdl = require('./idl/nft_staking.json');

// Prepare the IDL before using it with Anchor
const preparedIdl = prepareClientIdl(nftStakingIdl);

// Use the prepared IDL with Anchor
const program = new Program(preparedIdl, programId, provider);
```

### 2. Use the Helper Function

For a simpler approach, use the provided helper function:

```javascript
const { createProgramWithPreparedIdl } = require('../shared/utils/prepare-client-idl');
const nftStakingIdl = require('./idl/nft_staking.json');
const programId = new PublicKey('4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs');

// Create the Anchor program with the prepared IDL
const program = createProgramWithPreparedIdl(nftStakingIdl, programId, provider);
```

### 3. Update the IDL

You can also update your IDL file directly using the provided script:

```bash
node idl/update-idl-size.js
```

This will create an updated version of the IDL with the `size` property added to all accounts.

### 4. Generate a Complete IDL

For the most complete solution, use the generate-complete-idl.js script:

```bash
node idl/generate-complete-idl.js
```

This script merges information from multiple IDL files and ensures all properties are properly set.

## Best Practices

1. **Always Check for Updates**: Regularly check for updates to the IDL as the program evolves.

2. **Use Helper Utilities**: Use the provided utilities to prepare IDLs for client use.

3. **Handle Errors Gracefully**: Add error handling for cases where the IDL might be missing required properties.

4. **Test Transactions**: Always test transactions in a development environment before using in production.

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

These sizes are conservative estimates and should work for most use cases. If you encounter issues with account size, you may need to adjust these values based on the actual size of the accounts.

---

*Last updated: May 12, 2025*