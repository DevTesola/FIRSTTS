# TESOLA API 아키텍처 개요

본 문서는 TESOLA 프로젝트의 API 아키텍처를 종합적으로 설명합니다. 이 아키텍처는 보안, 성능, 그리고 개발 경험을 최적화하기 위해 설계되었습니다.

## 아키텍처 개요

TESOLA API 아키텍처는 다음 주요 레이어로 구성되어 있습니다:

```
┌───────────────────────────────────┐
│        Next.js API Routes         │
└───────────────────────────────────┘
               │
┌───────────────────────────────────┐
│       API Middleware Layer        │
│  (Security, Rate Limiting, Cache) │
└───────────────────────────────────┘
               │
┌───────────────────────────────────┐
│     API Response Standardization  │
│       (Success/Error Format)      │
└───────────────────────────────────┘
               │
┌───────────────────────────────────┐
│     Database Access Layer         │
│    (Supabase Client Utilities)    │
└───────────────────────────────────┘
               │
┌───────────────────────────────────┐
│    Centralized Configuration      │
└───────────────────────────────────┘
```

## 1. 미들웨어 레이어

미들웨어 레이어는 모든 API 요청에 공통 기능을 적용합니다:

### 1.1 API 보안 (`apiSecurity.js`)

- HTTP 보안 헤더 설정
- CORS 정책 적용
- CSRF 보호
- 요청 유효성 검사

### 1.2 속도 제한 (`rateLimit.js` & `optimizedRateLimit.js`)

- 경로별 요청 속도 제한
- IP 기반 DDoS 방지
- 과도한 요청에 대한 429 응답

### 1.3 API 캐싱 (`apiCache.js`)

- GET 요청에 대한 응답 캐싱
- 경로별 맞춤형 캐싱 정책
- 캐시 헤더 최적화

### 1.4 오류 처리 (`errorHandler.js`)

- 일관된 오류 형식
- 자동 오류 로깅
- 환경별 세부 정보 조정

## 2. API 응답 표준화

모든 API 응답은 일관된 형식을 따릅니다(`apiResponses.js`):

### 2.1 성공 응답

```json
{
  "success": true,
  "data": {
    // 응답 데이터
  }
}
```

### 2.2 오류 응답

```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```

### 2.3 페이지네이션 응답

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 2,
      "pageSize": 20,
      "totalPages": 5,
      "hasMore": true
    }
  }
}
```

## 3. 데이터베이스 액세스 레이어

Supabase 데이터베이스에 접근하기 위한 최적화된 유틸리티(`supabaseClient.js`):

### 3.1 연결 관리

- 싱글톤 클라이언트 인스턴스
- 일반 권한/관리자 권한 클라이언트 분리

### 3.2 쿼리 최적화

- 쿼리 결과 캐싱
- 페이지네이션 유틸리티
- 배치 작업 지원

### 3.3 오류 처리

- 데이터베이스 오류 표준화
- API 응답 형식과 통합

## 4. 중앙 구성 관리

환경 변수 및 설정 관리를 위한 중앙화된 접근 방식(`config.js`):

### 4.1 환경별 설정

- 개발, 프로덕션, 테스트 환경 구성
- 환경 변수 검증 및 기본값

### 4.2 구성 그룹

- Supabase 설정
- Solana 네트워크 설정
- IPFS 설정
- 애플리케이션 설정

## 미들웨어 통합

### Next.js API 라우트 통합

API 라우트에 미들웨어를 쉽게 적용하기 위한 헬퍼 함수(`apiMiddleware.js`):

```javascript
import { withApiMiddleware } from '../../utils/apiMiddleware';
import { sendSuccess } from '../../utils/apiResponses';

async function handler(req, res) {
  // 비즈니스 로직...
  return sendSuccess(res, data);
}

export default withApiMiddleware(handler);
```

### 읽기 전용 API 최적화

캐싱이 포함된 읽기 전용 API 최적화:

```javascript
import { withReadOnlyApiMiddleware } from '../../utils/apiMiddleware';
import { sendSuccess } from '../../utils/apiResponses';

async function handler(req, res) {
  // 데이터 조회 로직...
  
  // 캐싱 헤더 설정
  const cacheHeaders = {
    'Cache-Control': 'public, max-age=300', // 5분 캐싱
  };
  
  return sendSuccess(res, data, 200, cacheHeaders);
}

export default withReadOnlyApiMiddleware(handler);
```

## 글로벌 웹 미들웨어

Next.js의 글로벌 미들웨어를 통한 웹 페이지 최적화(`middleware.js`):

- 모든 페이지에 보안 헤더 적용
- 정적 자산 캐싱 최적화
- 필수 리소스 사전 로드

```javascript
// middleware.js
export function middleware(request) {
  const response = NextResponse.next();
  
  // 보안 헤더 추가
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // 추가 보안 헤더...
  
  // 폰트 사전 로드
  response.headers.set(
    'Link', 
    '<https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap>; rel=preload; as=style'
  );
  
  return response;
}
```

## 개발 모범 사례

### 1. API 엔드포인트 구현 단계

1. 적절한 미들웨어 통합 선택 (기본, 읽기 전용, 또는 커스텀)
2. 요청 메서드 및 바디 검증
3. 데이터베이스 작업 수행 (필요한 경우 캐싱 활용)
4. 적절한 응답 형식으로 결과 반환
5. 오류 처리 및 로깅

### 2. 보안 고려사항

- 모든 사용자 입력 검증
- 민감한 엔드포인트에 강화된 속도 제한 적용
- CORS 및 CSRF 보호 설정 유지
- 적절한 인증 및 권한 확인

### 3. 성능 최적화

- 읽기 전용 API에 적절한 캐싱 적용
- 대량 데이터에 페이지네이션 사용
- 필요한 데이터만 조회 및 반환
- 배치 처리 사용하여 데이터베이스 부하 감소

## 구현 디렉토리 구조

```
├── middleware/
│   ├── index.js            # 미들웨어 통합 및 내보내기
│   ├── apiSecurity.js      # API 보안 미들웨어
│   ├── rateLimit.js        # 기본 속도 제한
│   ├── optimizedRateLimit.js # 고급 속도 제한
│   ├── apiCache.js         # 응답 캐싱
│   ├── errorHandler.js     # 오류 처리
│   └── securityUtils.js    # 보안 유틸리티 
│
├── utils/
│   ├── apiResponses.js     # 응답 형식 유틸리티
│   ├── apiMiddleware.js    # API 미들웨어 헬퍼
│   ├── supabaseClient.js   # 데이터베이스 클라이언트
│   └── config.js           # 환경 구성
│
├── pages/api/              # API 엔드포인트
└── middleware.js           # Next.js 글로벌 미들웨어
```

## 배포 고려사항

### 프로덕션 환경에서의 미들웨어 구성

1. **환경 변수 설정**:
   - API 키와 비밀 설정
   - 프로덕션 모드 활성화
   - 허용된 CORS 출처 제한

2. **속도 제한 조정**:
   - 민감한 API에 대한 더 엄격한 제한 설정
   - IP 기반 글로벌 제한 조정

3. **캐싱 최적화**:
   - 적절한 Cache-Control 헤더 설정
   - 외부 캐시 저장소 구성 (필요한 경우)

## 확장 방향

현재 아키텍처는 다음과 같은 확장이 가능합니다:

1. **Redis 통합**:
   - 분산 속도 제한
   - 공유 캐싱 저장소

2. **JWT 인증**:
   - 전용 인증 미들웨어
   - 역할 기반 접근 제어

3. **로깅 및 모니터링**:
   - 외부 로깅 서비스 통합
   - API 사용량 메트릭 수집

4. **API 문서**:
   - OpenAPI/Swagger 통합
   - 자동 문서 생성

## 결론

TESOLA API 아키텍처는 보안, 성능, 개발 경험을 균형있게 고려하여 설계되었습니다. 중앙화된 미들웨어 및 유틸리티 접근 방식을 통해 코드 중복을 줄이고 일관된 API 동작을 보장합니다. 이 아키텍처는 프로젝트가 성장함에 따라 더 많은 기능과 최적화로 확장될 수 있습니다.