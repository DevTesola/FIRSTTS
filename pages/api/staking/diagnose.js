/**
 * Enhanced diagnostic API for token account status
 * Provides detailed information about token account and stake info accounts
 * Includes comprehensive validation and initialization recommendations
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createApiResponse } from '../../../shared';
import { PROGRAM_ID, STAKE_SEED } from '../../../utils/staking-helpers/constants';
import { validateTokenAccount, checkReinitializationNeeded } from '../../../shared/utils/token-validator';

// Environment variables
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only POST method is allowed')
    );
  }

  try {
    const { wallet, mintAddress } = req.body;
    
    if (!wallet || !mintAddress) {
      return res.status(400).json(
        createApiResponse(false, 'Wallet address and mint address are required', null, 'MissingParameters')
      );
    }
    
    let walletPubkey, mintPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json(
        createApiResponse(false, 'Invalid address format', null, err)
      );
    }
    
    console.log('Enhanced diagnostic API called for:', { wallet, mintAddress });
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Run comprehensive token account validation
    console.log('Running comprehensive token validation...');
    const validationResult = await validateTokenAccount(connection, walletPubkey, mintPubkey);
    console.log('Validation result:', JSON.stringify(validationResult, null, 2));
    
    // Determine if reinitialization is needed
    const reinitInfo = checkReinitializationNeeded(validationResult);
    
    // Continue with the existing diagnostic checks
    
    // 1. Check user token account details
    const userTokenAccount = validationResult.userTokenAccount || await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey,
      false
    );
    
    console.log('User token account address:', userTokenAccount.toString());
    
    let tokenAccountInfo;
    let tokenAccountExists = false;
    let tokenAccountData = null;
    
    try {
      // Get basic account info
      tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
      tokenAccountExists = !!tokenAccountInfo;
      
      if (tokenAccountExists) {
        // Get parsed account info for more details
        const parsedInfo = await connection.getParsedAccountInfo(userTokenAccount);
        
        // Try to get token balance
        let tokenBalance = null;
        try {
          const balanceResponse = await connection.getTokenAccountBalance(userTokenAccount);
          tokenBalance = balanceResponse.value;
        } catch (balanceErr) {
          console.error('Error getting token balance:', balanceErr);
        }
        
        tokenAccountData = {
          exists: true,
          address: userTokenAccount.toString(),
          owner: tokenAccountInfo.owner.toString(),
          lamports: tokenAccountInfo.lamports,
          dataSize: tokenAccountInfo.data.length,
          isExecutable: tokenAccountInfo.executable,
          rentEpoch: tokenAccountInfo.rentEpoch,
          parsed: parsedInfo.value?.data?.parsed?.info || null,
          balance: tokenBalance,
          isProperlyInitialized: tokenAccountInfo.data.length >= 165
        };
      } else {
        tokenAccountData = {
          exists: false,
          address: userTokenAccount.toString()
        };
      }
    } catch (err) {
      console.error('Error checking token account:', err);
      tokenAccountData = {
        exists: 'error',
        address: userTokenAccount.toString(),
        error: err.message
      };
    }
    
    // 2. Check stake info account
    const programPubkey = new PublicKey(PROGRAM_ID);
    
    // Derive stake info PDA
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
      programPubkey
    );
    
    console.log('Stake info PDA:', stakeInfoPDA.toString());
    
    let stakeInfoData = null;
    
    try {
      const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
      
      if (stakeInfoAccount) {
        stakeInfoData = {
          exists: true,
          address: stakeInfoPDA.toString(),
          owner: stakeInfoAccount.owner.toString(),
          lamports: stakeInfoAccount.lamports,
          dataSize: stakeInfoAccount.data.length,
          isOwnedByProgram: stakeInfoAccount.owner.equals(programPubkey),
          dataBuffer: Buffer.from(stakeInfoAccount.data).toString('hex').substring(0, 100) + '...'
        };
      } else {
        stakeInfoData = {
          exists: false,
          address: stakeInfoPDA.toString()
        };
      }
    } catch (err) {
      console.error('Error checking stake info:', err);
      stakeInfoData = {
        exists: 'error',
        address: stakeInfoPDA.toString(),
        error: err.message
      };
    }
    
    // 3. Get token accounts owned by the user
    let userTokenAccounts = [];
    
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );
      
      userTokenAccounts = tokenAccounts.value.map(account => ({
        pubkey: account.pubkey.toString(),
        mint: account.account.data.parsed.info.mint,
        owner: account.account.data.parsed.info.owner,
        tokenAmount: account.account.data.parsed.info.tokenAmount,
        isThisNft: account.account.data.parsed.info.mint === mintAddress
      }));
      
      // Sort to put the target NFT at the top
      userTokenAccounts.sort((a, b) => {
        if (a.isThisNft) return -1;
        if (b.isThisNft) return 1;
        return 0;
      });
    } catch (err) {
      console.error('Error fetching user token accounts:', err);
      userTokenAccounts = [{ error: err.message }];
    }

    // 4. Derive and check Escrow Authority PDA
    const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), mintPubkey.toBuffer()],
      programPubkey
    );

    console.log('Escrow Authority PDA:', escrowAuthorityPDA.toString());

    // 5. Get Escrow Token Account
    let escrowTokenAccount;
    let escrowTokenAccountData = null;

    try {
      escrowTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        escrowAuthorityPDA,
        true // allowOwnerOffCurve = true for PDAs
      );

      const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccount);
      
      if (escrowAccountInfo) {
        const parsedInfo = await connection.getParsedAccountInfo(escrowTokenAccount);
        
        escrowTokenAccountData = {
          exists: true,
          address: escrowTokenAccount.toString(),
          owner: escrowAccountInfo.owner.toString(),
          dataSize: escrowAccountInfo.data.length,
          parsed: parsedInfo.value?.data?.parsed?.info || null,
          isProperlyInitialized: escrowAccountInfo.data.length >= 165
        };
      } else {
        escrowTokenAccountData = {
          exists: false,
          address: escrowTokenAccount.toString()
        };
      }
    } catch (err) {
      console.error('Error checking escrow token account:', err);
      escrowTokenAccountData = {
        exists: 'error',
        address: escrowTokenAccount?.toString() || 'Error deriving escrow token account',
        error: err.message
      };
    }

    // 6. Derive and check User Staking Info PDA
    const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_staking"), walletPubkey.toBuffer()],
      programPubkey
    );

    console.log('User Staking Info PDA:', userStakingInfoPDA.toString());

    let userStakingInfoData = null;

    try {
      const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
      
      if (userStakingInfoAccount) {
        userStakingInfoData = {
          exists: true,
          address: userStakingInfoPDA.toString(),
          owner: userStakingInfoAccount.owner.toString(),
          dataSize: userStakingInfoAccount.data.length,
          isOwnedByProgram: userStakingInfoAccount.owner.equals(programPubkey),
        };
      } else {
        userStakingInfoData = {
          exists: false,
          address: userStakingInfoPDA.toString()
        };
      }
    } catch (err) {
      console.error('Error checking user staking info:', err);
      userStakingInfoData = {
        exists: 'error',
        address: userStakingInfoPDA.toString(),
        error: err.message
      };
    }

    // Create a summary of account readiness for staking
    const accountReadiness = {
      userTokenAccount: {
        exists: tokenAccountExists,
        isValid: validationResult.isValid,
        needsInit: reinitInfo.needsInitialization,
        reason: reinitInfo.reason,
        message: reinitInfo.message
      },
      userStakingInfo: {
        exists: userStakingInfoData?.exists === true,
        needsInit: userStakingInfoData?.exists !== true
      },
      escrowTokenAccount: {
        exists: escrowTokenAccountData?.exists === true,
        needsInit: escrowTokenAccountData?.exists !== true
      },
      stakeInfo: {
        exists: stakeInfoData?.exists === true,
        // Stake info is created during staking, so doesn't need pre-initialization
        needsInit: false
      },
      readyForStaking: validationResult.isValid && 
                     (userStakingInfoData?.exists === true || false)
    };
    
    // Return comprehensive diagnostic data
    return res.status(200).json(
      createApiResponse(true, 'Enhanced diagnostic information retrieved', {
        // Basic info
        wallet,
        mintAddress,
        timestamp: new Date().toISOString(),
        solanaEndpoint: SOLANA_RPC_ENDPOINT,
        programId: PROGRAM_ID,
        
        // Token validation results
        isValid: validationResult.isValid,
        userTokenAccount: validationResult.userTokenAccount?.toString(),
        validTokenAccount: validationResult.validTokenAccount?.toString(),
        needsInitialization: reinitInfo.needsInitialization,
        reason: reinitInfo.reason,
        message: reinitInfo.message,
        
        // Account readiness summary
        accountReadiness,
        
        // Detailed account info
        tokenAccount: tokenAccountData,
        stakeInfo: stakeInfoData,
        escrowAccount: escrowTokenAccountData,
        userStakingInfo: userStakingInfoData,
        
        // Additional validation details
        accountExists: validationResult.accountExists,
        hasToken: validationResult.hasToken,
        hasCorrectOwner: validationResult.hasCorrectOwner,
        hasCorrectMint: validationResult.hasCorrectMint,
        hasProperSize: validationResult.hasProperSize,
        hasSufficientBalance: validationResult.hasSufficientBalance,
        tokenAmount: validationResult.tokenAmount,
        
        // Detailed diagnostics
        diagnosticInfo: validationResult.diagnosticInfo,
        
        // User's token accounts (limited to first 10)
        userTokenAccounts: userTokenAccounts.slice(0, 10)
      })
    );
  } catch (error) {
    console.error('Enhanced diagnostic API error:', error);
    return res.status(500).json(
      createApiResponse(false, 'Diagnostic failed', null, error)
    );
  }
}