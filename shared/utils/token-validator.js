/**
 * NFT Token Account Validation Utilities
 * 
 * This module provides robust token account validation functions to ensure
 * proper account state before NFT staking operations.
 */

import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

/**
 * Comprehensive token account validation
 * 
 * @param {Object} connection - Solana connection instance
 * @param {PublicKey} walletPubkey - Wallet public key
 * @param {PublicKey} mintPubkey - NFT mint public key
 * @returns {Promise<Object>} Validation result with detailed diagnostics
 */
export async function validateTokenAccount(connection, walletPubkey, mintPubkey) {
  try {
    // Find the expected ATA address
    const expectedAta = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey,
      false // allowOwnerOffCurve = false
    );

    // Check owner's token accounts for this mint
    const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
      mint: mintPubkey
    });

    // Validation result structure
    const result = {
      isValid: false,
      userTokenAccount: expectedAta,
      validTokenAccount: null,
      accountExists: false,
      hasToken: false,
      hasCorrectOwner: false,
      hasCorrectMint: false,
      hasProperSize: false,
      hasSufficientBalance: false,
      tokenAmount: 0,
      diagnosticInfo: {
        tokenAccountsFound: tokenAccounts.value.length,
        expectedAtaAddress: expectedAta.toString(),
        accounts: [],
        errorMessage: null
      }
    };

    // Basic validation: user has token accounts for this mint
    if (tokenAccounts.value.length === 0) {
      result.diagnosticInfo.errorMessage = "No token accounts found for this NFT";
      return result;
    }

    // Map tokens accounts with their token amounts
    const accounts = [];
    let bestAccount = null;
    let maxAmount = 0n;

    for (const account of tokenAccounts.value) {
      const accountInfo = account.account.data;
      const amount = accountInfo.readBigUInt64LE(64);
      const address = account.pubkey.toString();
      
      accounts.push({
        address,
        amount: amount.toString(),
        isAta: address === expectedAta.toString()
      });
      
      // Keep track of account with highest balance
      if (amount > maxAmount) {
        maxAmount = amount;
        bestAccount = account.pubkey;
        result.tokenAmount = Number(amount);
      }
    }
    
    result.diagnosticInfo.accounts = accounts;

    // At least one account contains a token
    result.hasToken = maxAmount > 0n;
    if (result.hasToken) {
      result.validTokenAccount = bestAccount;
    }

    // Enhanced validation of specific token account
    const accountToValidate = bestAccount || expectedAta;
    const accountInfo = await connection.getAccountInfo(accountToValidate);
    
    // Does the account exist?
    result.accountExists = !!accountInfo;
    
    if (result.accountExists) {
      // Check account data size
      result.hasProperSize = accountInfo.data.length >= 165;
      
      try {
        // Get parsed account info
        const parsedInfo = await connection.getParsedAccountInfo(accountToValidate);
        const tokenData = parsedInfo.value?.data?.parsed?.info;
        
        if (tokenData) {
          const tokenOwner = tokenData.owner;
          const tokenMint = tokenData.mint;
          
          // Verify owner
          result.hasCorrectOwner = tokenOwner === walletPubkey.toString();
          
          // Verify mint
          result.hasCorrectMint = tokenMint === mintPubkey.toString();
          
          // Check balance (should be at least 1 for NFTs)
          const balanceAmount = tokenData.tokenAmount?.uiAmount || 0;
          result.hasSufficientBalance = balanceAmount >= 1;
          
          // Add to diagnostic info
          result.diagnosticInfo.parsedAccountInfo = {
            owner: tokenOwner,
            mint: tokenMint,
            balance: balanceAmount
          };
        }
      } catch (error) {
        result.diagnosticInfo.parseError = error.message;
      }
    }

    // Final validity determination
    result.isValid = result.accountExists && 
                     result.hasProperSize && 
                     result.hasCorrectOwner && 
                     result.hasCorrectMint && 
                     result.hasSufficientBalance;
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      userTokenAccount: null,
      validTokenAccount: null,
      diagnosticInfo: {
        error: error.message,
        stack: error.stack
      }
    };
  }
}

/**
 * Check if a token account needs reinitialization
 * 
 * @param {Object} validationResult - Result from validateTokenAccount
 * @returns {Object} Information about reinitialization need
 */
export function checkReinitializationNeeded(validationResult) {
  // Account doesn't exist - needs initialization
  if (!validationResult.accountExists) {
    return {
      needsInitialization: true,
      reason: "TOKEN_ACCOUNT_MISSING",
      message: "Token account does not exist and needs to be created"
    };
  }
  
  // Account exists but doesn't have proper data size
  if (!validationResult.hasProperSize) {
    return {
      needsInitialization: true,
      reason: "INVALID_ACCOUNT_SIZE",
      message: "Token account exists but is not properly initialized (incorrect data size)"
    };
  }
  
  // Account exists but has incorrect owner
  if (!validationResult.hasCorrectOwner) {
    return {
      needsInitialization: true,
      reason: "INCORRECT_OWNER",
      message: "Token account exists but is owned by a different wallet"
    };
  }
  
  // Account exists but has incorrect mint
  if (!validationResult.hasCorrectMint) {
    return {
      needsInitialization: true,
      reason: "INCORRECT_MINT",
      message: "Token account exists but is associated with a different NFT"
    };
  }
  
  // Account exists but has no tokens
  if (!validationResult.hasSufficientBalance) {
    return {
      needsInitialization: false, // No need to reinitialize, but should show error
      reason: "INSUFFICIENT_BALANCE",
      message: "Token account is properly initialized but contains no tokens"
    };
  }
  
  // Account is valid
  return {
    needsInitialization: false,
    reason: "ACCOUNT_VALID",
    message: "Token account is properly initialized and ready for staking"
  };
}