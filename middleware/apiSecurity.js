/**
 * API 보안을 위한 미들웨어 유틸리티
 * CSRF 보호, 속도 제한 및 기타 보안 기능 제공
 */

import { PublicKey } from '@solana/web3.js';

// 요청 속도 제한을 위한 맵
const requestsMap = new Map();
const REQUEST_LIMIT = 30; // 기본 제한 (30초당 최대 요청 수)
const WINDOW_MS = 30000; // 제한 기간 (30초)

/**
 * 요청 속도 제한 미들웨어
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 호출 함수
 * @param {Object} options - 옵션
 * @returns {void}
 */
export function rateLimiter(req, res, next, options = {}) {
  // IP 주소 또는 다른 식별자 가져오기
  const identifier = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    'unknown';
  
  // 현재 시간
  const now = Date.now();
  
  // 기본값으로 병합된 옵션
  const { 
    limit = REQUEST_LIMIT, 
    windowMs = WINDOW_MS 
  } = options;
  
  // 요청 레코드 가져오기 또는 생성
  const requestRecord = requestsMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs
  };
  
  // 리셋 시간이 지났으면 카운트 초기화
  if (now > requestRecord.resetTime) {
    requestRecord.count = 0;
    requestRecord.resetTime = now + windowMs;
  }
  
  // 요청 카운트 증가
  requestRecord.count += 1;
  
  // 맵 업데이트
  requestsMap.set(identifier, requestRecord);
  
  // 제한 초과 시 응답
  if (requestRecord.count > limit) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.'
    });
  }
  
  // 헤더에 제한 정보 추가
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requestRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(requestRecord.resetTime / 1000));
  
  // 다음 미들웨어로 이동
  next();
}

/**
 * 요청 데이터 유효성 검증 미들웨어
 * 
 * @param {function} validationFn - 유효성 검증 함수
 * @returns {function} - 미들웨어 함수
 */
export function validateRequest(validationFn) {
  return (req, res, next) => {
    try {
      const result = validationFn(req);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      next();
    } catch (err) {
      console.error('Validation error:', err);
      return res.status(400).json({ error: err.message });
    }
  };
}

/**
 * Solana 지갑 주소 유효성 검증
 * 
 * @param {string} address - 검증할 지갑 주소
 * @returns {Object} - 검증 결과
 */
export function validateSolanaAddress(address) {
  if (!address) {
    return { error: 'Wallet address is required' };
  }
  
  try {
    // PublicKey 객체 생성 시도
    new PublicKey(address);
    return { valid: true };
  } catch (err) {
    return { error: 'Invalid Solana wallet address format' };
  }
}

/**
 * API 요청 로깅 미들웨어
 * 개발 환경에서만 상세 로그 출력
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 호출 함수
 */
export function apiLogger(req, res, next) {
  const start = Date.now();
  
  // 응답 완료 이벤트 리스너
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // 개발 환경에서만 요청 바디 포함 (민감 정보 제외)
    if (process.env.NODE_ENV === 'development') {
      const safeBody = { ...req.body };
      
      // 민감 정보 마스킹
      if (safeBody.wallet) {
        safeBody.wallet = `${safeBody.wallet.substring(0, 4)}...${safeBody.wallet.substring(safeBody.wallet.length - 4)}`;
      }
      
      log.body = safeBody;
    }
    
    // 오류 상태 코드의 경우 경고 또는 오류로 로깅
    if (res.statusCode >= 500) {
      console.error('API Error:', log);
    } else if (res.statusCode >= 400) {
      console.warn('API Warning:', log);
    } else {
      console.log('API Request:', log);
    }
  });
  
  next();
}

/**
 * CSRF 보호 미들웨어
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 호출 함수
 */
export function csrfProtection(req, res, next) {
  // POST, PUT, DELETE, PATCH 요청만 검사
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    
    // API 경로에 대한 허용된 출처 목록
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://tesola.xyz'
    ];
    
    // 개발 환경에서 추가 허용
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000');
    }
    
    // Origin 헤더 확인
    const isAllowedOrigin = allowedOrigins.some(allowed => 
      origin === allowed || referer.startsWith(allowed)
    );
    
    if (!isAllowedOrigin) {
      console.warn('CSRF protection: Invalid origin', { origin, referer });
      return res.status(403).json({ error: 'Forbidden - CSRF protection' });
    }
  }
  
  next();
}

/**
 * 모든 보안 미들웨어 통합
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 호출 함수
 */
export function applyApiSecurity(req, res, next) {
  // 보안 헤더 설정
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // CSRF 보호 적용
  csrfProtection(req, res, (err) => {
    if (err) return next(err);
    
    // 요청 로깅
    apiLogger(req, res, (err) => {
      if (err) return next(err);
      
      // 속도 제한 적용
      rateLimiter(req, res, next);
    });
  });
}