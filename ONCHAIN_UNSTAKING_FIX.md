# ONCHAIN NFT Unstaking Fix

This document provides information about the fix for unstaking NFTs with onchain IDs.

## Issue Description

When trying to unstake an NFT that was detected from onchain data (rather than inserted through the API), users were encountering an error message:

```
invalid input syntax for type integer: 'onchain_Fos7QW8J'
```

The issue stemmed from the way onchain staking records are identified in the system:

1. When NFTs are staked through the API, they get a numeric ID in the database.
2. When NFTs are detected from onchain data during sync operations, they get assigned a string ID with format `onchain_XXXXXXXX`.
3. The unstaking API endpoints (`prepareUnstaking_v3.js` and `prepareUnstaking.js`) were trying to query the database by ID, expecting a numeric ID which could be cast to an integer.

## Solution

We modified the unstaking API endpoints to detect when a staking ID is in the onchain format (`onchain_XXXXXXXX`) and handle it appropriately:

1. When an ID starts with `onchain_`, we query the database using just the wallet address and mint address, ignoring the ID.
2. For regular numeric IDs, we continue to query by ID, wallet address, and mint address.
3. Additional logging was added to help with debugging similar issues in the future.

## Implementation Details

### In `/pages/api/prepareUnstaking_v3.js`:

```javascript
// Check if the stakingId starts with "onchain_" and handle differently
let stakingQuery;
if (stakingId && stakingId.toString().startsWith('onchain_')) {
  console.log('Detected onchain ID format, querying by wallet and mint address only');
  stakingQuery = supabase
    .from('nft_staking')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('mint_address', mintAddress)
    .eq('status', 'staked')
    .single();
} else {
  // Regular query with ID
  stakingQuery = supabase
    .from('nft_staking')
    .select('*')
    .eq('id', stakingId)
    .eq('wallet_address', wallet)
    .eq('mint_address', mintAddress)
    .eq('status', 'staked')
    .single();
}
```

### In `/pages/api/staking/prepareUnstaking.js`:

```javascript
// Check if stakingId is provided and if it uses onchain format
if (stakingId && stakingId.toString().startsWith('onchain_')) {
  console.log('온체인 ID 형식 감지, 지갑과 민트 주소로만 쿼리');
  stakingQuery = supabase
    .from('nft_staking')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('mint_address', mintAddress)
    .eq('status', 'staked')
    .maybeSingle();
}
```

We also added a check to bypass the ID matching validation for onchain IDs:

```javascript
// 스테이킹 ID 확인 (제공된 경우)
if (stakingId && !stakingId.toString().startsWith('onchain_') && stakingInfo.id !== stakingId) {
  return res.status(400).json(
    createApiResponse(false, '스테이킹 ID가 일치하지 않습니다', null, 'InvalidStakingId')
  );
}
```

## Future Considerations

For future improvements, consider:

1. Standardizing the ID format across the system to avoid such type mismatches
2. Adding a migration script to convert onchain IDs to numeric IDs
3. Enhancing the database schema to better handle both onchain and API-generated records

## Testing

After implementing this fix, users should be able to unstake NFTs detected from onchain data without encountering database errors.

Date: May 13, 2025