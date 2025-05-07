import { PublicKey, Connection } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { validateSolanaAddress } from '../../../middleware/apiSecurity';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''  // 수정: SUPABASE_SERVICE_ROLE_KEY로 변경
);

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, paymentTxId, paymentId } = req.body;
    
    // Validate parameters
    if (!wallet || !paymentTxId || !paymentId) {
      return res.status(400).json({ 
        error: 'Missing required parameters. wallet, paymentTxId, and paymentId are all required.' 
      });
    }
    
    // Validate wallet address
    if (typeof validateSolanaAddress === 'function') {
      const validation = validateSolanaAddress(wallet);
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    // Create PublicKey object from wallet address
    let publicKey;
    try {
      publicKey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // Find the pending purchase record
    const { data: pendingPurchase, error: pendingError } = await supabase
      .from('minted_nfts')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('wallet', wallet)
      .eq('status', 'pending')
      .eq('is_presale', true)
      .single();
      
    if (pendingError || !pendingPurchase) {
      return res.status(404).json({ error: 'No pending purchase found' });
    }
    
    // Verify the payment transaction
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    try {
      // Get transaction details
      const txInfo = await connection.getTransaction(paymentTxId, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      // Transaction not found
      if (!txInfo) {
        return res.status(400).json({ error: 'Transaction not found on blockchain' });
      }
      
      // Verify transaction success
      if (!txInfo.meta || txInfo.meta.err) {
        return res.status(400).json({ error: 'Transaction failed on blockchain' });
      }
      
      // Record the successful token purchase
      const { data: tokenSale, error: updateError } = await supabase
        .from('minted_nfts')
        .update({
          status: 'completed',
          transaction_signature: paymentTxId,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId)
        .eq('wallet', wallet)
        .eq('status', 'pending')
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating purchase record:', updateError);
        return res.status(500).json({ error: 'Failed to complete purchase record' });
      }
      
      // Return success with token details
      res.status(200).json({
        success: true,
        tokenAmount: tokenSale.token_amount,
        transactionSignature: paymentTxId,
        message: `Successfully purchased ${tokenSale.token_amount.toLocaleString()} TESOLA tokens!`
      });
      
    } catch (txError) {
      console.error('Error verifying transaction:', txError);
      return res.status(500).json({ error: 'Failed to verify transaction' });
    }
    
  } catch (err) {
    console.error('Complete presale API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}