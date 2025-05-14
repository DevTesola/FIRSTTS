/**
 * 중앙화된 유틸리티 모듈 진입점
 * 모든 유틸리티 함수를 가져와서 다시 내보냅니다
 */

const errorCodes = require('./error-codes');
const errorHandler = require('./error-handler');
const transaction = require('./transaction');
const pda = require('./pda');
const tokenValidator = require('./token-validator');
const idlHelper = require('./idl-helper');

module.exports = {
  // 에러 코드 및 처리
  ...errorCodes,
  ...errorHandler,

  // 트랜잭션 유틸리티
  ...transaction,

  // PDA 유틸리티
  ...pda,

  // 토큰 계정 검증 유틸리티
  ...tokenValidator,

  // IDL 헬퍼 유틸리티
  ...idlHelper
};