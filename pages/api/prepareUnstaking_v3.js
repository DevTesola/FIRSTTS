// pages/api/prepareUnstaking_v3.js
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { calculateUnstakingPenalty } from './reward-calculator';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = 'CnpcsE2eJSfULpikfkbdd31wo6WeoL2jw8YyKSWG3Cfu';

// Correct unstake_nft instruction discriminator from IDL
const UNSTAKE_NFT_DISCRIMINATOR = [17, 182, 24, 211, 101, 138, 50, 163];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingId } = req.body;
    
    if (!wallet || !mintAddress || !stakingId) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, and staking ID are required',
        success: false 
      });
    }
    
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        success: false 
      });
    }
    
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid mint address format',
        success: false 
      });
    }
    
    console.log(`Fetching staking record ID: ${stakingId}`);
    const { data: stakingRecord, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('id', stakingId)
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (stakingError || !stakingRecord) {
      console.error('Error fetching staking record:', stakingError || 'No record found');
      return res.status(404).json({ 
        error: stakingError ? stakingError.message : 'Staking record not found',
        success: false 
      });
    }
    
    console.log('Found staking record:', stakingRecord);
    
    // Calculate unstaking penalty
    const currentDate = new Date();
    const stakingStartDate = new Date(stakingRecord.staked_at);
    const releaseDate = new Date(stakingRecord.release_date);
    const nftTier = stakingRecord.nft_tier || 'COMMON';
    const stakingPeriod = stakingRecord.staking_period;
    
    const penaltyInfo = calculateUnstakingPenalty(
      nftTier,
      stakingStartDate,
      currentDate,
      stakingPeriod
    );
    
    console.log('Preparing unstaking transaction...');
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Create a new transaction
    const tx = new Transaction();
    
    // Get user's token account
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    // Find PDAs based on the actual seeds from your Rust program
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake"), mintPubkey.toBuffer()],
      new PublicKey(STAKING_PROGRAM_ADDRESS)
    );
    
    const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), mintPubkey.toBuffer()],
      new PublicKey(STAKING_PROGRAM_ADDRESS)
    );
    
    // Get escrow token account
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true  // Allow owner off curve
    );
    
    // Create the unstaking instruction with correct discriminator
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // Prepare accounts in the correct order as specified in the IDL
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },         // owner
      { pubkey: mintPubkey, isSigner: false, isWritable: false },         // nft_mint
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },    // user_nft_account
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },  // escrow_nft_account
      { pubkey: escrowAuthorityPDA, isSigner: false, isWritable: false }, // escrow_authority
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },        // stake_info
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }    // token_program
    ];
    
    // For unstake_nft, there are no arguments, just the discriminator
    const instructionData = Buffer.from(UNSTAKE_NFT_DISCRIMINATOR);
    
    // Create the instruction
    const unstakeInstruction = new TransactionInstruction({
      keys: accounts,
      programId,
      data: instructionData
    });
    
    // Add the instruction to the transaction
    tx.add(unstakeInstruction);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // Set transaction properties
    tx.feePayer = walletPubkey;
    tx.recentBlockhash = blockhash;
    
    // Serialize transaction
    const serializedTransaction = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    console.log('Unstaking transaction created successfully', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    return res.status(200).json({
      success: true,
      transactionBase64: serializedTransaction.toString('base64'),
      stakingInfo: stakingRecord,
      unstakingDetails: {
        isPremature: penaltyInfo.isPremature,
        earnedRewards: penaltyInfo.earnedRewards,
        penaltyAmount: penaltyInfo.penaltyAmount,
        penaltyPercentage: penaltyInfo.penaltyPercentage,
        finalReward: penaltyInfo.finalReward,
        transactionExpiry: lastValidBlockHeight + 150,
        canWithdraw: currentDate >= releaseDate,
        daysRemaining: Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)))
      }
    });
  } catch (error) {
    console.error('Error in prepareUnstaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to prepare unstaking transaction: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      success: false
    });
  }
}