import { Connection, PublicKey } from '@solana/web3.js';
import { mintingConfig } from '../../utils/minting-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Validate wallet address
    const publicKey = new PublicKey(wallet);
    
    // Use minting config RPC endpoint (same as minting process)
    const connection = new Connection(mintingConfig.rpcEndpoint, mintingConfig.commitment);
    const balance = await connection.getBalance(publicKey);
    
    // Convert to SOL
    const balanceInSol = balance / 1_000_000_000;
    
    res.status(200).json({ 
      balance: balanceInSol,
      balanceLamports: balance 
    });
  } catch (error) {
    console.error('Balance API error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
}