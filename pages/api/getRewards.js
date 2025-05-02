// pages/api/getRewards.js
import { createClient } from '@supabase/supabase-js';

// 일반 클라이언트 (제한된 권한)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 서비스 역할 클라이언트 (관리자 권한, RLS 우회)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log('Fetching rewards for wallet:', wallet);
    
    // 사용자의 리워드 내역 조회 - 서비스 역할 키 사용
    const { data: rewards, error } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching rewards:', error);
      throw new Error(`Failed to fetch rewards: ${error.message}`);
    }
    
    console.log(`Found ${rewards?.length || 0} rewards for wallet ${wallet}`);
    
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