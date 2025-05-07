# 폰트 문제 해결 가이드

## 문제 상황
- Orbitron 폰트가 사이트 전체에 일관되게 적용되지 않고 있었습니다.
- 특히 Solana 지갑 어댑터 컴포넌트에서 DM Sans 폰트가 사용되어 불일치가 발생했습니다.

## 해결 방법

우리는 3가지 접근 방식으로 이 문제를 해결했습니다:

### 1. 로컬 폰트 파일 사용
- `/public/fonts/orbitron/` 디렉토리에 웹폰트 파일들을 추가했습니다.
- 네트워크 지연이나 로딩 실패 없이 안정적으로 폰트를 적용할 수 있습니다.

### 2. CSS 통합 파일 (`/public/essential-font-fix.css`)
- @font-face 정의를 통해 로컬 폰트 파일을 로드합니다.
- DM Sans 폰트를 Orbitron으로 재정의합니다.
- 전역 폰트 스타일을 높은 우선순위로 적용합니다.
- 월렛 어댑터 클래스를 고유 선택자로 타겟팅합니다.

### 3. JavaScript 통합 파일 (`/public/essential-font-fix.js`)
- 런타임에 DM Sans 폰트 로딩을 차단합니다.
- 동적으로 생성되는 월렛 어댑터 요소에 인라인 스타일을 적용합니다.
- MutationObserver로 새로 추가되는 DOM 요소를 감지하고 폰트를 적용합니다.

### 4. 직접 패치 스크립트 (`/scripts/simple-patch-wallet.js`)
- 빌드 시점에 node_modules의 wallet-adapter-react-ui 스타일시트를 직접 수정합니다.
- DM Sans 폰트를 Orbitron으로 변경합니다.

## 유지 관리 방법

1. 패키지 업데이트 후에는 반드시 `npm run patch-wallet`을 실행하세요:
   ```
   npm run patch-wallet
   ```

2. 폰트 관련 문제가 계속 발생한다면:
   - 개발자 도구를 열고 문제가 되는 요소의 computed 스타일을 확인하세요.
   - 어떤 CSS 선택자가 폰트를 덮어쓰고 있는지 확인하세요.
   - `/public/essential-font-fix.css`에 해당 선택자를 추가하세요.

## 주의사항

- 불필요한 폰트 관련 파일들이 있을 수 있으나, 제거되었거나 비워진 상태로 유지됩니다.
- 모든 폰트 관련 코드는 `essential-font-fix.css`와 `essential-font-fix.js`로 통합되었습니다.
- _document.js, _app.js에서 불필요한 코드를 제거하여 코드베이스를 간소화했습니다.