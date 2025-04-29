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
    
    // 요청 데이터 로깅
    console.log('Reward request received:', {
      wallet, 
      txSignature, 
      reference_id, 
      reward_type, 
      nft_id, 
      mint_address
    });
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // 참조 ID와 보상 유형 결정
    const refId = reference_id || txSignature || '';
    const rewardType = reward_type || 'tweet';
    
    if (!refId) {
      return res.status(400).json({ error: 'Reference ID is required' });
    }
    
    // 중복 보상 확인 - 정확한 매치
    const { data: existingReward, error: checkError } = await supabase
      .from('rewards')
      .select('id')
      .eq('wallet_address', wallet)
      .eq('reference_id', refId)
      .eq('reward_type', rewardType);
    
    if (checkError) {
      console.error('Database query error:', checkError);
      throw new Error(`Database query error: ${checkError.message}`);
    }
    
    if (existingReward && existingReward.length > 0) {
      return res.status(400).json({ error: `Reward already claimed for this reference` });
    }
    
    // 컨텍스트 별 중복 체크 로직
    // 각 컨텍스트(민팅, 컬렉션, 트랜잭션)에서 각각 보상을 받을 수 있도록 설계
    // 따라서 같은 컨텍스트 내에서만 중복을 확인함
    let shouldCheckMore = false;
    
    // 민팅 트윗인 경우 ('mint_tweet') - refId가 mint_로 시작하는지 확인
    if (rewardType === 'mint_tweet' && refId.startsWith('mint_')) {
      shouldCheckMore = true;
    }
    
    // 컬렉션 페이지 트윗인 경우 ('tweet' + nft_tweet_로 시작하는 refId)
    if (rewardType === 'tweet' && refId.startsWith('nft_tweet_')) {
      shouldCheckMore = true;
    }
    
    // 트랜잭션 페이지 트윗인 경우 (일반 트랜잭션 서명을 refId로 사용)
    if (rewardType === 'tweet' && !refId.startsWith('mint_') && !refId.startsWith('nft_')) {
      shouldCheckMore = true;
    }
    
    // 텔레그램 공유인 경우
    if (rewardType === 'telegram_share') {
      shouldCheckMore = true;
    }
    
    // 같은 컨텍스트 내에서 이미 보상을 받았는지 추가 확인
    if (shouldCheckMore) {
      let query = supabase
        .from('rewards')
        .select('id, reference_id')
        .eq('wallet_address', wallet);
      
      // 민팅 트윗 컨텍스트
      if (rewardType === 'mint_tweet') {
        // nft_id가 있으면 해당 NFT에 대한 민팅 보상 확인
        if (nft_id) {
          query = query.eq('reference_id', `mint_${nft_id}`);
        }
        query = query.eq('reward_type', 'mint_tweet');
      }
      
      // 컬렉션 페이지 트윗 컨텍스트
      else if (rewardType === 'tweet' && refId.startsWith('nft_tweet_')) {
        if (nft_id) {
          query = query.eq('reference_id', `nft_tweet_${nft_id}`);
        }
        query = query.eq('reward_type', 'tweet');
      }
      
      // 트랜잭션 페이지 트윗 컨텍스트
      else if (rewardType === 'tweet' && !refId.startsWith('mint_') && !refId.startsWith('nft_')) {
        query = query.eq('reference_id', refId);
        query = query.eq('reward_type', 'tweet');
      }
      
      // 텔레그램 공유 컨텍스트
      else if (rewardType === 'telegram_share') {
        if (refId.startsWith('nft_telegram_')) {
          // 컬렉션 페이지 텔레그램 공유
          if (nft_id) {
            query = query.eq('reference_id', `nft_telegram_${nft_id}`);
          }
        } else {
          // 트랜잭션 페이지 텔레그램 공유
          query = query.eq('reference_id', refId);
        }
        query = query.eq('reward_type', 'telegram_share');
      }
      
      const { data: contextRewards, error: contextError } = await query;
      
      if (contextError) {
        console.error('Context check error:', contextError);
      } else if (contextRewards && contextRewards.length > 0) {
        console.log('Found existing rewards in same context:', contextRewards);
        return res.status(400).json({ error: `You've already received a reward in this context` });
      }
    }
    
    // 모든 검사를 통과했으면 새 보상 레코드 생성
    const platform = rewardType.includes('telegram') ? 'Telegram' : 'Twitter';
    
    // 데이터베이스에 저장할 객체 생성
    const rewardData = {
      wallet_address: wallet,
      amount: SHARE_REWARD_AMOUNT,
      reward_type: rewardType,
      reference_id: refId,
      description: `Reward for sharing on ${platform}`,
      claimed: false
    };
    
    // 추가 필드가 있으면 저장
    if (nft_id) rewardData.nft_id = nft_id;
    if (mint_address) rewardData.mint_address = mint_address;
    if (txSignature) rewardData.tx_signature = txSignature;
    
    // 최종 저장 데이터 로깅
    console.log('Saving reward to database:', rewardData);
    
    const { data: newReward, error } = await supabase
      .from('rewards')
      .insert([rewardData])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create reward:', error);
      throw new Error(`Failed to create reward: ${error.message}`);
    }
    
    // 생성된 보상 기록 로깅
    console.log('New reward created:', newReward);
    
    return res.status(200).json({
      success: true,
      reward: newReward
    });
  } catch (error) {
    console.error('Error in recordTweetReward API:', error);
    return res.status(500).json({ error: 'Failed to record reward: ' + error.message });
  }
}