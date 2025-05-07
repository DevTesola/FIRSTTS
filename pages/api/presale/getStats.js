import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
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
    
    // 수정: Raw SQL 쿼리로 sum 계산
    const { data: soldDataResult, error: soldError } = await supabase
      .from('minted_nfts')
      .select('token_amount')
      .eq('is_presale', true)
      .eq('status', 'completed');
    
    if (soldError) {
      console.error('Error fetching completed token sales:', soldError);
      return res.status(500).json({ error: 'Error calculating sold amount' });
    }
    
    // 수정: 수동으로 합계 계산
    const soldAmount = soldDataResult ? soldDataResult.reduce((sum, item) => sum + (parseFloat(item.token_amount) || 0), 0) : 0;
    
    // 수정: Raw SQL 쿼리로 sum 계산
    const { data: pendingDataResult, error: pendingError } = await supabase
      .from('minted_nfts')
      .select('token_amount')
      .eq('is_presale', true)
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Error fetching pending token sales:', pendingError);
      return res.status(500).json({ error: 'Error calculating pending amount' });
    }
    
    // 수정: 수동으로 합계 계산
    const pendingAmount = pendingDataResult ? pendingDataResult.reduce((sum, item) => sum + (parseFloat(item.token_amount) || 0), 0) : 0;
    
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