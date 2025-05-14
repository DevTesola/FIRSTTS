/**
 * Account Initialization Test Script
 * 
 * This script tests the account initialization process for NFT staking
 * It simulates the complete flow of account verification and initialization
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_WALLET_PATH = path.resolve(__dirname, '../mintWallet.json');

// Keypair for testing (optional)
let testWallet;
try {
  const walletData = JSON.parse(fs.readFileSync(TEST_WALLET_PATH, 'utf8'));
  testWallet = Keypair.fromSecretKey(Uint8Array.from(walletData));
} catch (error) {
  console.warn('Warning: Test wallet not found. Only read operations will be available.');
  testWallet = Keypair.generate(); // Dummy wallet for read-only operations
}

// Test parameters
const TEST_NFT_MINT = process.env.TEST_NFT_MINT; // Set this to a real NFT mint for testing

/**
 * Runs the comprehensive account initialization test
 */
async function runAccountInitTest() {
  console.log('===============================================');
  console.log('TESOLA NFT STAKING ACCOUNT INITIALIZATION TEST');
  console.log('===============================================');
  console.log('RPC Endpoint:', SOLANA_RPC_ENDPOINT);
  console.log('Test wallet:', testWallet.publicKey.toString());
  console.log('Test NFT mint:', TEST_NFT_MINT || 'Not specified');
  console.log('-----------------------------------------------');
  
  if (!TEST_NFT_MINT) {
    console.error('ERROR: TEST_NFT_MINT environment variable must be set');
    process.exit(1);
  }
  
  // 1. Connect to Solana
  console.log('Connecting to Solana...');
  const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
  
  // 2. Verify connection
  try {
    const version = await connection.getVersion();
    console.log('Connection successful. Solana version:', version);
  } catch (error) {
    console.error('Failed to connect to Solana:', error);
    process.exit(1);
  }
  
  // 3. Run diagnostic test
  console.log('\nRunning account diagnostics...');
  try {
    const diagnosticResponse = await fetch(`${API_BASE_URL}/staking/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: testWallet.publicKey.toString(),
        mintAddress: TEST_NFT_MINT
      }),
    });
    
    if (!diagnosticResponse.ok) {
      throw new Error(`API error: ${diagnosticResponse.statusText}`);
    }
    
    const diagnosticData = await diagnosticResponse.json();
    
    if (!diagnosticData.success) {
      throw new Error(`Diagnostic failed: ${diagnosticData.error}`);
    }
    
    // Log diagnostic results
    const accountReadiness = diagnosticData.data.accountReadiness;
    console.log('Diagnostic results:');
    console.log('- User token account:', accountReadiness.userTokenAccount.isValid ? 'Valid' : 'Invalid');
    console.log('- User staking info:', accountReadiness.userStakingInfo.exists ? 'Exists' : 'Missing');
    console.log('- Escrow token account:', accountReadiness.escrowTokenAccount.exists ? 'Exists' : 'Missing');
    console.log('- Ready for staking:', accountReadiness.readyForStaking ? 'Yes' : 'No');
    
    // 4. Get PDAs and accounts for reference
    const mintPubkey = new PublicKey(TEST_NFT_MINT);
    const walletPubkey = testWallet.publicKey;
    
    // Manually derive token account for comparison
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    console.log('\nAccount addresses:');
    console.log('- API reported user token account:', diagnosticData.data.userTokenAccount);
    console.log('- Locally derived user token account:', userTokenAccount.toString());
    console.log('- User staking info:', diagnosticData.data.userStakingInfo);
    
    // 5. Try preparing staking transaction
    console.log('\nPreparing staking transaction...');
    const stakingPrepResponse = await fetch(`${API_BASE_URL}/staking/prepareStaking-anchor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: testWallet.publicKey.toString(),
        mintAddress: TEST_NFT_MINT,
        stakingPeriod: 30,  // 30 days
        skipAccountValidation: true  // For testing purposes
      }),
    });
    
    if (!stakingPrepResponse.ok) {
      throw new Error(`API error: ${stakingPrepResponse.statusText}`);
    }
    
    const stakingPrepData = await stakingPrepResponse.json();
    
    if (!stakingPrepData.success) {
      throw new Error(`Staking preparation failed: ${stakingPrepData.error}`);
    }
    
    console.log('Staking transaction preparation successful');
    console.log('Transaction phases required:');
    console.log('- Token account initialization:', stakingPrepData.data.accountsNeedingInitialization.userTokenAccount || 
                                                stakingPrepData.data.accountsNeedingInitialization.escrowTokenAccount ? 'Yes' : 'No');
    console.log('- User staking info initialization:', stakingPrepData.data.accountsNeedingInitialization.userStakingInfo ? 'Yes' : 'No');
    console.log('- Main staking transaction available:', stakingPrepData.data.transactions.phase3 ? 'Yes' : 'No');
    
    // 6. Summarize results
    console.log('\n-----------------------------------------------');
    console.log('TEST RESULTS:');
    if (accountReadiness.readyForStaking) {
      console.log('✅ All accounts are properly initialized and ready for staking');
    } else {
      console.log('⚠️ Some accounts need initialization:');
      if (!accountReadiness.userTokenAccount.isValid) {
        console.log('  - User token account needs initialization');
      }
      if (!accountReadiness.userStakingInfo.exists) {
        console.log('  - User staking info needs initialization');
      }
      if (!accountReadiness.escrowTokenAccount.exists) {
        console.log('  - Escrow token account needs initialization');
      }
    }
    
    console.log('\nNOTE: To fully test account initialization:');
    console.log('1. Use the TokenAccountInitializer component in the frontend');
    console.log('2. Or implement the three-phase transaction flow as described in the guide');
    console.log('-----------------------------------------------');
    
  } catch (error) {
    console.error('\nTest failed:', error);
  }
}

// Run the test
runAccountInitTest().catch(console.error);