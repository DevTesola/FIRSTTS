// pages/api/admin/getPendingClaims.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 관리자 지갑 주소 목록 (실제 구현에서는 환경 변수 등을 사용)
const ADMIN_WALLETS = [
  '여기에_관리자_지갑_주소_입력',
  // 추가 관리자 지갑
];

export default async function handler(req, res) {
  try {
    // 여기서는 간단한 구현을 위해 추가 인증은 생략
    // 실제 구현에서는 JWT 등을 사용한 추가 인증 로직이 필요함
    
    // 대기 중인 청구 목록 조회
    const { data: claims, error } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch claims: ${error.message}`);
    }
    
    return res.status(200).json({ claims });
  } catch (error) {
    console.error('Error in getPendingClaims API:', error);
    return res.status(500).json({ error: 'Failed to fetch pending claims: ' + error.message });
  }
}