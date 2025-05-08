/**
 * Staking Synchronization System Test Script
 * This script tests the synchronization system with real data
 * 
 * Run with: node tests/sync-system-test.js
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { 
  getStakeInfoFromChain,
  getWalletStakingInfoFromChain,
  checkDiscrepancies,
  runSyncCheck
} = require('../utils/staking-helpers/sync-utilities');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Program ID - Make sure this matches your actual program ID
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;

// Test parameters
const TEST_MINT_ADDRESS = process.env.TEST_MINT_ADDRESS; // Set this to a known staked NFT mint
const TEST_WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS; // Set this to a known wallet with staked NFTs

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Run a single test with formatted output
 * @param {string} testName - Name of the test
 * @param {function} testFn - Test function to run
 */
async function runTest(testName, testFn) {
  process.stdout.write(`${colors.bright}Running test: ${colors.blue}${testName}${colors.reset} ... `);
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
 * Test connection to blockchain
 */
async function testBlockchainConnection() {
  const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
  const version = await connection.getVersion();
  console.log(`  Solana version: ${colors.cyan}${version['solana-core']}${colors.reset}`);
  
  // Get program accounts
  const programId = new PublicKey(PROGRAM_ID);
  const programAccounts = await connection.getProgramAccounts(
    programId, 
    { limit: 10 }
  );
  
  if (!programAccounts || programAccounts.length === 0) {
    throw new Error('No program accounts found. Check your program ID.');
  }
  
  console.log(`  Found ${colors.cyan}${programAccounts.length}${colors.reset} program accounts`);
  
  return true;
}

/**
 * Test getting stake info for a specific NFT
 */
async function testGetStakeInfo() {
  if (!TEST_MINT_ADDRESS) {
    console.log(`  ${colors.yellow}Skipping: TEST_MINT_ADDRESS not set in environment${colors.reset}`);
    return true;
  }
  
  const mintPubkey = new PublicKey(TEST_MINT_ADDRESS);
  const stakeInfo = await getStakeInfoFromChain(mintPubkey);
  
  if (!stakeInfo) {
    throw new Error('No stake info found for test mint address');
  }
  
  console.log(`  NFT: ${colors.cyan}${stakeInfo.nftMint}${colors.reset}`);
  console.log(`  Owner: ${colors.cyan}${stakeInfo.owner}${colors.reset}`);
  console.log(`  Staked at: ${colors.cyan}${stakeInfo.stakedAt.toISOString()}${colors.reset}`);
  console.log(`  Is unstaked: ${colors.cyan}${stakeInfo.isUnstaked}${colors.reset}`);
  
  return stakeInfo;
}

/**
 * Test getting wallet staking info
 */
async function testGetWalletStakingInfo() {
  if (!TEST_WALLET_ADDRESS) {
    console.log(`  ${colors.yellow}Skipping: TEST_WALLET_ADDRESS not set in environment${colors.reset}`);
    return true;
  }
  
  const walletPubkey = new PublicKey(TEST_WALLET_ADDRESS);
  const { stakes } = await getWalletStakingInfoFromChain(walletPubkey);
  
  console.log(`  Found ${colors.cyan}${stakes.length}${colors.reset} staked NFTs for wallet`);
  
  if (stakes.length > 0) {
    console.log(`  First staked NFT: ${colors.cyan}${stakes[0].nftMint}${colors.reset}`);
  }
  
  return stakes;
}

/**
 * Test checking discrepancies between blockchain and database
 */
async function testCheckDiscrepancies() {
  const result = await checkDiscrepancies();
  
  console.log(`  Total checked: ${colors.cyan}${result.totalChecked}${colors.reset}`);
  console.log(`  Missing in database: ${colors.cyan}${result.missingInDatabase.length}${colors.reset}`);
  console.log(`  Missing on chain: ${colors.cyan}${result.missingOnChain.length}${colors.reset}`);
  console.log(`  Missing image URL: ${colors.cyan}${result.imageUrlMissing.length}${colors.reset}`);
  console.log(`  Total discrepancies: ${colors.cyan}${result.discrepancies.length}${colors.reset}`);
  
  return result;
}

/**
 * Test database connection and queries
 */
async function testDatabaseConnection() {
  const { data, error } = await supabase.from('nft_staking').select('count(*)', { count: 'exact' });
  
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  const count = data ? data[0]?.count : 0;
  console.log(`  Database connection successful. Found ${colors.cyan}${count}${colors.reset} staking records`);
  
  return true;
}

/**
 * Test the full synchronization process with limited scope
 */
async function testRunSyncCheck() {
  const result = await runSyncCheck({
    limit: 5,
    fixMissingRecords: false, // Don't actually modify the database
    updateMetadata: false,
    walletAddress: TEST_WALLET_ADDRESS || null
  });
  
  console.log(`  Sync check completed in ${colors.cyan}${result.elapsedMs}ms${colors.reset}`);
  if (result.results) {
    console.log(`  Checked: ${colors.cyan}${result.results.checked}${colors.reset}`);
    console.log(`  Updated: ${colors.cyan}${result.results.updated}${colors.reset}`);
    console.log(`  Errors: ${colors.cyan}${result.results.errors}${colors.reset}`);
  }
  
  return result;
}

/**
 * Run selected tests in sequence
 * @param {string[]} testsToRun - Array of test function names to run
 * @returns {Object} Test results summary
 */
async function runSelectedTests(testsToRun = []) {
  console.log(`\n${colors.bright}${colors.magenta}=== Staking Synchronization System Tests ===${colors.reset}\n`);
  
  const testFunctions = {
    testBlockchainConnection,
    testDatabaseConnection,
    testGetStakeInfo,
    testGetWalletStakingInfo,
    testCheckDiscrepancies,
    testRunSyncCheck
  };
  
  // If no tests specified, run all
  if (testsToRun.length === 0) {
    testsToRun = Object.keys(testFunctions);
  }
  
  // Track results
  const results = {
    total: testsToRun.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    results: []
  };
  
  // Run each test
  for (const testName of testsToRun) {
    if (testFunctions[testName]) {
      try {
        const testResult = await runTest(formatTestName(testName), testFunctions[testName]);
        
        if (testResult === null) {
          // Test was skipped
          results.skipped++;
          results.results.push({
            name: testName,
            skipped: true,
            success: false
          });
        } else if (testResult === false || testResult instanceof Error) {
          // Test failed
          results.failed++;
          results.results.push({
            name: testName,
            success: false,
            error: testResult instanceof Error ? testResult.message : 'Test failed'
          });
        } else {
          // Test passed
          results.passed++;
          results.results.push({
            name: testName,
            success: true,
            details: typeof testResult === 'object' ? testResult : null
          });
        }
      } catch (error) {
        results.failed++;
        results.results.push({
          name: testName,
          success: false,
          error: error.message
        });
      }
    } else {
      console.log(`${colors.yellow}Unknown test: ${testName}${colors.reset}`);
      results.skipped++;
      results.results.push({
        name: testName,
        skipped: true,
        success: false,
        error: 'Unknown test'
      });
    }
  }
  
  console.log(`\n${colors.bright}${colors.magenta}=== Tests Completed ===${colors.reset}\n`);
  
  return results;
}

/**
 * Format test name for display
 * @param {string} testName - Test function name
 * @returns {string} Formatted test name
 */
function formatTestName(testName) {
  return testName
    .replace(/^test/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  return runSelectedTests();
}

// Only run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error(`${colors.red}Fatal error:${colors.reset}`, err);
      process.exit(1);
    });
}

// Export test functions and utilities
module.exports = {
  colors,
  runTest,
  runSelectedTests,
  runAllTests,
  testBlockchainConnection,
  testDatabaseConnection,
  testGetStakeInfo,
  testGetWalletStakingInfo,
  testCheckDiscrepancies,
  testRunSyncCheck
};