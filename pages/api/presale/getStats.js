import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get presale settings
    const { data: presaleSettings, error: settingsError } = await supabase
      .from('presale_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    if (settingsError) {
      console.error('Error fetching presale settings:', settingsError);
      return res.status(500).json({ error: 'Error fetching presale settings' });
    }
    
    // Get total sold amount
    const { data: soldData, error: soldError } = await supabase
      .from('minted_nfts')  // Using same table, but tracking token sales instead
      .select('sum(token_amount)')
      .eq('is_presale', true)
      .eq('status', 'completed');
    
    if (soldError) {
      console.error('Error calculating sold amount:', soldError);
      return res.status(500).json({ error: 'Error calculating sold amount' });
    }
    
    // Get total in pending state
    const { data: pendingData, error: pendingError } = await supabase
      .from('minted_nfts')
      .select('sum(token_amount)')
      .eq('is_presale', true)
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error calculating pending amount:', pendingError);
      return res.status(500).json({ error: 'Error calculating pending amount' });
    }
    
    // Calculate amounts
    const soldAmount = soldData[0]?.sum || 0;
    const pendingAmount = pendingData[0]?.sum || 0;
    const totalAmount = presaleSettings.total_supply || 100000000; // Default 100M
    const remainingAmount = Math.max(0, totalAmount - soldAmount - pendingAmount);
    
    // Return presale stats
    res.status(200).json({
      is_active: presaleSettings.is_active,
      start_time: presaleSettings.start_time,
      end_time: presaleSettings.end_time,
      price_sol: presaleSettings.price_sol,
      total_supply: totalAmount,
      soldAmount: soldAmount,
      pendingAmount: pendingAmount,
      remainingAmount: remainingAmount,
      whitelist_only: presaleSettings.whitelist_only,
      max_per_wallet: presaleSettings.max_per_wallet,
      min_sol: presaleSettings.min_sol || null,
      max_sol: presaleSettings.max_sol || null
    });
  } catch (err) {
    console.error('Get presale stats API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}