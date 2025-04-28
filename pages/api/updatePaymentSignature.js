import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mintIndex, paymentSignature } = req.body;

  if (!mintIndex || !paymentSignature) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // payment_tx_signature 업데이트
    const { data, error } = await supabase
      .from('minted_nfts')
      .update({
        payment_tx_signature: paymentSignature,
        updated_at: new Date().toISOString()
      })
      .eq('mint_index', mintIndex)
      .select();

    if (error) {
      console.error('Error updating payment signature:', error);
      return res.status(500).json({ error: 'Failed to update payment signature' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Payment signature updated successfully',
      data
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}