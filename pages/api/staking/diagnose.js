// pages/api/staking/diagnose.js
// 스테이킹 진단 API 엔드포인트
import { Connection, PublicKey } from '@solana/web3.js';
import { diagnoseStakingAccount, diagnosePoolState } from '../../../utils/staking-helpers/diagnostic';

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress } = req.body;

    if (!wallet || !mintAddress) {
      return res.status(400).json({
        error: 'Wallet address and mint address are required',
        success: false
      });
    }

    // Solana 연결
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

    // 스테이킹 계정 진단
    const stakingDiagnosis = await diagnoseStakingAccount(
      connection,
      mintAddress,
      wallet
    );

    // 풀 상태 진단
    const poolDiagnosis = await diagnosePoolState(connection);

    // 모든 진단 결합
    const diagnosis = {
      success: stakingDiagnosis.success && poolDiagnosis.success,
      timestamp: new Date().toISOString(),
      staking: stakingDiagnosis,
      pool: poolDiagnosis,
      canProceedWithUnstaking: stakingDiagnosis.canUnstake && poolDiagnosis.status === 'valid',
      possibleIssues: [
        ...stakingDiagnosis.issues || [],
        poolDiagnosis.status === 'invalid' ? {
          type: 'error',
          account: 'pool_state',
          message: '풀 상태 계정이 올바르게 초기화되지 않았습니다.'
        } : null
      ].filter(Boolean),
      recommendedActions: []
    };

    // 문제에 따른 조치 추천
    if (diagnosis.possibleIssues.length > 0) {
      const issues = diagnosis.possibleIssues;

      // 풀 상태 문제
      if (issues.some(i => i.account === 'pool_state')) {
        diagnosis.recommendedActions.push({
          action: 'admin_init_pool',
          message: '관리자가 풀 상태를 초기화해야 합니다.',
          severity: 'critical'
        });
      }

      // stake_info 문제
      if (issues.some(i => i.account === 'stake_info')) {
        diagnosis.recommendedActions.push({
          action: 'restake',
          message: 'NFT를 다시 스테이킹해 보세요.',
          severity: 'high'
        });
      }

      // user_staking_info 문제
      if (issues.some(i => i.account === 'user_staking_info')) {
        diagnosis.recommendedActions.push({
          action: 'init_user_account',
          message: '사용자 계정을 초기화해야 합니다.',
          severity: 'high'
        });
      }
    } else {
      diagnosis.recommendedActions.push({
        action: 'proceed',
        message: '모든 계정이 올바르게 설정되었습니다. 정상적으로 진행할 수 있습니다.',
        severity: 'info'
      });
    }

    // 사용자 친화적인 요약
    const summary = diagnosis.possibleIssues.length > 0
      ? '스테이킹 계정에 문제가 발견되었습니다. 권장 조치를 따라 해결하세요.'
      : '모든 스테이킹 계정이 정상적으로 설정되었습니다.';

    return res.status(200).json({
      ...diagnosis,
      summary
    });
  } catch (error) {
    console.error('스테이킹 진단 중 오류:', error);
    return res.status(500).json({
      success: false,
      error: '스테이킹 진단 실패: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}