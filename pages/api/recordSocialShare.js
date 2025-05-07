// pages/api/recordSocialShare.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Social share reward amount (TESOLA tokens)
const SHARE_REWARD_AMOUNT = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { wallet, txSignature, reference_id, reward_type } = req.body;
    // 사용할 참조 ID와 보상 유형 결정
    const refId = reference_id || txSignature;
    const rewardType = reward_type || 'tweet';
    if (!wallet || !txSignature || !reference_id || !reward_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if already rewarded for this transaction and platform
    const { data: existingReward, error: checkError } = await supabase
      .from('rewards')
      .select('id')
      .eq('wallet_address', wallet)
      .eq('reference_id', txSignature)
      .eq('reward_type', reward_type)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Database query error: ${checkError.message}`);
    }
    
    // Prevent duplicate rewards
    if (existingReward) {
      return res.status(400).json({ error: `${platform} share reward already claimed for this transaction` });
    }
    
    // Create new reward record
    const { data: newReward, error } = await supabase
      .from('rewards')
      .insert([
        {
          wallet_address: wallet,
          amount: SHARE_REWARD_AMOUNT,
          reward_type: reward_type,
          reference_id: txSignature,
          description: `Reward for sharing transaction on ${platform}`,
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
    console.error(`Error in recordSocialShare API:`, error);
    return res.status(500).json({ error: `Failed to record ${platform} share reward: ` + error.message });
  }
}