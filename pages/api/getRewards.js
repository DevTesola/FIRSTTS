// pages/api/getRewards.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // 사용자의 리워드 내역 조회
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch rewards: ${error.message}`);
    }
    
    // 총 리워드 합계 계산
    const totalRewards = rewards.reduce((sum, reward) => {
      // 이미 청구한 리워드는 제외
      if (!reward.claimed) {
        return sum + reward.amount;
      }
      return sum;
    }, 0);
    
    // 청구 가능한 리워드 목록
    const claimableRewards = rewards.filter(reward => !reward.claimed);
    
    return res.status(200).json({
      totalRewards,
      claimableRewards,
      rewardHistory: rewards
    });
  } catch (error) {
    console.error('Error in getRewards API:', error);
    return res.status(500).json({ error: 'Failed to fetch rewards: ' + error.message });
  }
}