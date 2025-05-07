// pages/api/admin/checkAdmin.js
// 관리자 권한 확인 API

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: '지갑 주소가 필요합니다' });
    }
    
    // 환경 변수에서 관리자 목록 가져오기
    const adminWallets = process.env.ADMIN_WALLETS 
      ? process.env.ADMIN_WALLETS.split(',') 
      : [];
    
    // 개발 환경 전용 관리자 지갑 확인
    const devAdminWallets = process.env.NEXT_PUBLIC_DEV_ADMIN_WALLETS 
      ? process.env.NEXT_PUBLIC_DEV_ADMIN_WALLETS.split(',').map(w => w.trim()).filter(w => w)
      : [];
    
    let isAdmin = false;
    
    // 개발 환경에서는 개발 전용 관리자 목록 사용
    if (process.env.NODE_ENV === 'development') {
      if (devAdminWallets.length > 0) {
        // 개발 관리자 목록이 있으면 그 목록으로 검증
        isAdmin = devAdminWallets.includes(wallet);
      } else {
        // 개발 관리자 목록이 없으면 모든 지갑 허용 (테스트용)
        console.warn('보안 경고: 개발 환경에서 관리자 지갑이 지정되지 않았습니다');
        isAdmin = true;
      }
    } else {
      // 프로덕션에서는 실제 관리자 목록만 사용
      isAdmin = adminWallets.includes(wallet);
    }
    
    return res.status(200).json({ isAdmin });
    
  } catch (error) {
    console.error('관리자 확인 오류:', error);
    return res.status(500).json({ 
      error: '관리자 확인 실패',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}