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
    const { wallet, txSignature, reference_id, reward_type, nft_id, mint_address } = req.body;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // 참조 ID와 보상 유형 결정
    const refId = reference_id || txSignature;
    const rewardType = reward_type || 'tweet';
    
    if (!refId) {
      return res.status(400).json({ error: 'Reference ID is required' });
    }
    
    // 중복 보상 확인을 위한 광범위한 검사
    // 1. 정확히 같은 참조 ID + 보상 유형 조합 확인
    let duplicateQuery = supabase
      .from('rewards')
      .select('id')
      .eq('wallet_address', wallet)
      .eq('reference_id', refId)
      .eq('reward_type', rewardType);
    
    let { data: duplicateExact, error: checkError1 } = await duplicateQuery.maybeSingle();
    
    if (checkError1) {
      throw new Error(`Database query error: ${checkError1.message}`);
    }
    
    // 이미 정확히 같은 보상이 있음
    if (duplicateExact) {
      return res.status(400).json({ error: `Reward already claimed for this reference` });
    }
    
    // 2. 같은 NFT ID에 대한 다른 형태의 보상 확인
    if (nft_id) {
      // NFT ID 기반 중복 확인 - 다양한 패턴 확인
      const potentialRefIds = [
        `mint_${nft_id}`,
        `nft_tweet_${nft_id}`,
        `nft_telegram_${nft_id}`
      ];
      
      let { data: duplicateNft, error: checkError2 } = await supabase
        .from('rewards')
        .select('id, reward_type, reference_id')
        .eq('wallet_address', wallet)
        .in('reference_id', potentialRefIds);
      
      if (checkError2) {
        throw new Error(`Database query error: ${checkError2.message}`);
      }
      
      // 같은 NFT에 대한 같은 유형의 보상이 이미 있음
      if (duplicateNft && duplicateNft.some(reward => reward.reward_type === rewardType)) {
        return res.status(400).json({ error: `You've already received a ${rewardType} reward for this NFT` });
      }
    }
    
    // 3. 민트 주소 기반 중복 확인
    if (mint_address && mint_address.length > 30) {
      let { data: duplicateMint, error: checkError3 } = await supabase
        .from('rewards')
        .select('id')
        .eq('wallet_address', wallet)
        .eq('mint_address', mint_address)
        .eq('reward_type', rewardType);
      
      if (checkError3) {
        throw new Error(`Database query error: ${checkError3.message}`);
      }
      
      if (duplicateMint && duplicateMint.length > 0) {
        return res.status(400).json({ error: `You've already received a ${rewardType} reward for this NFT` });
      }
    }
    
    // 모든 검사를 통과했으면 새 보상 레코드 생성
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
          claimed: false,
          nft_id: nft_id || null,
          mint_address: mint_address || null,
          tx_signature: txSignature || null
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