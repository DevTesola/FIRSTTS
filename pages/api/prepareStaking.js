// pages/api/prepareStaking.js - Full Improved Version
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { Metaplex } from '@metaplex-foundation/js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ADDRESS || 'StakeHzWTJ7mxTTk3XnYbMCRCr7v9a5MvzTEFVwA1Ce5G';
const STAKING_VAULT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS || 'VauLTYvPNJv55P7joHYzFV66bRXVDrEi6sbfVUvFmNQ';
// Stake transaction minimum amount - 0.001 SOL in lamports
const STAKE_TX_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingPeriod } = req.body;
    
    // Input validation
    if (!wallet || !mintAddress || !stakingPeriod) {
      return res.status(400).json({ error: 'Wallet address, mint address, and staking period are required' });
    }
    
    // Validate wallet address format
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // Validate mint address format
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid mint address format' });
    }
    
    // Validate staking period
    const stakingPeriodNum = parseInt(stakingPeriod, 10);
    if (isNaN(stakingPeriodNum) || stakingPeriodNum <= 0 || stakingPeriodNum > 365) {
      return res.status(400).json({ error: 'Staking period must be between 1 and 365 days' });
    }
    
    console.log('Staking request received:', { wallet, mintAddress, stakingPeriod: stakingPeriodNum });
    
    // Check if NFT is already staked
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing stake:', existingError);
      return res.status(500).json({ error: 'Failed to check staking status: ' + existingError.message });
    }
    
    if (existingStake) {
      console.log('NFT already staked:', existingStake);
      return res.status(400).json({ 
        error: `This NFT is already staked until ${new Date(existingStake.release_date).toLocaleDateString()}`, 
        existingStake 
      });
    }
    
    // Connect to Solana
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Verify NFT ownership - USE TOKEN ACCOUNTS METHOD FIRST (more reliable)
    console.log('Verifying NFT ownership...');
    
    // Try to verify ownership using token accounts first
    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length === 0) {
        console.log('NFT ownership check failed: No token accounts found');
        return res.status(403).json({ error: 'You do not own this NFT' });
      }
      
      console.log('NFT ownership verified through token accounts');
    } catch (tokenCheckError) {
      console.error('Error checking token accounts:', tokenCheckError);
      
      // Fall back to Metaplex check if token account check fails
      try {
        const metaplex = new Metaplex(connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubkey });
        
        // Log full NFT structure to debug
        console.log('NFT data structure:', JSON.stringify(nft, null, 2));
        
        // Check if NFT exists
        if (!nft) {
          return res.status(404).json({ error: 'NFT not found' });
        }
        
        // Enhanced ownership check with multiple property paths
        const ownerAddress = nft.token?.ownerAddress?.toString() || 
                            nft.ownership?.owner?.toString() ||
                            nft.ownerAddress?.toString() ||
                            nft.updateAuthority?.toString();
        
        console.log('Detected owner address:', ownerAddress);
        
        if (!ownerAddress || ownerAddress !== wallet) {
          console.log('NFT ownership mismatch:', { owner: ownerAddress, requester: wallet });
          return res.status(403).json({ error: 'You do not own this NFT' });
        }
        
        console.log('NFT ownership verified via Metaplex:', { owner: ownerAddress, nft: nft.name });
      } catch (metaplexError) {
        console.error('All ownership checks failed:', metaplexError);
        return res.status(500).json({ error: 'Failed to verify NFT ownership: ' + metaplexError.message });
      }
    }
    
    // Create a stake vault if needed
    let stakingVaultPubkey;
    try {
      stakingVaultPubkey = new PublicKey(STAKING_VAULT_ADDRESS);
    } catch (err) {
      console.error('Invalid vault address, using fallback:', err);
      // Use a fallback address - ideally the program's PDA
      stakingVaultPubkey = new PublicKey(STAKING_PROGRAM_ADDRESS);
    }
    
    console.log('Creating staking transaction...');
    
    // Get recent blockhash for transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // Create the staking transaction
    // In a production environment, this would be an actual staking program instruction
    // For now, we simulate with a small SOL transfer to mark the staking action
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: stakingVaultPubkey,
        lamports: STAKE_TX_AMOUNT, // Small amount to record the staking action
      })
    );
    
    // Set transaction properties
    transaction.feePayer = walletPubkey;
    transaction.recentBlockhash = blockhash;
    
    // Serialize transaction
    const serializedTransaction = transaction.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    console.log('Transaction created successfully', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    // Create staking metadata for frontend
    const stakingMetadata = {
      walletAddress: wallet,
      mintAddress: mintAddress,
      stakingPeriod: stakingPeriodNum,
      requestTimestamp: Date.now(),
      // Calculate tier-based rewards (to be used by the frontend)
      estimatedRewardRate: calculateRewardRate(req.body.tier || 'Common'),
      transactionExpiry: lastValidBlockHeight + 150 // Approximately 150 blocks expiry window
    };
    
    // Return the transaction for signing
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64'),
      stakingMetadata,
      expiresAt: new Date(Date.now() + 120000).toISOString() // 2 minute expiry for the frontend
    });
  } catch (error) {
    console.error('Error in prepareStaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to prepare staking transaction: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function to calculate reward rate based on NFT tier
function calculateRewardRate(tier) {
  switch(tier.toLowerCase()) {
    case 'legendary':
      return 2.0;  // 2 TESOLA per day
    case 'rare':
      return 1.5;  // 1.5 TESOLA per day
    case 'uncommon':
      return 1.0;  // 1 TESOLA per day
    case 'common':
    default:
      return 0.5;  // 0.5 TESOLA per day
  }
}