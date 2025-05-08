/**
 * Performance Tests for Staking Synchronization System
 * Tests performance under load and measures execution times
 */

const { 
  getStakeInfoFromChain,
  getWalletStakingInfoFromChain,
  checkDiscrepancies,
  syncNFT,
  syncWalletNFTs,
  runSyncCheck
} = require('../utils/staking-helpers/sync-utilities');
const colors = require('./sync-system-test').colors;
require('dotenv').config();

// Test performance measurement class
class PerformanceTest {
  constructor(name, iterations = 1) {
    this.name = name;
    this.iterations = iterations;
    this.results = [];
  }
  
  async run(fn, ...args) {
    console.log(`${colors.bright}Running performance test: ${colors.blue}${this.name}${colors.reset}`);
    console.log(`  Iterations: ${this.iterations}`);
    
    let totalDuration = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < this.iterations; i++) {
      try {
        const startTime = Date.now();
        const result = await fn(...args);
        const duration = Date.now() - startTime;
        
        this.results.push({
          iteration: i + 1,
          duration,
          success: true,
          result
        });
        
        totalDuration += duration;
        successCount++;
        
        if (this.iterations <= 5 || (i + 1) % Math.ceil(this.iterations / 5) === 0) {
          console.log(`  Iteration ${i + 1}/${this.iterations}: ${duration}ms`);
        }
      } catch (error) {
        errorCount++;
        this.results.push({
          iteration: i + 1,
          success: false,
          error: error.message
        });
        
        console.error(`  ${colors.red}Error in iteration ${i + 1}:${colors.reset} ${error.message}`);
      }
    }
    
    // Calculate statistics
    const durations = this.results.filter(r => r.success).map(r => r.duration);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    
    const stats = {
      totalIterations: this.iterations,
      successCount,
      errorCount,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration
    };
    
    console.log(`\n${colors.bright}Performance Test Results: ${this.name}${colors.reset}`);
    console.log(`  Total Iterations: ${stats.totalIterations}`);
    console.log(`  Successful: ${colors.green}${stats.successCount}${colors.reset}`);
    console.log(`  Errors: ${stats.errorCount > 0 ? colors.red : colors.green}${stats.errorCount}${colors.reset}`);
    console.log(`  Avg Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Min Duration: ${minDuration}ms`);
    console.log(`  Max Duration: ${maxDuration}ms`);
    console.log(`  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)\n`);
    
    return stats;
  }
}

/**
 * Test getStakeInfoFromChain performance
 */
async function testGetStakeInfoPerformance() {
  if (!process.env.TEST_MINT_ADDRESS) {
    console.log(`${colors.yellow}Skipping: TEST_MINT_ADDRESS not set${colors.reset}`);
    return null;
  }
  
  const mintAddress = process.env.TEST_MINT_ADDRESS;
  const test = new PerformanceTest('getStakeInfoFromChain', 10);
  
  return test.run(getStakeInfoFromChain, mintAddress);
}

/**
 * Test getWalletStakingInfoFromChain performance
 */
async function testGetWalletStakingInfoPerformance() {
  if (!process.env.TEST_WALLET_ADDRESS) {
    console.log(`${colors.yellow}Skipping: TEST_WALLET_ADDRESS not set${colors.reset}`);
    return null;
  }
  
  const walletAddress = process.env.TEST_WALLET_ADDRESS;
  const test = new PerformanceTest('getWalletStakingInfoFromChain', 5);
  
  return test.run(getWalletStakingInfoFromChain, walletAddress);
}

/**
 * Test checkDiscrepancies performance
 */
async function testCheckDiscrepanciesPerformance() {
  const test = new PerformanceTest('checkDiscrepancies', 3);
  
  return test.run(checkDiscrepancies);
}

/**
 * Test syncNFT performance
 */
async function testSyncNFTPerformance() {
  if (!process.env.TEST_MINT_ADDRESS) {
    console.log(`${colors.yellow}Skipping: TEST_MINT_ADDRESS not set${colors.reset}`);
    return null;
  }
  
  const mintAddress = process.env.TEST_MINT_ADDRESS;
  const test = new PerformanceTest('syncNFT', 5);
  
  return test.run(syncNFT, mintAddress);
}

/**
 * Test syncWalletNFTs performance
 */
async function testSyncWalletNFTsPerformance() {
  if (!process.env.TEST_WALLET_ADDRESS) {
    console.log(`${colors.yellow}Skipping: TEST_WALLET_ADDRESS not set${colors.reset}`);
    return null;
  }
  
  const walletAddress = process.env.TEST_WALLET_ADDRESS;
  const test = new PerformanceTest('syncWalletNFTs', 3);
  
  return test.run(syncWalletNFTs, walletAddress);
}

/**
 * Test runSyncCheck performance
 */
async function testRunSyncCheckPerformance() {
  const test = new PerformanceTest('runSyncCheck', 2);
  
  return test.run(runSyncCheck, {
    limit: 5,
    fixMissingRecords: false,
    updateMetadata: false
  });
}

/**
 * Run all performance tests
 */
async function runPerformanceTests() {
  console.log(`\n${colors.bright}${colors.magenta}=== Staking Synchronization Performance Tests ===${colors.reset}\n`);
  
  const results = {
    getStakeInfo: await testGetStakeInfoPerformance(),
    getWalletStakingInfo: await testGetWalletStakingInfoPerformance(),
    checkDiscrepancies: await testCheckDiscrepanciesPerformance(),
    syncNFT: await testSyncNFTPerformance(),
    syncWalletNFTs: await testSyncWalletNFTsPerformance(),
    runSyncCheck: await testRunSyncCheckPerformance()
  };
  
  // Print summary
  console.log(`\n${colors.bright}${colors.magenta}=== Performance Tests Summary ===${colors.reset}\n`);
  console.log(`${colors.bright}Function${colors.reset}\t\t\t${colors.bright}Avg Time${colors.reset}\t${colors.bright}Min Time${colors.reset}\t${colors.bright}Max Time${colors.reset}`);
  console.log(`---------------------------------------------------`);
  
  for (const [name, stats] of Object.entries(results)) {
    if (stats) {
      console.log(`${name.padEnd(30)}\t${stats.avgDuration.toFixed(2)}ms\t${stats.minDuration}ms\t${stats.maxDuration}ms`);
    } else {
      console.log(`${name.padEnd(30)}\t${colors.yellow}Skipped${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.bright}${colors.magenta}=== Performance Tests Completed ===${colors.reset}\n`);
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runPerformanceTests()
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
  PerformanceTest,
  runPerformanceTests,
  testGetStakeInfoPerformance,
  testGetWalletStakingInfoPerformance,
  testCheckDiscrepanciesPerformance,
  testSyncNFTPerformance,
  testSyncWalletNFTsPerformance,
  testRunSyncCheckPerformance
};