# TESOLA 서버 사이드 렌더링(SSR) 문제 해결 가이드

이 문서는 TESOLA 프로젝트의 서버 사이드 렌더링(SSR) 관련 문제를 해결하는 방법을 설명합니다. 특히 Vercel 배포 시 발생하는 500 오류에 초점을 맞추고 있습니다.

## 문제점

Vercel에 배포할 때 다음과 같은 문제가 발생할 수 있습니다:

1. **클라이언트 API 접근 오류**: SSR 중에 `window`, `document`, `localStorage` 등 브라우저 전용 API 접근으로 인한 오류
2. **미들웨어 충돌**: 다양한 미들웨어 설정 간의 충돌 (특히 Content-Security-Policy 헤더)
3. **메모리 누수**: 서버리스 환경에서의 메모리 관리 문제
4. **캐싱 및 성능 이슈**: 비효율적인 캐싱으로 인한 성능 저하

## 주요 변경사항

### 1. 클라이언트 측 유틸리티 함수 추가

클라이언트 측 코드를 안전하게 실행하기 위한 `clientSideUtils.js` 파일을 추가했습니다:

```javascript
// utils/clientSideUtils.js
export const isClient = typeof window !== 'undefined';

export function safeClientSide(fn, fallbackValue = null) {
  if (isClient) {
    try {
      return fn();
    } catch (error) {
      console.error('클라이언트 측 실행 오류:', error);
      return fallbackValue;
    }
  }
  return fallbackValue;
}
```

이 유틸리티는 다음과 같은 함수들을 제공합니다:
- `isClient`: 클라이언트 환경인지 확인
- `safeClientSide`: 클라이언트 측에서만 함수 실행
- `safeLocalStorage`: localStorage 안전하게 접근
- `safeNavigator`: navigator 속성 안전하게 접근
- `getConnectionInfo`: 연결 정보 안전하게 가져오기
- `getWindowDimensions`: 윈도우 크기 안전하게 가져오기

### 2. 컴포넌트 수정

브라우저 API를 사용하는 컴포넌트를 수정했습니다:

1. **AnalyticsProvider.jsx**:
   - `localStorage` 접근을 안전하게 처리
   - 클라이언트 측에서만 실행되도록 수정

2. **BackgroundVideo.jsx**:
   - `navigator.connection` 접근을 안전하게 처리
   - 이벤트 리스너를 클라이언트 측에서만 추가하도록 수정

3. **Layout.jsx**:
   - `window` 객체 접근을 확인 후 처리
   - 키보드 이벤트 리스너를 클라이언트 측에서만 추가

### 3. 미들웨어 구성 수정

미들웨어 충돌을 방지하기 위해 다음 부분을 수정했습니다:

1. **middleware.js**:
   - matcher 패턴을 더 정확하게 수정하여 API 경로와의 충돌 방지
   - 필요한 정적 자산 경로를 제외 목록에 추가

2. **next.config.cjs**:
   - Content-Security-Policy 헤더를 루트 미들웨어와 일관되게 설정
   - 서버 사이드 렌더링 최적화를 위한 웹팩 설정 추가

### 4. Next.js 구성 최적화

Next.js 구성을 최적화했습니다:

1. **컴파일러 설정**:
   - `swcMinify: true`: SWC 컴파일러를 사용한 최적화
   - 프로덕션 환경에서 콘솔 로그 제거 설정

2. **웹팩 설정**:
   - SSR 중 클라이언트 API 접근 문제 해결을 위한 엔트리 포인트 설정
   - clientSideUtils를 메인 엔트리에 추가하여 모든 페이지에서 사용 가능하도록 함

## 사용 방법

### 클라이언트 API 안전하게 사용하기

```javascript
import { isClient, safeClientSide } from "../utils/clientSideUtils";

// 잘못된 방법
if (typeof window !== 'undefined') {
  // window 사용...
}

// 올바른 방법
if (isClient) {
  // window 사용...
}

// 더 좋은 방법
const result = safeClientSide(() => {
  // 클라이언트 코드 실행
  return window.innerWidth;
}, 1200); // 서버 측 기본값
```

### localStorage 안전하게 사용하기

```javascript
import { safeLocalStorage, safeSetLocalStorage } from "../utils/clientSideUtils";

// 잘못된 방법
const value = localStorage.getItem('my_key');

// 올바른 방법
const value = safeLocalStorage('my_key', 'default_value');
safeSetLocalStorage('my_key', 'new_value');
```

### useEffect에서 클라이언트 API 안전하게 사용하기

```javascript
useEffect(() => {
  if (!isClient) return;
  
  // 클라이언트 측 코드...
  
}, [dependencies]);
```

## 문제 해결 가이드

### 500 오류가 계속 발생하는 경우

1. **컴포넌트 검사**: 모든 컴포넌트가 `window`, `document`, `navigator` 등의 API를 안전하게 접근하는지 확인
2. **미들웨어 충돌 확인**: API 경로와 페이지 경로에 대한 미들웨어 설정이 일관되게 적용되는지 확인
3. **환경 변수 점검**: 필요한 모든 환경 변수가 Vercel 프로젝트에 설정되어 있는지 확인
4. **배포 로그 분석**: Vercel 대시보드에서 빌드 및 배포 로그를 검토하여 오류 메시지 확인

### 배포 전 테스트

1. **프로덕션 빌드 테스트**:
   ```bash
   npm run build
   npm run start
   ```

2. **정적 내보내기 테스트**:
   ```bash
   npm run build
   npm run export
   ```

### Vercel 대시보드 설정

1. **빌드 설정**:
   - 빌드 명령어: `npm run build`
   - 출력 디렉토리: `.next`

2. **환경 변수**:
   - 모든 필수 환경 변수가 설정되어 있는지 확인

### 다중 프로젝트 충돌 해결

동일한 코드베이스를 여러 Vercel 프로젝트에 배포할 때 충돌이 발생할 수 있습니다:

1. **기존 프로젝트 연결 해제**:
   ```bash
   vercel unlink
   ```

2. **새 프로젝트와 연결**:
   ```bash
   vercel link --scope your-team --project new-project-name
   ```

3. **환경 변수 가져오기**:
   ```bash
   vercel env pull
   ```

4. **배포**:
   ```bash
   vercel --prod
   ```

## 결론

이 가이드에 따라 SSR 관련 문제를 해결하고 Vercel에서 안정적으로 애플리케이션을 배포할 수 있습니다. 문제가 지속되면 Vercel 지원팀에 문의하거나 프로젝트 특성에 맞게 추가 최적화를 진행하세요.