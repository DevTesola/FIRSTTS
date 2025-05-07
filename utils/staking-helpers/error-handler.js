/**
 * NFT 스테이킹 프로그램의 에러 핸들링 유틸리티 스크립트
 * 프론트엔드에서 사용할 에러 핸들링 로직을 구현합니다.
 */

// 프로그램 에러 코드 매핑
const ERROR_CODES = {
  6000: { code: 'NotStaked', message: 'NFT가 스테이킹되지 않았습니다' },
  6001: { code: 'NotOwner', message: 'NFT의 소유자가 아닙니다' },
  6002: { code: 'NotAdmin', message: '관리자 권한이 없습니다' },
  6003: { code: 'PoolPaused', message: '스테이킹 풀이 일시 중지되었습니다' },
  6004: { code: 'StakingPeriodNotCompleted', message: '스테이킹 기간이 아직 완료되지 않았습니다' },
  6005: { code: 'InvalidNftTier', message: '유효하지 않은 NFT 등급입니다' },
  6006: { code: 'InvalidStakingPeriod', message: '유효하지 않은 스테이킹 기간입니다. 허용되는 값: 30, 60, 90일' },
  6007: { code: 'MaxNftsExceeded', message: '사용자당 최대 NFT 수를 초과했습니다' },
  6008: { code: 'ProposalNotFound', message: '제안을 찾을 수 없습니다' },
  6009: { code: 'VotingNotStarted', message: '투표 기간이 시작되지 않았습니다' },
  6010: { code: 'VotingEnded', message: '투표 기간이 종료되었습니다' },
  6011: { code: 'VotingNotEnded', message: '투표가 아직 종료되지 않았습니다' },
  6012: { code: 'AlreadyVoted', message: '이미 이 제안에 투표했습니다' },
  6013: { code: 'InsufficientVotingPower', message: '투표력이 부족합니다' },
  6014: { code: 'QuorumNotReached', message: '정족수에 도달하지 못했습니다' },
  6015: { code: 'ProposalCancelled', message: '제안이 취소되었습니다' },
  6016: { code: 'ProposalAlreadyExecuted', message: '제안이 이미 실행되었습니다' },
  6017: { code: 'ProposalFailed', message: '제안이 통과되지 못했습니다' },
  6018: { code: 'TimelockNotCompleted', message: '타임락 기간이 완료되지 않았습니다' },
  6019: { code: 'InvalidVotingParams', message: '유효하지 않은 투표 매개변수입니다' },
  6020: { code: 'UnauthorizedVerifier', message: '권한이 없는 검증자입니다' },
  6021: { code: 'InvalidActivityType', message: '유효하지 않은 활동 유형입니다' },
  6022: { code: 'ActivityAlreadyClaimed', message: '이미 청구된 활동입니다' },
  6023: { code: 'InvalidSignature', message: '유효하지 않은 서명입니다' },
  6024: { code: 'CooldownNotCompleted', message: '쿨다운 기간이 완료되지 않았습니다' },
  6025: { code: 'MaxDailyRewardsExceeded', message: '일일 최대 보상을 초과했습니다' },
  6026: { code: 'UserNotRegisteredForSocial', message: '소셜 활동에 등록되지 않은 사용자입니다' },
  6027: { code: 'InvalidProof', message: '유효하지 않거나 만료된 증명입니다' }
};

// 에러 코드에서 사용자 친화적인 메시지를 추출하는 함수
function getErrorMessage(error) {
  // Anchor 에러인 경우
  if (error && error.error && error.error.errorCode) {
    const code = error.error.errorCode.number;
    if (ERROR_CODES[code]) {
      return ERROR_CODES[code].message;
    }
  }
  
  // 트랜잭션 시뮬레이션 에러인 경우
  if (error && error.logs) {
    // 로그에서 에러 코드 추출 시도
    for (const log of error.logs) {
      if (log.includes('Error Code:')) {
        // 에러 코드 추출 패턴: "Error Code: StakingPeriodNotCompleted. Error Number: 6004"
        const match = log.match(/Error Number: (\d+)/);
        if (match && match[1] && ERROR_CODES[parseInt(match[1])]) {
          return ERROR_CODES[parseInt(match[1])].message;
        }
      }
    }
  }
  
  // 일반적인 에러 처리
  if (error && typeof error === 'object') {
    // 일반적인 Solana 에러 코드 확인
    if (error.code === 4001) {
      return '사용자가 트랜잭션을 취소했습니다';
    }
    
    // Wallet 연결 에러
    if (error.code === 'WalletNotConnected') {
      return '지갑이 연결되지 않았습니다. 지갑을 연결하세요';
    }
    
    // 잔액 부족 에러
    if (error.message && error.message.includes('insufficient funds')) {
      return 'SOL 잔액이 부족합니다. 지갑에 SOL을 충전하세요';
    }
    
    // RPC 에러
    if (error.message && error.message.includes('failed to fetch')) {
      return 'Solana 네트워크 연결 실패. 네트워크 연결을 확인하세요';
    }
    
    // 블록 높이 에러
    if (error.message && error.message.includes('blockhash')) {
      return '트랜잭션 타임아웃. 다시 시도하세요';
    }
  }
  
  // 기본 에러 메시지
  return error.message || '알 수 없는 오류가 발생했습니다';
}

// 트랜잭션을 처리하고 에러를 처리하는 헬퍼 함수
async function handleTransaction(transactionPromise, successMessage) {
  try {
    const result = await transactionPromise;
    return { 
      success: true, 
      message: successMessage || '트랜잭션이 성공적으로 완료되었습니다',
      data: result 
    };
  } catch (error) {
    console.error('Transaction error:', error);
    return { 
      success: false, 
      message: getErrorMessage(error),
      error: error
    };
  }
}

export {
  getErrorMessage,
  handleTransaction,
  ERROR_CODES
};