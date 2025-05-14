// pages/api/admin/performance-stats.js
import { getPerformanceStatistics, resetPerformanceMetrics } from '../../../utils/staking-helpers/performance-logger';
import { isAdminWallet } from '../../../utils/adminAuth';

export default async function handler(req, res) {
  // 관리자 권한 확인
  const walletAddress = req.headers['x-wallet-address'];
  if (!walletAddress || !isAdminWallet(walletAddress)) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }

  if (req.method === 'GET') {
    // 성능 통계 데이터 가져오기
    const statistics = getPerformanceStatistics();
    
    // 응답에 시스템 정보 추가
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    };
    
    return res.status(200).json({
      systemInfo,
      performanceStats: statistics
    });
  } else if (req.method === 'DELETE') {
    // 성능 측정 데이터 초기화
    resetPerformanceMetrics();
    return res.status(200).json({ message: '성능 측정 데이터가 초기화되었습니다' });
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}