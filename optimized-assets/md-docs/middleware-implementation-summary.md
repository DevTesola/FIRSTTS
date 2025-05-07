# TESOLA API 미들웨어 구현 요약

본 문서는 TESOLA 프로젝트의 API 보안 및 성능 최적화를 위한 미들웨어 구현에 관한 요약입니다.

## 구현 목표

1. **보안 강화**: API 엔드포인트에 일관된 보안 기능 적용
2. **트래픽 관리**: 과도한 요청으로부터 시스템 보호
3. **성능 최적화**: 적절한 캐싱 및 헤더 최적화
4. **일관된 오류 처리**: 모든 API에서 일관된 오류 응답 형식 제공
5. **코드 재사용**: 미들웨어 기능을 중앙화하여 코드 중복 방지

## 구현된 미들웨어

### 1. API 보안 미들웨어 (`apiSecurity.js`)

- **보안 HTTP 헤더** - XSS, CSRF, Clickjacking 방지를 위한 헤더 설정
- **CORS 정책** - 허용된 도메인에서만 API 접근 가능하도록 설정
- **요청 검증** - 유효하지 않은 콘텐츠 타입이나 메서드 거부

```javascript
// 보안 헤더 적용 예시
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
```

### 2. 속도 제한 미들웨어 (`rateLimit.js`)

- **경로별 속도 제한** - 각 API 엔드포인트에 대한 맞춤형 속도 제한 설정
- **글로벌 IP 제한** - DDoS 공격 방지를 위한 IP 기반 제한
- **메모리 기반 추적** - 메모리 내 요청 추적으로 빠른 성능 유지
- **자동 정리** - 만료된 요청 카운터 자동 정리 메커니즘

```javascript
// 경로별 속도 제한 설정 예시
const pathLimits = {
  // 기본 제한: 1분당 60회 요청 (초당 1회)
  default: { windowMs: 60 * 1000, maxRequests: 60 },
  
  // 민감한 API에 대한 제한: 1분당 10회 요청
  '/api/purchaseNFT': { windowMs: 60 * 1000, maxRequests: 10 },
};
```

### 3. API 캐싱 미들웨어 (`apiCache.js`)

- **메모리 기반 캐싱** - 자주 액세스하는 API 응답의 메모리 내 캐싱
- **경로별 캐싱 구성** - API 경로에 따른 맞춤형 캐시 지속 시간
- **캐시 헤더 최적화** - 적절한 캐시 제어 헤더 자동 설정
- **조건부 캐싱** - GET 요청에만 캐싱 적용 및 특정 헤더 존재 시 캐싱 건너뛰기

### 4. 오류 처리 미들웨어 (`errorHandler.js`)

- **일관된 오류 응답** - 모든 API 오류에 대한 일관된 JSON 응답 형식
- **자동 로깅** - 모든 오류의 자동 로깅 및 심각도 분류
- **개발 모드 지원** - 개발 환경에서 더 자세한 오류 정보 제공
- **HTTP 상태 코드 매핑** - 오류 유형에 따른 적절한 HTTP 상태 코드 반환

```javascript
// 일관된 오류 응답 형식
{
  success: false,
  error: "오류 메시지",
  code: "ERROR_CODE"
}
```

## 유틸리티 구현

### 1. API 응답 유틸리티 (`apiResponses.js`)

다음과 같은 표준화된 API 응답 함수 제공:

- `sendSuccess` - 성공 응답 생성
- `sendError` - 오류 응답 생성
- `handleSupabaseError` - Supabase 오류 처리
- `validateMethod` - HTTP 메서드 검증
- `validateBody` - 요청 바디 검증
- `validateQuery` - 쿼리 파라미터 검증
- `withErrorHandling` - API 핸들러를 위한 오류 처리 래퍼

### 2. API 미들웨어 유틸리티 (`apiMiddleware.js`)

Next.js API 라우트에 미들웨어 체인을 쉽게 적용할 수 있게 해주는 헬퍼 함수:

- `withApiMiddleware` - 기본 API 미들웨어 적용 (보안, 속도 제한, 오류 처리)
- `withReadOnlyApiMiddleware` - 읽기 전용 API 미들웨어 적용 (보안, 속도 제한, 캐싱, 오류 처리)
- `withCustomMiddleware` - 커스텀 미들웨어 체인 적용

## 구현 효과

1. **보안 강화**
   - 모든 API 엔드포인트에 일관된 보안 헤더 적용
   - CSRF, XSS 보호 기능 표준화
   - 요청 검증 및 필터링 자동화

2. **성능 최적화**
   - 읽기 전용 API에 자동 캐싱 적용으로 서버 부하 감소
   - 효율적인 속도 제한으로 서버 자원 보호
   - 클라이언트 측 캐싱을 위한 최적의 헤더 설정

3. **개발 효율성**
   - 중앙화된 미들웨어 구현으로 코드 중복 제거
   - 간소화된 API 구현 방식 제공
   - 일관된 오류 처리 패턴 적용

4. **유지보수성**
   - 미들웨어 로직 분리로 코드 가독성 향상
   - 변경 사항을 한 곳에서 관리 가능
   - 세부 구현을 숨기고 간단한 인터페이스 제공

## 사용 예시

```javascript
// 새로운 API 엔드포인트 구현 예시

import { withReadOnlyApiMiddleware } from '../../utils/apiMiddleware';
import { sendSuccess, validateMethod } from '../../utils/apiResponses';

async function handler(req, res) {
  // HTTP 메서드 검증 (GET만 허용)
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }
  
  // API 로직 구현
  const data = { /* ... */ };
  
  // 캐싱 헤더 설정
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=300', // 5분 캐싱
  };
  
  // 성공 응답 반환
  return sendSuccess(res, data, 200, cacheHeaders);
}

// 미들웨어 적용
export default withReadOnlyApiMiddleware(handler);
```

## 향후 개선 사항

1. **Redis 기반 속도 제한** - 분산 환경에서의 속도 제한 지원을 위한 Redis 통합
2. **JWT 검증 미들웨어** - 토큰 기반 인증을 위한 전용 JWT 검증 미들웨어
3. **메트릭 수집** - API 사용량 및 성능 메트릭 수집 기능
4. **자동 문서화** - API 엔드포인트 자동 문서화 시스템 통합