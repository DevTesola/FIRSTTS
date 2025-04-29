// pages/api/prepareStaking.js
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ADDRESS || 'StakeHzWTJ7mxTTk3XnYbMCRCr7v9a5MvzTEFVwA1Ce5G';
const STAKING_VAULT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS || 'VauLTYvPNJv55P7joHYzFV66bRXVDrEi6sbfVUvFmNQ';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingPeriod } = req.body;
    
    if (!wallet || !mintAddress || !stakingPeriod) {
      return res.status(400).json({ error: 'Wallet address, mint address, and staking period are required' });
    }
    
    // Check if NFT is already staked
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingError) {
      console.error('Error checking existing stake:', existingError);
      return res.status(500).json({ error: 'Failed to check staking status' });
    }
    
    if (existingStake) {
      return res.status(400).json({ error: 'This NFT is already staked' });
    }
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // In a real implementation, you would create a staking program transaction
    // Here we're simulating it with a small SOL transfer to a vault address
    // (representing the NFT staking deposit)
    const walletPubkey = new PublicKey(wallet);
    const stakingVaultPubkey = new PublicKey(STAKING_VAULT_ADDRESS);
    
    // Create a transaction (in production this would be your staking program instruction)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: stakingVaultPubkey,
        lamports: 1000, // Minimal fee to record the staking action (0.000001 SOL)
      })
    );
    
    // Add recent blockhash and fee payer
    transaction.feePayer = walletPubkey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
    // Serialize transaction
    const serializedTransaction = transaction.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    // Return the base64 encoded transaction for signing
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64')
    });
  } catch (error) {
    console.error('Error in prepareStaking API:', error);
    return res.status(500).json({ error: 'Failed to prepare staking transaction' });
  }
}