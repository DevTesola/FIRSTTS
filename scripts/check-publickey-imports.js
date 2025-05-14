/**
 * PublicKey import 문제 진단 스크립트
 * PublicKey가 전역 스코프와 모듈에서 올바르게
 * 임포트되고 사용되는지 확인합니다.
 */

const fs = require('fs');
const path = require('path');

// 환경 확인
try {
  // PublicKey 직접 임포트 시도
  const { PublicKey } = require('@solana/web3.js');
  console.log('PublicKey 직접 임포트: 성공');
  console.log('PublicKey 타입:', typeof PublicKey);
  console.log('PublicKey 인스턴스 생성 시도:');
  
  try {
    const pubkey = new PublicKey('4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs');
    console.log('  성공! 생성된 PublicKey:', pubkey.toString());
  } catch (e) {
    console.error('  실패!', e);
  }
} catch (e) {
  console.error('PublicKey 직접 임포트 실패:', e);
}

// 스테이킹 헬퍼에서 PublicKey 사용 확인
try {
  const { findPoolStatePDA, findUserStakingInfoPDA } = require('../shared/utils/pda');
  console.log('\nPDA Helpers 임포트: 성공');
  
  // findPoolStatePDA 함수 호출 시도
  try {
    const [poolPDA] = findPoolStatePDA();
    console.log('findPoolStatePDA 호출: 성공');
    console.log('  풀 PDA:', poolPDA.toString());
  } catch (e) {
    console.error('findPoolStatePDA 호출 실패:', e);
  }
  
  // findUserStakingInfoPDA 함수 호출 시도
  try {
    // 예제 지갑 주소 사용
    const testWallet = '5Qn2Uq4CwDxoQnPYPZdMGQMXkjewndAs2H8EjuZkxDTP';
    const { PublicKey } = require('@solana/web3.js');
    const walletPubkey = new PublicKey(testWallet);
    
    const [userPDA] = findUserStakingInfoPDA(walletPubkey);
    console.log('findUserStakingInfoPDA 호출: 성공');
    console.log('  사용자 스테이킹 PDA:', userPDA.toString());
  } catch (e) {
    console.error('findUserStakingInfoPDA 호출 실패:', e);
  }
} catch (e) {
  console.error('PDA Helpers 임포트 실패:', e);
}

// 이벤트 구독 서비스 확인
try {
  const eventSubscriptionService = require('../services/eventSubscriptionService');
  console.log('\neventSubscriptionService 임포트: 성공');
  console.log('서비스 내용:', Object.keys(eventSubscriptionService).sort().join(', '));
} catch (e) {
  console.error('eventSubscriptionService 임포트 실패:', e);
}

// 상수 모듈 확인
try {
  const constants = require('../utils/staking-helpers/constants');
  console.log('\nstaking-helpers/constants 임포트: 성공');
  console.log('PROGRAM_ID:', constants.PROGRAM_ID);
  console.log('디스크리미네이터 개수:', Object.keys(constants.DISCRIMINATORS).length);
} catch (e) {
  console.error('staking-helpers/constants 임포트 실패:', e);
}

// getStakingStats.js 임포트 확인
console.log('\ngetStakingStats.js 임포트 점검:');
const statsApiPath = path.join(__dirname, '..', 'pages', 'api', 'staking', 'getStakingStats.js');

if (fs.existsSync(statsApiPath)) {
  const content = fs.readFileSync(statsApiPath, 'utf8');
  
  // PublicKey 임포트 확인
  const importMatch = content.match(/import\s+[\{\s]*PublicKey[\s\}]+\s+from\s+['"]@solana\/web3\.js['"]/);
  console.log('PublicKey 임포트 구문:', importMatch ? '찾음' : '찾지 못함');
  
  // findUserStakingInfoPDA 사용 확인
  const pdaUsage = content.match(/findUserStakingInfoPDA\s*\(/);
  console.log('findUserStakingInfoPDA 사용:', pdaUsage ? '찾음' : '찾지 못함');
  
  // PublicKey 인스턴스화 확인
  const pubkeyUsage = content.match(/new\s+PublicKey\s*\(/g);
  console.log('PublicKey 인스턴스화:', pubkeyUsage ? `${pubkeyUsage.length}회 발견` : '찾지 못함');
  
  // 수정 필요 여부 판단
  if (importMatch && pdaUsage && pubkeyUsage) {
    console.log('getStakingStats.js는 PublicKey 사용이 올바르게 설정된 것으로 보입니다.');
  } else {
    console.log('getStakingStats.js는 PublicKey 사용에 문제가 있을 수 있습니다.');
  }
} else {
  console.log(`getStakingStats.js를 찾을 수 없습니다: ${statsApiPath}`);
}

// StakingDashboard.jsx 임포트 확인
console.log('\nStakingDashboard.jsx 임포트 점검:');
const dashboardPath = path.join(__dirname, '..', 'components', 'staking', 'StakingDashboard.jsx');

if (fs.existsSync(dashboardPath)) {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // useStakingEvents 훅 사용 확인
  const hookUsage = content.match(/useStakingEvents\s*\(/);
  console.log('useStakingEvents 훅 사용:', hookUsage ? '찾음' : '찾지 못함');
  
  // 이미지 URL 생성 로직 확인
  const imgUrlGen = content.match(/nft_image|gatewayUrl|IPFS_GATEWAY/g);
  console.log('이미지 URL 생성 로직:', imgUrlGen ? `${imgUrlGen.length}회 발견` : '찾지 못함');
} else {
  console.log(`StakingDashboard.jsx를 찾을 수 없습니다: ${dashboardPath}`);
}

console.log('\n검사 완료!');