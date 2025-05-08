# Vercel 배포 500 오류 해결 가이드

이 문서는 Vercel에 배포 시 발생하는 500 오류(`No fetch event listeners found`) 문제의 해결 방법을 설명합니다.

## 발생한 문제

Vercel에 배포 시 다음 오류가 발생했습니다:
```
Error running the exported Web Handler: [Error: No fetch event listeners found]
```

이 오류는 주로 다음과 같은 원인에서 발생합니다:
1. 서비스 워커와 Vercel 서버리스 함수 간의 충돌
2. Next.js 14 버전에서의 미들웨어 처리 방식 변경
3. 여러 fetch 이벤트 리스너 간의 충돌

## 적용된 해결책

1. **서비스 워커 비활성화**
   - `_document.js`에서 `/register-sw.js` 스크립트를 비활성화
   - 서비스 워커 등록 해제를 위한 `swr-patch.js` 스크립트 추가

2. **미들웨어 단순화**
   - `middleware.js` 파일을 간소화하여 기본 헤더만 설정
   - Content-Security-Policy 헤더를 간소화하여 충돌 방지

3. **Next.js 설정 업데이트**
   - `next.config.cjs`에 런타임 설정 추가:
     ```javascript
     experimental: {
       serverComponents: false,
       runtime: 'nodejs',
     }
     ```
   - Node.js 런타임 사용 (Edge 런타임 대신)
   - 서버 컴포넌트 비활성화

## 앞으로의 주의사항

1. **서비스 워커 사용 시 주의**
   - Vercel에 배포할 때는 서비스 워커 사용을 자제하거나 충돌을 방지하는 설정 필요
   - `register-sw.js`에 조건부 등록 로직 추가 (`hostname !== 'vercel.app'` 등)

2. **미들웨어 설정**
   - 미들웨어는 최소한의 필수 기능만 포함하도록 유지
   - 복잡한 헤더 설정은 충돌을 유발할 수 있음

3. **이중 프로젝트 배포**
   - 동일한 코드베이스를 여러 Vercel 프로젝트에 배포할 때 충돌 방지 필요
   - 새 프로젝트 배포 시 이전 연결 해제 권장:
     ```bash
     vercel unlink
     vercel link --scope your-team --project new-project-name
     ```

## 기술적 상세 설명

### 서비스 워커와 미들웨어 충돌

Next.js 14와 Vercel의 서버리스 환경에서, 서비스 워커의 fetch 이벤트 리스너는 Vercel의 내부 미들웨어 시스템과 충돌할 수 있습니다. Vercel은 내부적으로 fetch API를 사용하여 요청을 처리하며, 이 과정에서 서비스 워커의 fetch 이벤트 리스너와 충돌이 발생할 수 있습니다.

```javascript
// 서비스 워커의 fetch 이벤트 리스너 (충돌 발생 가능)
self.addEventListener('fetch', (event) => {
  // 이 코드가 Vercel의 내부 처리와 충돌
});
```

### 미들웨어 매처 패턴

미들웨어의 매처 패턴이 너무 광범위하면 API 라우트나 정적 자산 요청과 충돌할 수 있습니다. 더 정확한 매처 패턴을 사용하여 충돌을 방지합니다:

```javascript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Node.js 런타임 사용

Vercel의 Edge 런타임 대신 Node.js 런타임을 사용하면 더 안정적인 배포가 가능합니다:

```javascript
experimental: {
  serverComponents: false,
  runtime: 'nodejs',
}
```

이렇게 하면 전통적인 서버리스 함수를 사용하여 요청을 처리하고, Edge 런타임과의 충돌을 방지할 수 있습니다.