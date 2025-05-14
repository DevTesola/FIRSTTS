/**
 * 중앙화된 공통 모듈 메인 진입점
 * 모든 상수와 유틸리티 함수를 단일 지점에서 내보냅니다
 */

// 해당 모듈에서 필요한 모든 상수와 유틸리티 가져오기
const nftStakingConstants = require('./utils/constants');
const constants = require('./constants');
const utils = require('./utils');
const pda = require('./utils/pda');
const errorHandler = require('./utils/error-handler');

/**
 * 공통 모듈 버전 정보
 */
const VERSION = '1.0.0';

/**
 * 공통 모듈 메타데이터
 */
const META = {
  version: VERSION,
  description: 'TESOLA NFT Staking Common Module',
  author: 'TESOLA Dev Team',
  createdAt: '2025-05-10',
  programId: constants.PROGRAM_ID
};

/**
 * API 응답 생성 헬퍼 함수
 *
 * @param {boolean} success - 요청 성공 여부
 * @param {string} message - 사용자 표시 메시지
 * @param {any} data - 응답 데이터 (선택사항)
 * @param {any} error - 오류 정보 (실패 시)
 * @returns {Object} 표준화된 API 응답 객체
 */
function createApiResponse(success, message, data = null, error = null) {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

/**
 * 트랜잭션 직렬화 헬퍼
 *
 * @param {Transaction} transaction - 직렬화할 트랜잭션 객체
 * @returns {string} Base64로 인코딩된 트랜잭션 문자열
 */
function serializeTransaction(transaction) {
  return transaction.serialize({ requireAllSignatures: false }).toString('base64');
}

/**
 * 모든 상수와 유틸리티를 통합 내보내기
 */
module.exports = {
  // 메타데이터
  VERSION,
  META,
  
  // 상수
  ...constants,
  ...nftStakingConstants,
  
  // PDA 함수
  ...pda,

  // 오류 처리 함수
  getErrorMessage: errorHandler.getErrorMessage,

  // API 헬퍼 함수
  createApiResponse,
  serializeTransaction,

  // 유틸리티
  ...utils
};