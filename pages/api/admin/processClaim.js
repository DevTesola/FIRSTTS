// pages/api/admin/processClaim.js
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { claimId, action, adminWallet } = req.body;
    
    if (!claimId || !action || !adminWallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 관리자 권한 확인
    if (!ADMIN_WALLETS.includes(adminWallet)) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action: Must be "approve" or "reject"' });
    }
    
    // 청구 상태 업데이트
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { data: updatedClaim, error } = await supabase
      .from('reward_claims')
      .update({
        status: newStatus,
        processed_by: adminWallet,
        updated_at: new Date()
      })
      .eq('id', claimId)
      .eq('status', 'pending') // 대기 중인 것만 처리 가능
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update claim: ${error.message}`);
    }
    
    if (!updatedClaim) {
      return res.status(404).json({ error: 'Claim not found or already processed' });
    }
    
    // 여기서 실제 토큰 전송 로직을 구현할 수 있음
    // 현재는 데이터베이스 업데이트만 수행
    
    return res.status(200).json({
      success: true,
      claim: updatedClaim
    });
  } catch (error) {
    console.error('Error in processClaim API:', error);
    return res.status(500).json({ error: 'Failed to process claim: ' + error.message });
  }
}