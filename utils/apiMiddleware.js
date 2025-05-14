/**
 * Next.js API 라우트를 위한 미들웨어 유틸리티
 * 미들웨어 체인을 쉽게 적용할 수 있게 해주는 헬퍼 함수들
 */

import { 
  applyApiSecurity, 
  rateLimit, 
  errorHandler, 
  apiCache, 
  apiMiddleware as apiMiddlewareArray, 
  readOnlyApiMiddleware as readOnlyApiMiddlewareArray 
} from '../api-middlewares';

/**
 * 미들웨어 체인 함수 생성
 * 
 * @param {Array} middlewares - 미들웨어 함수 배열
 * @param {Function} handler - API 핸들러 함수
 * @returns {Function} - Next.js API 핸들러
 */
function createMiddlewareChain(middlewares, handler) {
  return function(req, res) {
    function executeMiddleware(index) {
      // 모든 미들웨어가 실행되었으면 핸들러 호출
      if (index >= middlewares.length) {
        return handler(req, res);
      }
      
      // 현재 미들웨어 실행
      const currentMiddleware = middlewares[index];
      
      // 확인: 현재 미들웨어가 함수인지 확인
      if (typeof currentMiddleware !== 'function') {
        console.error(`Middleware at index ${index} is not a function:`, currentMiddleware);
        // 에러 핸들러를 찾아서 호출하거나 다음 미들웨어로 진행
        if (typeof middlewares[middlewares.length - 1] === 'function') {
          return middlewares[middlewares.length - 1](
            new Error(`Middleware at index ${index} is not a function`), 
            req, 
            res
          );
        } else {
          // 에러 핸들러도 함수가 아니면 다음 미들웨어로 진행
          return executeMiddleware(index + 1);
        }
      }
      
      // 정상적으로 현재 미들웨어 실행
      currentMiddleware(req, res, (err) => {
        // 에러가 발생했으면 에러 핸들러 호출 (마지막 미들웨어는 항상 에러 핸들러로 가정)
        if (err) {
          if (typeof middlewares[middlewares.length - 1] === 'function') {
            return middlewares[middlewares.length - 1](err, req, res);
          } else {
            console.error('Error handler middleware is not a function:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
        }
        // 다음 미들웨어 실행
        executeMiddleware(index + 1);
      });
    }
    
    // 첫 번째 미들웨어부터 시작
    executeMiddleware(0);
  };
}

/**
 * 기본 API 미들웨어 체인 적용 (보안, 속도 제한, 에러 처리)
 * 
 * @param {Function} handler - API 핸들러 함수
 * @returns {Function} - 미들웨어가 적용된 Next.js API 핸들러
 */
export function withApiMiddleware(handler) {
  return createMiddlewareChain(apiMiddlewareArray, handler);
}

/**
 * 읽기 전용 API 미들웨어 체인 적용 (보안, 속도 제한, 캐싱, 에러 처리)
 * GET 요청에 대한 캐싱 지원
 * 
 * @param {Function} handler - API 핸들러 함수
 * @returns {Function} - 미들웨어가 적용된 Next.js API 핸들러
 */
export function withReadOnlyApiMiddleware(handler) {
  return createMiddlewareChain(readOnlyApiMiddlewareArray, handler);
}

/**
 * 커스텀 미들웨어 체인 적용
 * 
 * @param {Array} customMiddlewares - 커스텀 미들웨어 함수 배열
 * @param {Function} handler - API 핸들러 함수
 * @returns {Function} - 미들웨어가 적용된 Next.js API 핸들러
 */
export function withCustomMiddleware(customMiddlewares, handler) {
  return createMiddlewareChain(customMiddlewares, handler);
}

export default {
  withApiMiddleware,
  withReadOnlyApiMiddleware,
  withCustomMiddleware
};