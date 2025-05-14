/**
 * NFT 스테이킹 전용 에러 핸들링 모듈
 * 
 * 이 모듈은 스테이킹 과정에서 발생하는 특정 오류에 대한 자세한 정보를 제공합니다.
 * 오류 코드와 메시지를 사용자 친화적인 방식으로 변환하여 디버깅 및 트러블슈팅을 용이하게 합니다.
 */

const { ERROR_CODES, getErrorMessage } = require('./error-handler');

// 스테이킹 특화 에러 코드와 메시지 (기존 에러 코드에 추가)
const STAKING_ERROR_CODES = {
  // Solana SPL 토큰 프로그램 오류
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
  'TokenInvalidOwnerError': {
    code: 'InvalidOwner',
    message: '소유자가 유효하지 않습니다. 토큰 계정의 소유자가 PDA가 아닙니다.'
  },
  
  // Anchor 특화 오류
  'IdlParseError': {
    code: 'IdlParseError',
    message: 'Anchor IDL 파싱 오류가 발생했습니다. IDL의 vec<pubkey>를 변환해야 합니다.'
  },
  'VecPubkeyError': {
    code: 'VecPubkeyError',
    message: 'vec<pubkey> 타입을 처리할 수 없습니다. IDL을 수정해야 합니다.'
  },
  
  // 스테이킹 특화 오류
  'StakingSetupError': {
    code: 'StakingSetupError',
    message: '스테이킹 설정 오류가 발생했습니다. 계정 생성 과정에서 문제가 발생했습니다.'
  },
  'NoNFTFoundError': {
    code: 'NoNFTFound',
    message: '계정에 NFT가 없습니다. NFT가 사용자 계정에 있는지 확인하세요.'
  },
  'SimulationError': {
    code: 'SimulationError',
    message: '트랜잭션 시뮬레이션 오류가 발생했습니다. 트랜잭션을 실행하기 전에 문제가 감지되었습니다.'
  }
};

/**
 * 스테이킹 특화 오류 메시지를 반환하는 함수
 * 
 * @param {Error} error - 발생한 오류 객체
 * @returns {string} 사용자 친화적인 오류 메시지
 */
function getStakingErrorMessage(error) {
  // 일반 오류 메시지 먼저 시도
  const generalErrorMessage = getErrorMessage(error);
  
  // 일반 오류 메시지가 "알 수 없는 오류"가 아니면 반환
  if (generalErrorMessage !== '알 수 없는 오류가 발생했습니다') {
    return generalErrorMessage;
  }
  
  // 스테이킹 특화 오류 검사
  if (error) {
    // IDL 파싱 오류 검사
    if (error.message && error.message.includes('Cannot use \'in\' operator to search for \'vec\' in pubkey')) {
      return STAKING_ERROR_CODES.VecPubkeyError.message;
    }
    
    // SPL 토큰 오류 검사
    if (error.message && error.message.includes('Provided owner is not allowed')) {
      return STAKING_ERROR_CODES.TokenInvalidOwnerError.message + ' 에스크로 토큰 계정 생성 시 PDA를 올바르게 지정해야 합니다.';
    }
    
    // NFT 존재 여부 검사
    if (error.message && error.message.includes('insufficient funds')) {
      return STAKING_ERROR_CODES.NoNFTFoundError.message;
    }
    
    // 시뮬레이션 오류 검사
    if (error.message && error.message.includes('트랜잭션 시뮬레이션 실패')) {
      return `${STAKING_ERROR_CODES.SimulationError.message} 세부 사항: ${error.message}`;
    }
    
    // 로그에서 특정 패턴 검색
    if (error.logs) {
      for (const log of error.logs) {
        // 토큰 프로그램 오류 검사
        if (log.includes('Program log: Error: Provided owner is not allowed')) {
          return STAKING_ERROR_CODES.TokenInvalidOwnerError.message;
        }
        
        // 트랜잭션 시뮬레이션 오류
        if (log.includes('failed simulation')) {
          return STAKING_ERROR_CODES.SimulationError.message;
        }
      }
    }
  }
  
  // 여전히 오류를 식별할 수 없는 경우
  return `스테이킹 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
}

/**
 * 스테이킹 트랜잭션을 실행하고 오류를 처리하는 함수
 * 
 * @param {Promise} transactionPromise - 트랜잭션 수행 프로미스
 * @param {string} successMessage - 성공 시 표시할 메시지
 * @returns {Object} 트랜잭션 결과 객체
 */
async function handleStakingTransaction(transactionPromise, successMessage) {
  try {
    const result = await transactionPromise;
    return { 
      success: true, 
      message: successMessage || 'NFT 스테이킹이 성공적으로 완료되었습니다',
      data: result 
    };
  } catch (error) {
    console.error('스테이킹 트랜잭션 오류:', error);
    
    // 자세한 오류 정보를 포함한 응답 반환
    return { 
      success: false, 
      message: getStakingErrorMessage(error),
      error: error,
      errorCode: error.code || 'unknown',
      logs: error.logs || []
    };
  }
}

// 오류 코드 통합 (기존 코드 + 스테이킹 특화 코드)
const COMBINED_ERROR_CODES = {
  ...ERROR_CODES,
  ...STAKING_ERROR_CODES
};

module.exports = {
  getStakingErrorMessage,
  handleStakingTransaction,
  STAKING_ERROR_CODES,
  COMBINED_ERROR_CODES
};