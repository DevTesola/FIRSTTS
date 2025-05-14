/**
 * Staking Optimization Test Script
 * 
 * This test script validates the optimized staking functionality by:
 * 1. Testing the account initialization detection
 * 2. Verifying proper PDA calculation
 * 3. Validating transaction structure
 * 4. Ensuring phase simplification works correctly
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Import common utilities
const { 
  findStakeInfoPDA, 
  findEscrowAuthorityPDA, 
  findUserStakingInfoPDA 
} = require('../shared/utils/pda');
const { prepareIdlForAnchor } = require('../shared/utils/idl-helper');

// Set up test environment
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

// Load IDL
const rawIdlPath = path.join(__dirname, '../idl/nft_staking.json');
const rawIdl = JSON.parse(fs.readFileSync(rawIdlPath, 'utf8'));
const fixedIdl = prepareIdlForAnchor(rawIdl);

// Test helper functions
async function checkAccountExists(publicKey) {
  const accountInfo = await connection.getAccountInfo(publicKey);
  return accountInfo !== null;
}

async function testAccountDetection(wallet, mintAddress) {
  console.log('Testing account detection...');
  
  // Calculate expected addresses
  const userTokenAccount = await getAssociatedTokenAddress(
    new PublicKey(mintAddress),
    new PublicKey(wallet)
  );
  
  const [escrowAuthority] = findEscrowAuthorityPDA(new PublicKey(mintAddress));
  
  const escrowTokenAccount = await getAssociatedTokenAddress(
    new PublicKey(mintAddress),
    escrowAuthority,
    true // allowOwnerOffCurve for PDA
  );
  
  const [userStakingInfo] = findUserStakingInfoPDA(new PublicKey(wallet));
  
  // Check account existence
  const userTokenExists = await checkAccountExists(userTokenAccount);
  const escrowTokenExists = await checkAccountExists(escrowTokenAccount);
  const userStakingInfoExists = await checkAccountExists(userStakingInfo);
  
  console.log('Account detection results:');
  console.log(`- User token account (${userTokenAccount.toString()}): ${userTokenExists ? 'EXISTS' : 'NEEDS INIT'}`);
  console.log(`- Escrow token account (${escrowTokenAccount.toString()}): ${escrowTokenExists ? 'EXISTS' : 'NEEDS INIT'}`);
  console.log(`- User staking info (${userStakingInfo.toString()}): ${userStakingInfoExists ? 'EXISTS' : 'NEEDS INIT'}`);
  
  // Call the API to check if detection matches our manual check
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/staking/prepareStaking-anchor-fixed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet,
        mintAddress,
        stakingPeriod: 30,
        nftTier: 'COMMON'
      })
    });
    
    if (!response.ok) {
      console.error('API call failed:', await response.text());
      return false;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('API returned error:', data.message);
      return false;
    }
    
    const { accountInitialization } = data.data;
    
    // Verify API detection matches our manual check
    assert.strictEqual(
      accountInitialization.userTokenAccount === 'needs_init', 
      !userTokenExists, 
      'User token account detection mismatch'
    );
    
    assert.strictEqual(
      accountInitialization.escrowTokenAccount === 'needs_init', 
      !escrowTokenExists, 
      'Escrow token account detection mismatch'
    );
    
    assert.strictEqual(
      accountInitialization.userStakingInfo === 'needs_init', 
      !userStakingInfoExists, 
      'User staking info detection mismatch'
    );
    
    console.log('Account detection validation: SUCCESS');
    return true;
  } catch (err) {
    console.error('Account detection validation failed:', err);
    return false;
  }
}

async function testTransactionStructure(wallet, mintAddress) {
  console.log('Testing transaction structure...');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/staking/prepareStaking-anchor-fixed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet,
        mintAddress,
        stakingPeriod: 30,
        nftTier: 'COMMON'
      })
    });
    
    if (!response.ok) {
      console.error('API call failed:', await response.text());
      return false;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('API returned error:', data.message);
      return false;
    }
    
    const { transactions, requiredPhases, accountInitialization } = data.data;
    
    // Verify transaction structure
    if (accountInitialization.allReady) {
      // If all accounts are ready, we should only have phase3
      assert.strictEqual(requiredPhases.phase1, false, 'Phase 1 should not be required when all accounts are ready');
      assert.strictEqual(requiredPhases.phase3, true, 'Phase 3 should always be required');
      assert.strictEqual(transactions.phase3 !== null, true, 'Phase 3 transaction should be present');
    } else {
      // If any account needs initialization, phase1 should be present
      if (accountInitialization.userTokenAccount === 'needs_init' || 
          accountInitialization.escrowTokenAccount === 'needs_init') {
        assert.strictEqual(requiredPhases.phase1, true, 'Phase 1 should be required when token accounts need initialization');
        assert.strictEqual(transactions.phase1 !== null, true, 'Phase 1 transaction should be present');
      }
      
      // Phase 3 should always be present
      assert.strictEqual(requiredPhases.phase3, true, 'Phase 3 should always be required');
      assert.strictEqual(transactions.phase3 !== null, true, 'Phase 3 transaction should be present');
    }
    
    console.log('Transaction structure validation: SUCCESS');
    return true;
  } catch (err) {
    console.error('Transaction structure validation failed:', err);
    return false;
  }
}

async function testPDAConsistency(wallet, mintAddress) {
  console.log('Testing PDA consistency...');
  
  try {
    // Calculate PDAs manually
    const [stakeInfoPDA] = findStakeInfoPDA(new PublicKey(mintAddress));
    const [escrowAuthorityPDA] = findEscrowAuthorityPDA(new PublicKey(mintAddress));
    const [userStakingInfoPDA] = findUserStakingInfoPDA(new PublicKey(wallet));
    
    // Get PDAs from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/staking/prepareStaking-anchor-fixed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet,
        mintAddress,
        stakingPeriod: 30,
        nftTier: 'COMMON'
      })
    });
    
    if (!response.ok) {
      console.error('API call failed:', await response.text());
      return false;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('API returned error:', data.message);
      return false;
    }
    
    const { accounts } = data.data;
    
    // Verify PDAs match
    assert.strictEqual(
      accounts.stakeInfo, 
      stakeInfoPDA.toString(), 
      'Stake info PDA mismatch'
    );
    
    assert.strictEqual(
      accounts.escrowAuthority, 
      escrowAuthorityPDA.toString(), 
      'Escrow authority PDA mismatch'
    );
    
    assert.strictEqual(
      accounts.userStakingInfo, 
      userStakingInfoPDA.toString(), 
      'User staking info PDA mismatch'
    );
    
    console.log('PDA consistency validation: SUCCESS');
    return true;
  } catch (err) {
    console.error('PDA consistency validation failed:', err);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('=== Starting Staking Optimization Tests ===');
  
  // Test wallet and mint (replace with real values for testing)
  const testWallet = process.env.TEST_WALLET || Keypair.generate().publicKey.toString();
  const testMint = process.env.TEST_MINT || Keypair.generate().publicKey.toString();
  
  console.log(`Using test wallet: ${testWallet}`);
  console.log(`Using test mint: ${testMint}`);
  
  let testsPassed = 0;
  const totalTests = 3;
  
  // Run tests
  if (await testAccountDetection(testWallet, testMint)) testsPassed++;
  if (await testTransactionStructure(testWallet, testMint)) testsPassed++;
  if (await testPDAConsistency(testWallet, testMint)) testsPassed++;
  
  // Print summary
  console.log('\n=== Test Summary ===');
  console.log(`${testsPassed}/${totalTests} tests passed`);
  
  if (testsPassed === totalTests) {
    console.log('✅ All optimized staking tests passed!');
    return true;
  } else {
    console.error('❌ Some tests failed');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test execution error:', err);
      process.exit(1);
    });
}

module.exports = { runTests };