# TESOLA API 미들웨어 가이드

이 문서는 TESOLA 프로젝트의 API 미들웨어 사용법과 주요 기능에 대해 설명합니다.

## 미들웨어 구조

TESOLA 프로젝트는 다음과 같은 미들웨어 컴포넌트를 제공합니다:

1. **apiSecurity** - 기본 보안 헤더, CORS 설정, CSRF 보호
2. **rateLimit** - API 요청 속도 제한
3. **apiCache** - GET 요청 캐싱 (선택적)
4. **errorHandler** - 일관된 오류 응답 포맷 제공

## 미들웨어 사용법

### 1. 기본 API 미들웨어 적용

모든 API에 기본 보안, 속도 제한 및 오류 처리 적용:

```javascript
import { withApiMiddleware } from '../../utils/apiMiddleware';
import { sendSuccess } from '../../utils/apiResponses';

async function handler(req, res) {
  // API 로직 구현
  return sendSuccess(res, { message: 'Success' });
}

// 미들웨어 적용
export default withApiMiddleware(handler);
```

### 2. 읽기 전용 API 미들웨어 적용 (캐싱 포함)

GET 요청에 대한 캐싱을 포함한 읽기 전용 API:

```javascript
import { withReadOnlyApiMiddleware } from '../../utils/apiMiddleware';
import { sendSuccess } from '../../utils/apiResponses';

async function handler(req, res) {
  // API 로직 구현
  
  // 캐싱 헤더 설정
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=300', // 5분 캐싱
  };
  
  return sendSuccess(res, { data: 'some data' }, 200, cacheHeaders);
}

// 미들웨어 적용
export default withReadOnlyApiMiddleware(handler);
```

### 3. 커스텀 미들웨어 체인 적용

특정 API에 맞는 커스텀 미들웨어 체인 구성:

```javascript
import { withCustomMiddleware } from '../../utils/apiMiddleware';
import { apiSecurity, rateLimit, errorHandler } from '../../middleware';
import myCustomMiddleware from './myCustomMiddleware';

async function handler(req, res) {
  // API 로직 구현
}

// 커스텀 미들웨어 체인 적용
export default withCustomMiddleware([
  apiSecurity,
  myCustomMiddleware, // 커스텀 미들웨어
  rateLimit,
  errorHandler
], handler);
```

## API 응답 포맷

모든 API 응답은 다음과 같은 일관된 포맷을 따릅니다:

### 성공 응답

```json
{
  "success": true,
  "data": {
    // 응답 데이터
  }
}
```

### 오류 응답

```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```

## 미들웨어 구성 옵션

### 속도 제한 구성

`/middleware/rateLimit.js` 파일에서 다음 설정을 변경할 수 있습니다:

- `pathLimits` - 경로별 속도 제한 설정
- `default` - 기본 속도 제한 설정 (1분당 60회)

```javascript
const pathLimits = {
  // 기본 제한: 1분당 60회 요청 (초당 1회)
  default: { windowMs: 60 * 1000, maxRequests: 60 },
  
  // 민감한 API에 대한 제한: 1분당 10회 요청
  '/api/purchaseNFT': { windowMs: 60 * 1000, maxRequests: 10 },
  // 더 많은 경로 설정...
};
```

### 캐싱 구성

`/middleware/apiCache.js` 파일에서 다음 설정을 변경할 수 있습니다:

- `cacheDuration` - 기본 캐시 지속 시간
- `cacheByPathPattern` - 경로 패턴별 캐시 지속 시간

### 보안 구성

`/middleware/apiSecurity.js` 파일에서 다음 설정을 변경할 수 있습니다:

- `allowedOrigins` - CORS 허용 출처 목록

## 모범 사례

1. 모든 API 엔드포인트에 미들웨어를 적용하세요.
2. 읽기 전용 API에는 `withReadOnlyApiMiddleware`를 사용하세요.
3. 데이터를 변경하는 API에는 `withApiMiddleware`를 사용하세요.
4. 오류 처리를 위해 항상 `sendSuccess`와 `sendError` 함수를 사용하세요.
5. 적절한 HTTP 상태 코드와 오류 코드를 반환하세요.
6. 캐싱 헤더를 통해 성능을 최적화하세요.