// pages/api/recordTweetReward.js
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

// 환경 변수에서 보상 금액 가져오기
const SHARE_REWARD_AMOUNT = parseInt(process.env.NEXT_PUBLIC_SHARE_REWARD_AMOUNT || '5');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { wallet, txSignature, reference_id, reward_type, nft_id, mint_address, tweet_text, share_text } = req.body;
    
    // 요청 데이터 로깅
    console.log('Reward request received:', {
      wallet, 
      txSignature, 
      reference_id, 
      reward_type, 
      nft_id, 
      mint_address,
      tweet_text, // 트윗 텍스트 저장 (나중에 검증에 사용 가능)
      share_text  // 텔레그램 공유 텍스트 저장
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
    if (tweet_text) rewardData.tweet_text = tweet_text;
    if (share_text) rewardData.share_text = share_text;
    
    // 최종 저장 데이터 로깅
    console.log('Saving reward to database:', rewardData);
    
    // 환경 설정 로깅 (민감한 키 값은 포함하지 않음)
    console.log('Supabase 설정 확인:', {
      publicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음',
      publicKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음',
      serviceUrl: process.env.SUPABASE_URL ? '설정됨' : '없음',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음'
    });
    
    // 먼저 테이블 접근 권한 확인 (읽기는 모든 사용자에게 허용됨)
    console.log('테이블 접근 권한 확인 중...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('rewards')
      .select('id')
      .limit(1);
      
    if (tableError) {
      console.error('테이블 접근 확인 실패:', tableError);
      throw new Error(`테이블 접근 오류: ${tableError.message}`);
    }
    
    console.log('테이블 접근 확인 성공, 서비스 역할로 삽입 진행');
    
    // 서비스 역할로 삽입하여 RLS 우회
    console.log('서비스 역할로 rewards 테이블에 데이터 삽입 시도');
    
    // 삽입 시 최소한의 데이터만 반환하도록 설정
    const insertOptions = { returning: 'minimal' };
    
    // supabaseAdmin(서비스 역할)으로 삽입 시도
    const { data: newReward, error } = await supabaseAdmin
      .from('rewards')
      .insert([rewardData], insertOptions);
    
    if (error) {
      console.error('Failed to create reward:', error);
      throw new Error(`Failed to create reward: ${error.message}`);
    }
    
    // 삽입 결과 확인
    if (error) {
      console.error('보상 생성 실패:', error);
      
      // 오류가 RLS 정책 관련이면 더 자세한 정보 제공
      if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
        console.error('RLS 정책 오류 발생. 서비스 역할이 제대로 적용되지 않았습니다.');
        
        // 대체 접근법: 보류 중 보상 테이블에 로깅
        try {
          console.log('대체 접근법 시도: 보류 중 보상 기록...');
          
          // 관리자가 나중에 처리할 수 있도록 임시 테이블에 저장
          // reward_requests 또는 reward_pending 테이블이 있다면 사용
          let fallbackSuccess = false;
          
          // 먼저 reward_requests 테이블 시도
          const { data: requestsData, error: requestsError } = await supabaseAdmin
            .from('reward_requests')
            .insert([{
              ...rewardData,
              status: 'pending',
              created_at: new Date().toISOString(),
              error_message: error.message
            }]);
            
          if (!requestsError) {
            console.log('reward_requests 테이블에 성공적으로 기록됨');
            fallbackSuccess = true;
          } else {
            console.log('reward_requests 테이블 접근 실패, reward_pending 테이블 시도');
            
            // reward_pending 테이블 시도
            const { data: pendingData, error: pendingError } = await supabaseAdmin
              .from('reward_pending')
              .insert([{
                ...rewardData,
                status: 'pending',
                created_at: new Date().toISOString(),
                error_message: error.message
              }]);
              
            if (!pendingError) {
              console.log('reward_pending 테이블에 성공적으로 기록됨');
              fallbackSuccess = true;
            }
          }
          
          if (fallbackSuccess) {
            return res.status(200).json({
              success: true,
              message: '보상이 관리자 승인을 위해 대기열에 추가되었습니다',
              pending: true
            });
          }
        } catch (fallbackError) {
          console.error('대체 접근법 실패:', fallbackError);
        }
      }
      
      throw new Error(`보상 생성 실패: ${error.message}`);
    }
    
    // 생성된 보상 기록 로깅
    console.log('New reward created successfully');
    
    return res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Error in recordTweetReward API:', error);
    // Convert to user-friendly error message
    let userFriendlyMessage = 'We encountered an issue recording your share. Please try again later.';
    
    // Specific user-friendly messages for different error types
    if (error.message.includes('share_text')) {
      userFriendlyMessage = 'Sharing feature is temporarily unavailable. We are updating our systems.';
    } else if (error.message.includes('schema cache')) {
      userFriendlyMessage = 'System maintenance in progress. Please try again in a few minutes.';
    } else if (error.message.includes('already claimed')) {
      userFriendlyMessage = 'You have already received rewards for sharing this NFT.';
    }
    
    // Include original error in development environment
    const isDev = process.env.NODE_ENV === 'development';
    const errorDetail = isDev ? ` (${error.message})` : '';
    
    return res.status(500).json({ 
      error: userFriendlyMessage + errorDetail
    });
  }
}