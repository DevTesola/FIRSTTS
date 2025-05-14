// pages/api/social/getUserSocialStatus.js
// 사용자의 소셜 활동 상태를 조회하는 API 엔드포인트
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS 
} from '../../../utils/staking';

import { 
  getSocialActivityStatus,
  canClaimSocialReward,
  SOCIAL_ACTIVITY_TYPES
} from '../../../utils/staking-helpers/social-verification-helpers';

import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 요청 파라미터 추출
    const wallet = req.method === 'POST' ? req.body.wallet : req.query.wallet;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // Solana RPC 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 소셜 활동 상태 조회
    const socialStatus = await getSocialActivityStatus(programId, walletPubkey, connection);
    
    // 각 소셜 플랫폼 별 보상 청구 가능 여부 확인
    const twitterClaimStatus = await canClaimSocialReward(
      programId, 
      walletPubkey, 
      SOCIAL_ACTIVITY_TYPES.TWITTER, 
      connection
    );
    
    const telegramClaimStatus = await canClaimSocialReward(
      programId, 
      walletPubkey, 
      SOCIAL_ACTIVITY_TYPES.TELEGRAM, 
      connection
    );
    
    const discordClaimStatus = await canClaimSocialReward(
      programId, 
      walletPubkey, 
      SOCIAL_ACTIVITY_TYPES.DISCORD, 
      connection
    );
    
    // 응답 반환
    return res.status(200).json({
      wallet,
      initialized: socialStatus.initialized,
      twitter: {
        ...socialStatus.twitter,
        canClaim: twitterClaimStatus.canClaim,
        reason: twitterClaimStatus.reason,
        cooldownRemaining: twitterClaimStatus.cooldownRemaining
      },
      telegram: {
        ...socialStatus.telegram,
        canClaim: telegramClaimStatus.canClaim,
        reason: telegramClaimStatus.reason,
        cooldownRemaining: telegramClaimStatus.cooldownRemaining
      },
      discord: {
        ...socialStatus.discord,
        canClaim: discordClaimStatus.canClaim,
        reason: discordClaimStatus.reason,
        cooldownRemaining: discordClaimStatus.cooldownRemaining
      },
      totalRewardsEarned: socialStatus.totalRewardsEarned,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('소셜 활동 상태 조회 중 오류:', error);
    return res.status(500).json({ 
      error: '소셜 활동 상태 조회 실패: ' + getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}