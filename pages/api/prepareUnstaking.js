// pages/api/prepareUnstaking.js
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ADDRESS || 'StakeHzWTJ7mxTTk3XnYbMCRCr7v9a5MvzTEFVwA1Ce5G';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingId } = req.body;
    
    if (!wallet || !mintAddress || !stakingId) {
      return res.status(400).json({ error: 'Wallet address, mint address, and staking ID are required' });
    }
    
    // Get staking record from database
    const { data: stakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('id', stakingId)
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (stakingError) {
      console.error('Error fetching staking record:', stakingError);
      return res.status(500).json({ error: 'Failed to fetch staking record' });
    }
    
    if (!stakingData) {
      return res.status(404).json({ error: 'Staking record not found' });
    }
    
    // Calculate if early unstaking penalty applies
    const releaseDate = new Date(stakingData.release_date);
    const currentDate = new Date();
    
    let penalty = 0;
    if (currentDate < releaseDate) {
      // Calculate penalty as a percentage of remaining time
      const totalStakingTime = new Date(stakingData.release_date).getTime() - 
                               new Date(stakingData.staked_at).getTime();
      const remainingTime = releaseDate.getTime() - currentDate.getTime();
      const remainingPercentage = remainingTime / totalStakingTime;
      
      // Penalty is 50% of rewards for remaining time
      penalty = stakingData.total_rewards * remainingPercentage * 0.5;
    }
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Create a transaction (in production this would be your unstaking program instruction)
    // Here we're simulating with a minimal SOL transfer
    const walletPubkey = new PublicKey(wallet);
    const stakingProgramPubkey = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: stakingProgramPubkey,
        lamports: 1000, // Minimal fee to record the unstaking action (0.000001 SOL)
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
      transactionBase64: serializedTransaction.toString('base64'),
      penalty: parseFloat(penalty.toFixed(2))
    });
  } catch (error) {
    console.error('Error in prepareUnstaking API:', error);
    return res.status(500).json({ error: 'Failed to prepare unstaking transaction' });
  }
}