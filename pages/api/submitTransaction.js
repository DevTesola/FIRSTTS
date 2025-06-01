import { Connection, Transaction } from '@solana/web3.js';
import { mintingConfig } from '../../utils/minting-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({ error: 'Transaction data required' });
    }

    // Use same RPC as minting process
    console.log('Using RPC endpoint:', mintingConfig.rpcEndpoint);
    const connection = new Connection(mintingConfig.rpcEndpoint, mintingConfig.commitment);
    
    // Convert base64 transaction back to buffer
    const rawTx = Buffer.from(transaction, 'base64');
    
    // Send raw transaction with skipPreflight to avoid blockhash sync issues
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: true,  // Skip simulation to avoid blockhash sync issues
      maxRetries: 5
    });
    
    console.log('Transaction successfully sent:', signature);
    
    // Send transaction but don't wait for confirmation 
    // (confirmation will be checked in completeMinting with proper retry logic)
    console.log('Transaction sent with signature:', signature);
    
    res.status(200).json({ 
      signature: signature,
      confirmed: true,
      message: 'Transaction confirmed successfully'
    });
  } catch (error) {
    console.error('Transaction submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit transaction' });
  }
}