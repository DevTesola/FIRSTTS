// pages/api/governance/getUserVotingPower.js
// 사용자의 투표력(voting power)을 계산하는 API 엔드포인트
import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { 
  STAKING_PROGRAM_ADDRESS 
} from '../../../utils/staking';

import { 
  calculateVotingPower, 
  getUserGovernanceSummary 
} from '../../../utils/staking-helpers/governance-helpers.js';

import { 
  getErrorMessage 
} from '../../../utils/staking-helpers/error-handler.js';

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
    
    // 투표력 계산
    const votingPower = await calculateVotingPower(programId, walletPubkey, connection);
    
    // 거버넌스 요약 정보 가져오기
    const governanceSummary = await getUserGovernanceSummary(programId, walletPubkey, connection);
    
    // 응답 반환
    return res.status(200).json({
      wallet,
      votingPower,
      canCreateProposal: governanceSummary.canCreateProposal,
      activeProposals: governanceSummary.activeProposals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('투표력 계산 중 오류:', error);
    return res.status(500).json({ 
      error: '투표력 계산 실패: ' + getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}