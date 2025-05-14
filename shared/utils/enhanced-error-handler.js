/**
 * 향상된 NFT 스테이킹 오류 처리 모듈
 * 
 * 이 모듈은 NFT 스테이킹 특화 오류 처리 기능을 제공합니다.
 * 계정 역직렬화 오류와 같은 특수 케이스도 처리합니다.
 */

const { ERROR_CODES, SOLANA_ERROR_CODES, CLIENT_ERROR_CODES } = require('./error-codes');

// 스테이킹 특화 오류 코드 및 메시지
const STAKING_ERROR_CODES = {
  // 계정 역직렬화 오류
  'AccountDidNotDeserialize': {
    code: 'AccountDidNotDeserialize',
    message: '계정 구조 오류가 발생했습니다. 비상 언스테이킹을 시도하세요.'
  },
  
  // 최대 NFT 초과 오류
  'MaxNftsExceeded': {
    code: 'MaxNftsExceeded',
    message: '최대 NFT 수에 도달했습니다. 다른 NFT를 스테이킹하기 전에 하나를 언스테이킹하세요.'
  },
  
  // 소유권 오류
  'NotOwner': {
    code: 'NotOwner',
    message: '이 NFT의 소유자가 아닙니다.'
  },
  
  // 이미 스테이킹됨
  'AlreadyStaked': {
    code: 'AlreadyStaked',
    message: '이 NFT는 이미 스테이킹되어 있습니다.'
  },
  
  // 스테이킹 기간 미완료
  'StakingPeriodNotCompleted': {
    code: 'StakingPeriodNotCompleted',
    message: '스테이킹 기간이 아직 완료되지 않았습니다. 비상 언스테이킹을 시도하거나 기간이 끝날 때까지 기다리세요.'
  },
  
  // 스테이킹되지 않음
  'NotStaked': {
    code: 'NotStaked',
    message: '이 NFT는 스테이킹되지 않았습니다.'
  },
  
  // 토큰 계정 관련 오류
  'TokenAccountNotFoundError': {
    code: 'TokenAccountNotFound',
    message: '토큰 계정을 찾을 수 없습니다. 해당 NFT의 토큰 계정이 존재하지 않습니다.'
  },
  
  'TokenInvalidAccountOwnerError': {
    code: 'InvalidAccountOwner',
    message: '토큰 계정 소유자가 유효하지 않습니다. 에스크로 계정의 소유자가 잘못 설정되었습니다.'
  },
  
  'TokenInvalidMintError': {
    code: 'InvalidMint',
    message: '민트가 유효하지 않습니다. 토큰 계정과 민트 주소가 일치하지 않습니다.'
  },
  
  // 시뮬레이션 오류
  'SimulationError': {
    code: 'SimulationError',
    message: '트랜잭션 시뮬레이션에 실패했습니다. 계정 상태를 확인하세요.'
  }
};

/**
 * 오류 객체에서 향상된 오류 메시지 추출
 * 
 * @param {Error|Object} error - 처리할 오류 객체
 * @returns {string} 사용자 친화적 오류 메시지
 */
function getEnhancedErrorMessage(error) {
  // 원본 오류 로깅
  console.log("향상된 오류 처리:", typeof error, error?.code, error?.message);
  
  // 명시적 오류 코드 확인
  if (error && error.code) {
    // 스테이킹 전용 오류 확인
    if (STAKING_ERROR_CODES[error.code]) {
      return STAKING_ERROR_CODES[error.code].message;
    }
    
    // 프로그램 오류 확인 (숫자 코드)
    if (!isNaN(parseInt(error.code)) && ERROR_CODES[error.code]) {
      return ERROR_CODES[error.code].message;
    }
    
    // Solana 오류 확인
    if (SOLANA_ERROR_CODES[error.code]) {
      return SOLANA_ERROR_CODES[error.code].message;
    }
    
    // 클라이언트 오류 확인
    if (CLIENT_ERROR_CODES[error.code]) {
      return CLIENT_ERROR_CODES[error.code].message;
    }
  }
  
  // 오류 메시지 패턴 확인
  if (error && error.message) {
    // 계정 역직렬화 오류
    if (error.message.includes('AccountDidNotDeserialize') || 
        error.message.includes('failed to deserialize') ||
        error.message.includes('Custom program error: 0xbbb')) {
      return STAKING_ERROR_CODES.AccountDidNotDeserialize.message;
    }
    
    // 최대 NFT 초과 오류
    if (error.message.includes('MaxNftsExceeded') || 
        error.message.includes('Custom program error: 0x1777') ||
        error.message.includes('6007')) {
      return STAKING_ERROR_CODES.MaxNftsExceeded.message;
    }
    
    // 소유권 오류
    if (error.message.includes('NotOwner') || 
        error.message.includes('Custom program error: 0x1771') ||
        error.message.includes('6001')) {
      return STAKING_ERROR_CODES.NotOwner.message;
    }
    
    // 스테이킹 기간 미완료 오류
    if (error.message.includes('StakingPeriodNotCompleted') || 
        error.message.includes('Custom program error: 0x1774') ||
        error.message.includes('6004')) {
      return STAKING_ERROR_CODES.StakingPeriodNotCompleted.message;
    }
    
    // 토큰 계정 관련 오류
    if (error.message.includes('TokenAccountNotFound')) {
      return STAKING_ERROR_CODES.TokenAccountNotFoundError.message;
    }
    
    if (error.message.includes('InvalidAccountOwner')) {
      return STAKING_ERROR_CODES.TokenInvalidAccountOwnerError.message;
    }
    
    if (error.message.includes('InvalidMint')) {
      return STAKING_ERROR_CODES.TokenInvalidMintError.message;
    }
    
    // 시뮬레이션 오류
    if (error.message.includes('Simulation failed') || error.message.includes('SimulationError')) {
      return STAKING_ERROR_CODES.SimulationError.message;
    }
  }
  
  // 트랜잭션 로그에서 오류 패턴 찾기
  if (error && error.logs && Array.isArray(error.logs)) {
    for (const log of error.logs) {
      // 계정 역직렬화 오류
      if (log.includes('AccountDidNotDeserialize') || 
          log.includes('failed to deserialize') ||
          log.includes('Custom program error: 0xbbb')) {
        return STAKING_ERROR_CODES.AccountDidNotDeserialize.message;
      }
      
      // 최대 NFT 초과 오류
      if (log.includes('MaxNftsExceeded') || 
          log.includes('Custom program error: 0x1777') ||
          log.includes('Error Number: 6007')) {
        return STAKING_ERROR_CODES.MaxNftsExceeded.message;
      }
      
      // 소유권 오류
      if (log.includes('NotOwner') || 
          log.includes('Custom program error: 0x1771') ||
          log.includes('Error Number: 6001')) {
        return STAKING_ERROR_CODES.NotOwner.message;
      }
      
      // 스테이킹 기간 미완료 오류
      if (log.includes('StakingPeriodNotCompleted') || 
          log.includes('Custom program error: 0x1774') ||
          log.includes('Error Number: 6004')) {
        return STAKING_ERROR_CODES.StakingPeriodNotCompleted.message;
      }
    }
  }
  
  // 일반 오류 핸들러를 통해 기본 메시지 가져오기
  const { getErrorMessage } = require('./error-handler');
  return getErrorMessage(error);
}

/**
 * 스테이킹 트랜잭션 처리 및 오류 처리
 * 
 * @param {Promise} transactionPromise - 처리할 트랜잭션 약속
 * @param {string} successMessage - 성공 시 표시할 메시지
 * @returns {Promise<Object>} 결과 객체
 */
async function handleEnhancedTransaction(transactionPromise, successMessage) {
  try {
    const result = await transactionPromise;
    return { 
      success: true, 
      message: successMessage || '트랜잭션이 성공적으로 완료되었습니다',
      data: result 
    };
  } catch (error) {
    console.error('Enhanced transaction error:', error);
    
    // 상세 오류 정보 수집
    const errorDetails = {
      code: error.code || 'unknown',
      message: getEnhancedErrorMessage(error),
      logs: error.logs || [],
      original: error
    };
    
    return { 
      success: false, 
      message: errorDetails.message,
      error: errorDetails
    };
  }
}

/**
 * 스테이킹 관련 오류 코드 확인
 * 
 * @param {Error|Object} error - 확인할 오류 객체
 * @param {string} errorType - 확인할 오류 유형
 * @returns {boolean} 오류 유형이 일치하는지 여부
 */
function isStakingError(error, errorType) {
  if (!error || !errorType || !STAKING_ERROR_CODES[errorType]) {
    return false;
  }
  
  const errorCode = STAKING_ERROR_CODES[errorType].code;
  
  // 직접 코드 비교
  if (error.code === errorCode) {
    return true;
  }
  
  // 메시지 내용 확인
  if (error.message && error.message.includes(errorType)) {
    return true;
  }
  
  // 로그에서 확인
  if (error.logs && Array.isArray(error.logs)) {
    for (const log of error.logs) {
      if (log.includes(errorType)) {
        return true;
      }
    }
  }
  
  return false;
}

module.exports = {
  STAKING_ERROR_CODES,
  getEnhancedErrorMessage,
  handleEnhancedTransaction,
  isStakingError
};