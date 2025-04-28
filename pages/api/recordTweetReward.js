// pages/api/recordTweetReward.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 환경 변수에서 보상 금액 가져오기
const SHARE_REWARD_AMOUNT = parseInt(process.env.NEXT_PUBLIC_SHARE_REWARD_AMOUNT || '5');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { wallet, txSignature, reference_id, reward_type } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // 참조 ID와 보상 유형 결정
    const refId = reference_id || txSignature;
    const rewardType = reward_type || 'tweet';
    
    if (!refId) {
      return res.status(400).json({ error: 'Reference ID is required' });
    }
    
    // 중복 보상 확인
    const { data: existingReward, error: checkError } = await supabase
      .from('rewards')
      .select('id')
      .eq('wallet_address', wallet)
      .eq('reference_id', refId)
      .eq('reward_type', rewardType)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Database query error: ${checkError.message}`);
    }
    
    // 이미 보상받았는지 확인
    if (existingReward) {
      return res.status(400).json({ error: 'Reward already claimed for this reference' });
    }
    
    // 새 보상 레코드 생성
    const platform = rewardType.includes('telegram') ? 'Telegram' : 'Twitter';
    
    const { data: newReward, error } = await supabase
      .from('rewards')
      .insert([
        {
          wallet_address: wallet,
          amount: SHARE_REWARD_AMOUNT,
          reward_type: rewardType,
          reference_id: refId,
          description: `Reward for sharing on ${platform}`,
          claimed: false
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create reward: ${error.message}`);
    }
    
    return res.status(200).json({
      success: true,
      reward: newReward
    });
  } catch (error) {
    console.error('Error in recordTweetReward API:', error);
    return res.status(500).json({ error: 'Failed to record reward: ' + error.message });
  }
}