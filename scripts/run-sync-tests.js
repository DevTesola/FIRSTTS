#!/usr/bin/env node

/**
 * Staking Synchronization System Test Runner
 * This script runs the tests for the staking synchronization system
 * and generates a detailed report
 * 
 * Usage: node scripts/run-sync-tests.js [options]
 * Options:
 *   --quick         Run only basic tests
 *   --full          Run all tests including long operations
 *   --db-only       Run only database-related tests
 *   --chain-only    Run only blockchain-related tests
 *   --verbose       Show detailed logs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const testRunner = require('../tests/sync-system-test');
const colors = testRunner.colors;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  quick: args.includes('--quick'),
  full: args.includes('--full'),
  dbOnly: args.includes('--db-only'),
  chainOnly: args.includes('--chain-only'),
  verbose: args.includes('--verbose')
};

// Set up test report directory
const reportDir = path.join(__dirname, '../test-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportFile = path.join(reportDir, `sync-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);

// Print header
console.log(`\n${colors.bright}${colors.magenta}========================================${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}   TESOLA Staking Sync System Test Runner${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}========================================${colors.reset}\n`);

console.log(`${colors.bright}Running with options:${colors.reset}`);
for (const [key, value] of Object.entries(options)) {
  if (value) {
    console.log(`  - ${colors.cyan}${key}${colors.reset}`);
  }
}
console.log('');

// Show environment info
console.log(`${colors.bright}Environment:${colors.reset}`);
console.log(`  - ${colors.cyan}Node version:${colors.reset} ${process.version}`);
console.log(`  - ${colors.cyan}Environment:${colors.reset} ${process.env.NODE_ENV || 'not set'}`);

// Check necessary environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SOLANA_RPC_ENDPOINT',
  'NEXT_PUBLIC_PROGRAM_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.log(`\n${colors.red}Error: Missing required environment variables:${colors.reset}`);
  missingEnvVars.forEach(envVar => {
    console.log(`  - ${colors.red}${envVar}${colors.reset}`);
  });
  console.log(`\n${colors.yellow}Please set these variables in .env file or export them in your shell.${colors.reset}\n`);
  process.exit(1);
}

// Optional env vars for testing specific features
if (!process.env.TEST_MINT_ADDRESS) {
  console.log(`\n${colors.yellow}Warning: TEST_MINT_ADDRESS is not set.${colors.reset}`);
  console.log(`${colors.yellow}Some tests will be skipped or use random values.${colors.reset}\n`);
}

if (!process.env.TEST_WALLET_ADDRESS) {
  console.log(`\n${colors.yellow}Warning: TEST_WALLET_ADDRESS is not set.${colors.reset}`);
  console.log(`${colors.yellow}Some tests will be skipped or use random values.${colors.reset}\n`);
}

// Prepare to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const logs = [];

// Wrap console methods to capture logs if not in verbose mode
if (!options.verbose) {
  console.log = (...args) => {
    logs.push(['log', args.join(' ')]);
    if (args[0] && typeof args[0] === 'string' && args[0].includes('PASSED')) {
      originalConsoleLog(...args);
    }
  };
  
  console.error = (...args) => {
    logs.push(['error', args.join(' ')]);
    originalConsoleError(...args);
  };
  
  console.warn = (...args) => {
    logs.push(['warn', args.join(' ')]);
  };
}

// Create report header
const report = [
  '=====================================================',
  '  TESOLA Staking Synchronization System Test Report',
  '=====================================================',
  '',
  `Date: ${new Date().toISOString()}`,
  `Options: ${Object.entries(options).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'default'}`,
  '',
  '=====================================================',
  ''
];

// Run the tests
async function runTests() {
  try {
    const startTime = Date.now();
    
    // Allow filtering tests based on options
    const testsToRun = [];
    
    if (!options.dbOnly && !options.chainOnly) {
      testsToRun.push(
        'testBlockchainConnection',
        'testDatabaseConnection',
        'testGetStakeInfo',
        'testGetWalletStakingInfo',
        'testCheckDiscrepancies'
      );
      
      if (!options.quick) {
        testsToRun.push('testRunSyncCheck');
      }
    } else if (options.dbOnly) {
      testsToRun.push(
        'testDatabaseConnection',
        'testCheckDiscrepancies'
      );
    } else if (options.chainOnly) {
      testsToRun.push(
        'testBlockchainConnection',
        'testGetStakeInfo',
        'testGetWalletStakingInfo'
      );
    }
    
    // Run tests
    const testResults = await testRunner.runSelectedTests(testsToRun);
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    // Print summary
    console.log(`\n${colors.bright}${colors.magenta}=== Test Summary ===${colors.reset}\n`);
    console.log(`${colors.bright}Total tests:${colors.reset} ${testResults.total}`);
    console.log(`${colors.bright}Passed:${colors.reset} ${colors.green}${testResults.passed}${colors.reset}`);
    console.log(`${colors.bright}Failed:${colors.reset} ${colors.red}${testResults.failed}${colors.reset}`);
    console.log(`${colors.bright}Skipped:${colors.reset} ${colors.yellow}${testResults.skipped}${colors.reset}`);
    console.log(`${colors.bright}Execution time:${colors.reset} ${executionTime.toFixed(2)} seconds\n`);
    
    // Add test results to report
    report.push('Test Summary:');
    report.push(`Total tests: ${testResults.total}`);
    report.push(`Passed: ${testResults.passed}`);
    report.push(`Failed: ${testResults.failed}`);
    report.push(`Skipped: ${testResults.skipped}`);
    report.push(`Execution time: ${executionTime.toFixed(2)} seconds`);
    report.push('');
    
    // Add detailed test results to report
    report.push('Detailed Test Results:');
    report.push('======================');
    report.push('');
    
    testResults.results.forEach(result => {
      report.push(`Test: ${result.name}`);
      report.push(`Status: ${result.success ? 'PASSED' : result.skipped ? 'SKIPPED' : 'FAILED'}`);
      if (result.error) {
        report.push(`Error: ${result.error}`);
      }
      if (result.details) {
        report.push(`Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      report.push('');
    });
    
    // Add logs to report if needed
    if (logs.length > 0) {
      report.push('Logs:');
      report.push('=====');
      report.push('');
      
      logs.forEach(([type, message]) => {
        if (type === 'error') {
          report.push(`ERROR: ${message}`);
        } else if (type === 'warn') {
          report.push(`WARN: ${message}`);
        } else {
          report.push(message);
        }
      });
    }
    
    // Write report to file
    fs.writeFileSync(reportFile, report.join('\n'));
    console.log(`${colors.bright}Report written to:${colors.reset} ${colors.cyan}${reportFile}${colors.reset}\n`);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
    
    // Add error to report
    report.push('Fatal Error:');
    report.push(error.stack || error.message);
    
    // Write report to file
    fs.writeFileSync(reportFile, report.join('\n'));
    console.log(`${colors.bright}Report written to:${colors.reset} ${colors.cyan}${reportFile}${colors.reset}\n`);
    
    process.exit(1);
  }
}

// Run the tests
runTests();