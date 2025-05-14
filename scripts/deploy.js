#!/usr/bin/env node

/**
 * TESOLA Deployment Script
 * Automates the deployment process for the TESOLA NFT and Staking systems
 * 
 * Usage: node scripts/deploy.js [options]
 * Options:
 *   --env=<environment>  Specify deployment environment (dev, staging, prod)
 *   --skip-tests         Skip running tests before deployment
 *   --skip-build         Skip build step
 *   --dry-run            Simulate deployment without actually deploying
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  env: 'dev', // Default environment
  skipTests: args.includes('--skip-tests'),
  skipBuild: args.includes('--skip-build'),
  dryRun: args.includes('--dry-run')
};

// Parse environment option
const envArg = args.find(arg => arg.startsWith('--env='));
if (envArg) {
  options.env = envArg.split('=')[1];
}

// Validate environment
const validEnvs = ['dev', 'staging', 'prod'];
if (!validEnvs.includes(options.env)) {
  console.error(`${colors.red}Error: Invalid environment '${options.env}'. Must be one of: ${validEnvs.join(', ')}${colors.reset}`);
  process.exit(1);
}

// Configuration for different environments
const envConfig = {
  dev: {
    name: 'Development',
    url: 'https://dev.tesola.example.com',
    buildCommand: 'npm run build',
    deployCommand: options.dryRun ? 'echo "Would deploy to development environment"' : 'vercel --prod',
    envFile: '.env.development'
  },
  staging: {
    name: 'Staging',
    url: 'https://staging.tesola.example.com',
    buildCommand: 'NODE_ENV=staging npm run build',
    deployCommand: options.dryRun ? 'echo "Would deploy to staging environment"' : 'vercel --prod --scope staging',
    envFile: '.env.staging'
  },
  prod: {
    name: 'Production',
    url: 'https://tesola.example.com',
    buildCommand: 'NODE_ENV=production npm run build',
    deployCommand: options.dryRun ? 'echo "Would deploy to production environment"' : 'vercel --prod --scope production',
    envFile: '.env.production'
  }
};

// Get configuration for selected environment
const config = envConfig[options.env];

// Prepare deployment log
const logDir = path.join(__dirname, '../deployment-logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logDir, `deploy-${options.env}-${timestamp}.log`);

// Helper function to log messages to console and log file
function log(message, consoleOnly = false) {
  console.log(message);
  if (!consoleOnly) {
    fs.appendFileSync(logFile, message.replace(/\x1b\[[0-9;]*m/g, '') + '\n');
  }
}

// Helper function to run commands and log output
function runCommand(command, ignoreError = false) {
  log(`${colors.bright}> ${command}${colors.reset}`, true);
  
  try {
    const output = execSync(command, { stdio: 'pipe' }).toString();
    log(output);
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}Command failed: ${error.message}${colors.reset}`);
    log(error.stdout?.toString() || '');
    log(error.stderr?.toString() || '');
    
    if (!ignoreError) {
      log(`${colors.red}Deployment aborted due to command failure${colors.reset}`);
      process.exit(1);
    }
    
    return { success: false, error };
  }
}

// Start deployment process
log(`${colors.bright}${colors.magenta}====================================${colors.reset}`);
log(`${colors.bright}${colors.magenta}  TESOLA Deployment Script${colors.reset}`);
log(`${colors.bright}${colors.magenta}====================================${colors.reset}`);
log('');
log(`Timestamp: ${timestamp}`);
log(`Environment: ${colors.green}${config.name}${colors.reset} (${options.env})`);
log(`Target URL: ${config.url}`);
log(`Dry run: ${options.dryRun ? colors.yellow + 'Yes' : colors.green + 'No'}${colors.reset}`);
log(`Skip tests: ${options.skipTests ? colors.yellow + 'Yes' : colors.green + 'No'}${colors.reset}`);
log(`Skip build: ${options.skipBuild ? colors.yellow + 'Yes' : colors.green + 'No'}${colors.reset}`);
log('');

// Start timing
const startTime = performance.now();

// Check if environment file exists
if (fs.existsSync(config.envFile)) {
  log(`${colors.green}Found environment file: ${config.envFile}${colors.reset}`);
} else {
  log(`${colors.yellow}Warning: Environment file ${config.envFile} not found${colors.reset}`);
}

// Run tests if not skipped
if (!options.skipTests) {
  log(`${colors.bright}${colors.blue}=== Running Tests ===${colors.reset}`);
  log('');
  
  runCommand('node scripts/run-all-tests.js --quick');
  log('');
} else {
  log(`${colors.yellow}Skipping tests as requested${colors.reset}`);
  log('');
}

// Build the project if not skipped
if (!options.skipBuild) {
  log(`${colors.bright}${colors.blue}=== Building Project ===${colors.reset}`);
  log('');
  
  runCommand(config.buildCommand);
  log('');
} else {
  log(`${colors.yellow}Skipping build as requested${colors.reset}`);
  log('');
}

// Deploy to specified environment
log(`${colors.bright}${colors.blue}=== Deploying to ${config.name} ===${colors.reset}`);
log('');

runCommand(config.deployCommand);
log('');

// Calculate elapsed time
const endTime = performance.now();
const elapsedTime = (endTime - startTime) / 1000;

// Deployment summary
log(`${colors.bright}${colors.blue}=== Deployment Summary ===${colors.reset}`);
log('');
log(`Environment: ${colors.green}${config.name}${colors.reset}`);
log(`Target URL: ${config.url}`);
log(`Elapsed time: ${elapsedTime.toFixed(2)} seconds`);
log('');
log(`${colors.bright}${colors.green}Deployment completed successfully!${colors.reset}`);
log('');

// Instructions for verifying deployment
log(`${colors.bright}${colors.blue}=== Next Steps ===${colors.reset}`);
log('');
log(`1. Verify the deployment at: ${config.url}`);
log(`2. Check for any post-deployment tasks`);
log(`3. Monitor application logs for any issues`);
log('');

// Show log file location
log(`Deployment log saved to: ${logFile}`);
log('');

// Exit successfully
process.exit(0);