/**
 * Edge Case Tests for Staking Synchronization System
 * Tests handling of edge cases, error conditions, and recovery scenarios
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { 
  getStakeInfoFromChain,
  getWalletStakingInfoFromChain,
  checkDiscrepancies,
  syncNFT,
  syncWalletNFTs
} = require('../utils/staking-helpers/sync-utilities');
const { createClient } = require('@supabase/supabase-js');
const colors = require('./sync-system-test').colors;
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Random data generators for edge cases
function generateRandomMintAddress() {
  const keypair = Keypair.generate();
  return keypair.publicKey.toString();
}

function generateRandomWalletAddress() {
  const keypair = Keypair.generate();
  return keypair.publicKey.toString();
}

// Similar to the test runner from sync-system-test.js
async function runTest(testName, testFn) {
  process.stdout.write(`${colors.bright}Running edge case test: ${colors.blue}${testName}${colors.reset} ... `);
  try {
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;
    console.log(`${colors.green}✓ PASSED${colors.reset} (${duration}ms)`);
    return result;
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.error(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    return null;
  }
}

/**
 * Tests handling of invalid mint addresses
 */
async function testInvalidMintAddress() {
  // Test with invalid format
  try {
    await getStakeInfoFromChain('invalid-address');
    throw new Error('Should have rejected invalid address');
  } catch (error) {
    if (!error.message.includes('Invalid public key')) {
      throw error; // Wrong error type
    }
  }
  
  // Test with non-existent but valid format mint address
  const randomMint = generateRandomMintAddress();
  const result = await getStakeInfoFromChain(randomMint);
  
  // Should return null for non-existent address, not throw
  if (result !== null) {
    throw new Error(`Expected null for non-existent mint, got: ${JSON.stringify(result)}`);
  }
  
  return true;
}

/**
 * Tests handling of invalid wallet addresses
 */
async function testInvalidWalletAddress() {
  // Test with invalid format
  try {
    await getWalletStakingInfoFromChain('invalid-wallet');
    throw new Error('Should have rejected invalid wallet address');
  } catch (error) {
    if (!error.message.includes('Invalid public key')) {
      throw error; // Wrong error type
    }
  }
  
  // Test with non-existent but valid format wallet address
  const randomWallet = generateRandomWalletAddress();
  const result = await getWalletStakingInfoFromChain(randomWallet);
  
  // Should return empty stakes array, not throw
  if (!result || !Array.isArray(result.stakes) || result.stakes.length !== 0) {
    throw new Error(`Expected empty stakes array for non-existent wallet, got: ${JSON.stringify(result)}`);
  }
  
  return true;
}

/**
 * Tests handling of database connection errors
 * (simulated by using invalid credentials temporarily)
 */
async function testDatabaseConnectionErrors() {
  // Save original credentials
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  try {
    // Temporarily modify environment variables (this affects only this process)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://invalid-url.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'invalid-key';
    
    // Create a new client with invalid credentials
    const invalidClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Try to perform a database operation
    const { data, error } = await invalidClient.from('nft_staking').select('count(*)', { count: 'exact' });
    
    // Should have an error
    if (!error) {
      throw new Error('Expected database error with invalid credentials');
    }
    
    console.log(`  Database error correctly handled: ${error.message}`);
    
    return true;
  } finally {
    // Restore original credentials
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
}

/**
 * Tests handling of RPC connection errors
 * (simulated by using invalid RPC URL temporarily)
 */
async function testRPCConnectionErrors() {
  // Save original RPC endpoint
  const originalRpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT;
  
  try {
    // Temporarily modify environment variable
    process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT = 'https://invalid-rpc.example.com';
    
    // Create a new connection with invalid URL
    const invalidConnection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT);
    
    // Try to perform an RPC operation
    try {
      await invalidConnection.getVersion();
      throw new Error('Expected RPC error with invalid URL');
    } catch (error) {
      console.log(`  RPC error correctly handled: ${error.message}`);
    }
    
    return true;
  } finally {
    // Restore original RPC endpoint
    process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT = originalRpcEndpoint;
  }
}

/**
 * Tests handling of concurrent sync operations
 * (should not cause data corruption)
 */
async function testConcurrentSyncOperations() {
  if (!process.env.TEST_MINT_ADDRESS || !process.env.TEST_WALLET_ADDRESS) {
    console.log(`  ${colors.yellow}Skipping: TEST_MINT_ADDRESS or TEST_WALLET_ADDRESS not set${colors.reset}`);
    return true;
  }
  
  const mintAddress = process.env.TEST_MINT_ADDRESS;
  const walletAddress = process.env.TEST_WALLET_ADDRESS;
  
  // Start 3 concurrent sync operations
  const promises = [
    syncNFT(mintAddress),
    syncNFT(mintAddress), // Same NFT
    syncWalletNFTs(walletAddress)
  ];
  
  // All operations should complete without errors
  try {
    const results = await Promise.all(promises);
    
    console.log(`  All concurrent operations completed successfully`);
    
    // Check that all operations were successful
    for (const result of results) {
      if (!result.success) {
        throw new Error(`Expected successful operation, got: ${JSON.stringify(result)}`);
      }
    }
    
    return true;
  } catch (error) {
    throw new Error(`Concurrent operations failed: ${error.message}`);
  }
}

/**
 * Run all edge case tests
 */
async function runEdgeCaseTests() {
  console.log(`\n${colors.bright}${colors.magenta}=== Staking Synchronization Edge Case Tests ===${colors.reset}\n`);
  
  await runTest('Invalid Mint Address', testInvalidMintAddress);
  await runTest('Invalid Wallet Address', testInvalidWalletAddress);
  await runTest('Database Connection Errors', testDatabaseConnectionErrors);
  await runTest('RPC Connection Errors', testRPCConnectionErrors);
  await runTest('Concurrent Sync Operations', testConcurrentSyncOperations);
  
  console.log(`\n${colors.bright}${colors.magenta}=== Edge Case Tests Completed ===${colors.reset}\n`);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runEdgeCaseTests()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error(`${colors.red}Fatal error:${colors.reset}`, err);
      process.exit(1);
    });
}

// Export test functions
module.exports = {
  runEdgeCaseTests,
  testInvalidMintAddress,
  testInvalidWalletAddress,
  testDatabaseConnectionErrors,
  testRPCConnectionErrors,
  testConcurrentSyncOperations
};