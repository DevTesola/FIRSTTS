/**
 * Test script for NFT staking escrow account IllegalOwner fix
 * Tests the escrow account initialization and staking process with the v4 API
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// RPC endpoint 
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// Test wallet (for read-only operations)
const TEST_WALLET = process.env.TEST_WALLET_ADDRESS || Keypair.generate().publicKey.toString();

// Test NFT mint address (should be a real mint on the network you're testing)
const TEST_NFT_MINT = process.env.TEST_NFT_MINT_ADDRESS || '';

// Staking period for testing
const TEST_STAKING_PERIOD = 30;

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting NFT staking escrow account fix test...');
  console.log('----------------------------------------');
  console.log(`Using RPC endpoint: ${SOLANA_RPC_ENDPOINT}`);
  console.log(`Test wallet: ${TEST_WALLET}`);
  console.log('----------------------------------------');

  try {
    // Initialize Solana connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Step 1: Check if we have a test NFT
    if (!TEST_NFT_MINT) {
      console.log('⚠️ No test NFT mint address provided. Skipping actual account testing.');
      console.log('This test will only check API response format.');
    } else {
      console.log(`Using test NFT mint: ${TEST_NFT_MINT}`);
      
      try {
        // Verify the mint account exists
        const mintInfo = await connection.getAccountInfo(new PublicKey(TEST_NFT_MINT));
        if (mintInfo) {
          console.log('✅ Test NFT mint account exists');
        } else {
          console.log('❌ Test NFT mint account not found!');
        }
      } catch (err) {
        console.error('❌ Error checking NFT mint:', err);
      }
    }
    
    // Step 2: Test the prepareStaking-anchor-fixed API
    console.log('\nTesting prepareStaking-anchor-fixed API...');
    
    try {
      const prepareResponse = await fetch(`http://localhost:3000/api/staking/prepareStaking-anchor-fixed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: TEST_WALLET,
          mintAddress: TEST_NFT_MINT || 'DummyMintAddressForTesting' + Math.random().toString(36).substring(2, 15),
          stakingPeriod: TEST_STAKING_PERIOD,
          nftTier: 'COMMON',
          nftName: 'Test NFT'
        })
      });
      
      const responseData = await prepareResponse.json();
      
      if (prepareResponse.ok) {
        console.log('✅ API request successful');
        
        // Check API version
        const apiVersion = responseData.data?.apiVersion;
        console.log(`API version: ${apiVersion}`);
        
        if (apiVersion === 'anchor-fixed-v4') {
          console.log('✅ Using the correct fixed API version (v4)');
        } else {
          console.log('❌ Not using the v4 API version!');
        }
        
        // Check transaction data
        if (responseData.data?.transactions) {
          console.log('✅ Transactions data exists');
          
          // Log the required phases
          const requiredPhases = responseData.data.requiredPhases;
          console.log('Required phases:', requiredPhases);
          
          // Check account initialization status
          const accountInitialization = responseData.data.accountInitialization;
          console.log('Account initialization status:', accountInitialization);
          
          // Check escrow account address
          const escrowTokenAccount = responseData.data.accounts?.escrowTokenAccount;
          if (escrowTokenAccount) {
            console.log('✅ Escrow token account address present:', escrowTokenAccount);
          }
        } else {
          console.log('❌ Transactions data missing!');
        }
        
        // Save the response to a file for inspection
        const outputDir = path.join(__dirname, 'outputs');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(outputDir, 'staking-prepare-response.json'), 
          JSON.stringify(responseData, null, 2)
        );
        console.log('Response data saved to tests/outputs/staking-prepare-response.json');
        
      } else {
        console.log('❌ API request failed:', responseData.message || 'Unknown error');
      }
    } catch (err) {
      console.error('❌ Error testing prepare API:', err);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
  
  console.log('\nTest completed.');
}

// Run the tests
runTests().catch(console.error);