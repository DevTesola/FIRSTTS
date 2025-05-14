#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests for the TESOLA NFT and Staking systems
 * 
 * Usage: node scripts/run-all-tests.js [options]
 * Options:
 *   --quick         Run only basic tests
 *   --full          Run all tests including performance tests
 *   --sync-only     Run only staking synchronization tests
 *   --mint-only     Run only NFT minting tests
 *   --perf          Include performance tests
 *   --edge          Include edge case tests
 *   --verbose       Show detailed logs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const colors = require('../tests/sync-system-test').colors;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  quick: args.includes('--quick'),
  full: args.includes('--full'),
  syncOnly: args.includes('--sync-only'),
  mintOnly: args.includes('--mint-only'),
  perf: args.includes('--perf') || args.includes('--full'),
  edge: args.includes('--edge') || args.includes('--full'),
  verbose: args.includes('--verbose')
};

// Prepare report directory
const reportDir = path.join(__dirname, '../test-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Generate timestamp for reports
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// Print header
console.log(`\n${colors.bright}${colors.magenta}===========================================${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}   TESOLA Comprehensive Test Runner${colors.reset}`);
console.log(`${colors.bright}${colors.magenta}===========================================${colors.reset}\n`);

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
console.log(`  - ${colors.cyan}Test reports:${colors.reset} ${reportDir}`);
console.log('');

// Run tests and collect results
const testResults = {
  sync: { passed: 0, failed: 0, skipped: 0 },
  edge: { passed: 0, failed: 0, skipped: 0 },
  perf: { passed: 0, failed: 0, skipped: 0 },
  mint: { passed: 0, failed: 0, skipped: 0 }
};

// Helper function to run tests and capture exit code
function runTest(command, args = []) {
  console.log(`\n${colors.bright}Running command:${colors.reset} ${command} ${args.join(' ')}\n`);
  
  try {
    // Combine command and args
    const fullCommand = `${command} ${args.join(' ')}`;
    
    // Add test report redirection if needed
    if (!options.verbose) {
      const reportFile = path.join(reportDir, `${command.split('/').pop()}-${timestamp}.log`);
      execSync(`${fullCommand} > "${reportFile}" 2>&1`, { stdio: 'inherit' });
      console.log(`\n${colors.bright}Test output saved to:${colors.reset} ${colors.cyan}${reportFile}${colors.reset}\n`);
    } else {
      execSync(fullCommand, { stdio: 'inherit' });
    }
    
    return 0; // Success
  } catch (error) {
    return error.status || 1; // Error code
  }
}

// Run sync system tests
if (!options.mintOnly) {
  console.log(`\n${colors.bright}${colors.magenta}=== Running Staking Synchronization Tests ===${colors.reset}\n`);
  
  // Basic sync tests
  const syncArgs = [];
  if (options.quick) syncArgs.push('--quick');
  if (options.verbose) syncArgs.push('--verbose');
  
  const syncExitCode = runTest('node', ['./scripts/run-sync-tests.js', ...syncArgs]);
  testResults.sync.passed = syncExitCode === 0 ? 1 : 0;
  testResults.sync.failed = syncExitCode !== 0 ? 1 : 0;
  
  // Edge case tests
  if (options.edge) {
    console.log(`\n${colors.bright}${colors.magenta}=== Running Edge Case Tests ===${colors.reset}\n`);
    
    const edgeExitCode = runTest('node', ['./tests/edge-case-tests.js']);
    testResults.edge.passed = edgeExitCode === 0 ? 1 : 0;
    testResults.edge.failed = edgeExitCode !== 0 ? 1 : 0;
  } else {
    testResults.edge.skipped = 1;
  }
  
  // Performance tests
  if (options.perf) {
    console.log(`\n${colors.bright}${colors.magenta}=== Running Performance Tests ===${colors.reset}\n`);
    
    const perfExitCode = runTest('node', ['./tests/performance-tests.js']);
    testResults.perf.passed = perfExitCode === 0 ? 1 : 0;
    testResults.perf.failed = perfExitCode !== 0 ? 1 : 0;
  } else {
    testResults.perf.skipped = 1;
  }
}

// Run NFT minting tests (use dummy test for now)
if (!options.syncOnly) {
  console.log(`\n${colors.bright}${colors.magenta}=== Running NFT Minting Tests ===${colors.reset}\n`);
  console.log(`${colors.yellow}NFT minting tests are skipped as they are not implemented yet.${colors.reset}\n`);
  testResults.mint.skipped = 1;
}

// Print summary
console.log(`\n${colors.bright}${colors.magenta}=== Test Summary ===${colors.reset}\n`);

const totalPassed = Object.values(testResults).reduce((sum, result) => sum + result.passed, 0);
const totalFailed = Object.values(testResults).reduce((sum, result) => sum + result.failed, 0);
const totalSkipped = Object.values(testResults).reduce((sum, result) => sum + result.skipped, 0);

console.log(`${colors.bright}Sync Tests:${colors.reset} ${testResults.sync.passed > 0 ? colors.green + 'PASSED' : testResults.sync.failed > 0 ? colors.red + 'FAILED' : colors.yellow + 'SKIPPED'}${colors.reset}`);
console.log(`${colors.bright}Edge Case Tests:${colors.reset} ${testResults.edge.passed > 0 ? colors.green + 'PASSED' : testResults.edge.failed > 0 ? colors.red + 'FAILED' : colors.yellow + 'SKIPPED'}${colors.reset}`);
console.log(`${colors.bright}Performance Tests:${colors.reset} ${testResults.perf.passed > 0 ? colors.green + 'PASSED' : testResults.perf.failed > 0 ? colors.red + 'FAILED' : colors.yellow + 'SKIPPED'}${colors.reset}`);
console.log(`${colors.bright}Minting Tests:${colors.reset} ${testResults.mint.passed > 0 ? colors.green + 'PASSED' : testResults.mint.failed > 0 ? colors.red + 'FAILED' : colors.yellow + 'SKIPPED'}${colors.reset}`);

console.log(`\n${colors.bright}Total Passed:${colors.reset} ${colors.green}${totalPassed}${colors.reset}`);
console.log(`${colors.bright}Total Failed:${colors.reset} ${totalFailed > 0 ? colors.red : colors.reset}${totalFailed}${colors.reset}`);
console.log(`${colors.bright}Total Skipped:${colors.reset} ${colors.yellow}${totalSkipped}${colors.reset}`);

console.log(`\n${colors.bright}${colors.magenta}=== Tests Completed ===${colors.reset}\n`);

// Exit with appropriate code
process.exit(totalFailed > 0 ? 1 : 0);