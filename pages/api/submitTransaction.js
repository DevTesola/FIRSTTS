import { Connection } from '@solana/web3.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({ error: 'Transaction data required' });
    }

    // Use server-side RPC connection (no CORS issues)
    const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcEndpoint, 'confirmed');
    
    // Convert base64 transaction back to buffer
    const rawTx = Buffer.from(transaction, 'base64');
    
    // Send raw transaction
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    res.status(200).json({ 
      signature: signature,
      confirmed: true
    });
  } catch (error) {
    console.error('Transaction submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit transaction' });
  }
}