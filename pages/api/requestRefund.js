import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      walletAddress, 
      mintAddress, 
      txSignature, 
      reason,
      contactInfo 
    } = req.body;

    // 필수 정보 확인
    if (!walletAddress || !txSignature || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: walletAddress, txSignature, and reason are required' 
      });
    }

    // NFT 민팅 기록 확인
    const { data: nftData, error: nftError } = await supabase
      .from('minted_nfts')
      .select('*')
      .eq('wallet', walletAddress)
      .eq('tx_signature', txSignature)
      .single();

    if (nftError || !nftData) {
      return res.status(404).json({ 
        success: false, 
        message: 'No matching NFT mint record found' 
      });
    }

    // 환불 요청 타임스탬프 확인 (48시간 이내)
    const mintTime = new Date(nftData.created_at);
    const currentTime = new Date();
    const hoursDifference = (currentTime - mintTime) / (1000 * 60 * 60);

    if (hoursDifference > 48) {
      return res.status(400).json({
        success: false,
        message: 'Refund request time limit exceeded (48 hours)'
      });
    }

    // 환불 요청 테이블에 기록
    // 참고: 이 테이블은 Supabase에 미리 생성해야 함
    const { data: refundData, error: refundError } = await supabase
      .from('refund_requests')
      .insert([
        {
          wallet_address: walletAddress,
          mint_address: mintAddress || nftData.mint_address,
          tx_signature: txSignature,
          reason: reason,
          contact_info: contactInfo || '',
          status: 'pending',
          mint_record_id: nftData.id
        }
      ]);

    if (refundError) {
      console.error('Error creating refund request:', refundError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create refund request',
        details: refundError.message
      });
    }

    // 텔레그램으로 알림 보내기 (선택 사항)
    // 이 부분은 실제 텔레그램 봇 API를 사용하여 구현할 수 있음

    return res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      requestId: refundData[0].id
    });

  } catch (error) {
    console.error('Refund request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing refund request',
      details: error.message
    });
  }
}