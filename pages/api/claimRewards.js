// pages/api/claimRewards.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { wallet } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // 사용자의 청구 가능한 리워드 조회
    const { data: rewards, error: fetchError } = await supabase
      .from('rewards')
      .select('id, amount')
      .eq('wallet_address', wallet)
      .eq('claimed', false);
    
    if (fetchError) {
      throw new Error(`Failed to fetch rewards: ${fetchError.message}`);
    }
    
    // 청구할 리워드가 없는 경우
    if (!rewards || rewards.length === 0) {
      return res.status(400).json({ error: 'No claimable rewards found' });
    }
    
    // 총 청구 금액 계산
    const totalAmount = rewards.reduce((sum, reward) => sum + reward.amount, 0);
    
    // 청구 요청 생성
    const { data: claim, error: claimError } = await supabase
      .from('reward_claims')
      .insert([
        {
          wallet_address: wallet,
          amount: totalAmount,
          status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (claimError) {
      throw new Error(`Failed to create claim: ${claimError.message}`);
    }
    
    // 리워드를 청구됨으로 표시
    const rewardIds = rewards.map(r => r.id);
    const { error: updateError } = await supabase
      .from('rewards')
      .update({ claimed: true, updated_at: new Date() })
      .in('id', rewardIds);
    
    if (updateError) {
      throw new Error(`Failed to update rewards: ${updateError.message}`);
    }
    
    return res.status(200).json({
      success: true,
      claim: {
        id: claim.id,
        amount: totalAmount,
        status: 'pending',
        created_at: claim.created_at
      }
    });
  } catch (error) {
    console.error('Error in claimRewards API:', error);
    return res.status(500).json({ error: 'Failed to claim rewards: ' + error.message });
  }
}