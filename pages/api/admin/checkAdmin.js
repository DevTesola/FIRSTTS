// pages/api/admin/checkAdmin.js
// 관리자 권한 확인 API

import { validateEnvVariables } from '../../../utils/envValidator.js';
import { isAdminWallet } from '../../../utils/adminAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    // 환경 변수 검증
    try {
      validateEnvVariables();
    } catch (error) {
      console.error('Environment configuration error:', error);
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // 보안 강화된 관리자 검증 사용
    const isAdmin = isAdminWallet(wallet);
    
    return res.status(200).json({ isAdmin });
    
  } catch (error) {
    console.error('관리자 확인 오류:', error);
    return res.status(500).json({ 
      error: '관리자 확인 실패',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}