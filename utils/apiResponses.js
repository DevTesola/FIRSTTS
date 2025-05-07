/**
 * API 응답 패턴을 표준화하기 위한 유틸리티 함수
 * 
 * 모든 API 응답은 다음 형식을 따릅니다:
 * 성공 시: { success: true, data: {...} }
 * 실패 시: { success: false, error: "에러 메시지", code: "에러 코드" }
 */

/**
 * 성공 응답 생성
 * 
 * @param {object} res - Express/Next.js Response 객체
 * @param {any} data - 응답 데이터 
 * @param {number} status - HTTP 상태 코드 (기본값: 200)
 * @param {object} headers - 추가 응답 헤더 (선택 사항)
 */
export function sendSuccess(res, data, status = 200, headers = {}) {
  // 기본 캐시 제어 헤더 (API 응답은 캐시하지 않음)
  const defaultHeaders = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  };
  
  // 커스텀 헤더 추가
  const allHeaders = { ...defaultHeaders, ...headers };
  
  // 헤더 설정
  Object.entries(allHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // 응답 전송
  return res.status(status).json({
    success: true,
    data
  });
}

/**
 * 에러 응답 생성
 * 
 * @param {object} res - Express/Next.js Response 객체
 * @param {string} message - 에러 메시지
 * @param {number} status - HTTP 상태 코드 (기본값: 400)
 * @param {string} code - 에러 코드 (선택 사항)
 * @param {object} details - 추가 에러 세부 정보 (개발 환경에서만 표시)
 */
export function sendError(res, message, status = 400, code = '', details = null) {
  // 기본 응답 객체
  const errorResponse = {
    success: false,
    error: message
  };
  
  // 에러 코드가 제공된 경우 추가
  if (code) {
    errorResponse.code = code;
  }
  
  // 개발 환경에서만 세부 정보 추가
  if (details && process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
  }
  
  // 응답 전송
  return res.status(status).json(errorResponse);
}

/**
 * Supabase 에러 처리 및 응답 생성
 * 
 * @param {object} res - Express/Next.js Response 객체
 * @param {Error} error - Supabase 에러 객체
 * @param {string} fallbackMessage - 기본 에러 메시지
 */
export function handleSupabaseError(res, error, fallbackMessage = 'Database operation failed') {
  console.error(`[Supabase Error] ${error.message || fallbackMessage}`, error);
  
  // Supabase 에러 코드에 따른 적절한 HTTP 상태 및 메시지 결정
  if (error?.code === 'PGRST116') {
    // 데이터를 찾을 수 없음
    return sendError(res, 'Resource not found', 404, 'NOT_FOUND', error);
  } else if (error?.code === '23505') {
    // 중복 키 오류
    return sendError(res, 'Resource already exists', 409, 'CONFLICT', error);
  } else if (error?.code?.startsWith('42')) {
    // SQL 문법 오류 (서버 내부 문제)
    return sendError(res, 'Internal server error', 500, 'DATABASE_ERROR', error);
  } else if (error?.code === '23503') {
    // 외래 키 제약 조건 위반
    return sendError(res, 'Invalid reference', 400, 'INVALID_REFERENCE', error);
  }
  
  // 기본 에러 처리
  return sendError(
    res, 
    fallbackMessage, 
    500, 
    'DATABASE_ERROR',
    error
  );
}

/**
 * API 메소드 검증
 * 
 * @param {object} req - Express/Next.js Request 객체
 * @param {object} res - Express/Next.js Response 객체
 * @param {string[]} allowedMethods - 허용된 HTTP 메서드 배열
 * @returns {boolean} 유효한 메서드인 경우 true, 아닌 경우 false
 */
export function validateMethod(req, res, allowedMethods = ['GET']) {
  if (!allowedMethods.includes(req.method)) {
    sendError(
      res,
      `Method ${req.method} not allowed`,
      405,
      'METHOD_NOT_ALLOWED',
      { allowedMethods }
    );
    return false;
  }
  return true;
}

/**
 * 요청 바디 검증
 * 
 * @param {object} req - Express/Next.js Request 객체
 * @param {object} res - Express/Next.js Response 객체 
 * @param {string[]} requiredFields - 필요한 필드 배열
 * @returns {boolean} 모든 필수 필드가 있는 경우 true, 아닌 경우 false
 */
export function validateBody(req, res, requiredFields = []) {
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    sendError(
      res,
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      'MISSING_FIELDS',
      { required: requiredFields, missing: missingFields }
    );
    return false;
  }
  return true;
}

/**
 * API 핸들러 래퍼 (비동기 오류 처리)
 * 
 * @param {function} handler - API 핸들러 함수
 * @returns {function} 오류 처리가 포함된 래핑된 핸들러 함수
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`[API Error] Unhandled exception:`, error);
      sendError(
        res,
        'Internal server error',
        500,
        'INTERNAL_SERVER_ERROR',
        error
      );
    }
  };
}

/**
 * 요청 쿼리 검증
 * 
 * @param {object} req - Express/Next.js Request 객체
 * @param {object} res - Express/Next.js Response 객체
 * @param {string[]} requiredParams - 필요한 쿼리 파라미터 배열
 * @returns {boolean} 모든 필수 파라미터가 있는 경우 true, 아닌 경우 false
 */
export function validateQuery(req, res, requiredParams = []) {
  const missingParams = requiredParams.filter(param => !req.query[param]);
  
  if (missingParams.length > 0) {
    sendError(
      res,
      `Missing required query parameters: ${missingParams.join(', ')}`,
      400,
      'MISSING_QUERY_PARAMS',
      { required: requiredParams, missing: missingParams }
    );
    return false;
  }
  return true;
}

// 기본 내보내기
export default {
  sendSuccess,
  sendError,
  handleSupabaseError,
  validateMethod,
  validateBody,
  validateQuery,
  withErrorHandling
};