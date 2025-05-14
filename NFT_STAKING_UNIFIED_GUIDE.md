# NFT 스테이킹 통합 가이드

## 문제 해결 및 통합 스테이킹 구현

이 문서는 NFT 스테이킹 과정에서 발생하던 두 가지 주요 오류를 해결하고 통합된 스테이킹 경험을 제공하는 방법을 설명합니다.

### 1. 해결된 문제점

#### 1.1 IDL 파싱 오류: vec<pubkey> 타입 문제

Solana Anchor 프로그램에서 `vec<pubkey>` 타입을 사용할 때 JavaScript 클라이언트에서 파싱 오류가 발생했습니다:

```
Cannot use 'in' operator to search for 'vec' in pubkey
```

이 문제는 Anchor IDL의 특정 타입 표현과 JavaScript의 호환성 문제로 인해 발생했습니다.

#### 1.2 에스크로 계정 초기화 오류: IllegalOwner 오류

토큰 계정 생성 시 매개변수 순서가 잘못되어 에스크로 계정이 제대로 초기화되지 않는 문제가 있었습니다:

```
Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL failed: Provided owner is not allowed
```

이 오류는 Associated Token Account(ATA) 생성 시 매개변수 순서가 잘못되어 발생했습니다.

### 2. 통합 솔루션

#### 2.1 IDL 파싱 오류 수정

`prepareIdlForAnchor` 함수를 구현하여 IDL의 `vec<pubkey>` 타입을 JavaScript 호환 가능한 형태로 변환했습니다:

```javascript
function prepareIdlForAnchor(idlObj) {
  // 원본 IDL을 변경하지 않기 위해 깊은 복사 수행
  const fixedIdl = JSON.parse(JSON.stringify(idlObj));
  
  // vec<pubkey>를 bytes[]로 변환하는 처리
  // 1. 계정 타입 처리
  // 2. 일반 타입 처리
  // 3. 명령어 인자 처리
  
  return fixedIdl;
}
```

#### 2.2 에스크로 계정 초기화 오류 수정

Associated Token Account 생성 명령어의 매개변수 순서를 올바르게 수정했습니다:

```javascript
// 올바른 순서: 페이어, 생성할 계정, 소유자(PDA), 민트
createAssociatedTokenAccountInstruction(
  walletPubkey,          // payer (트랜잭션 비용 지불자)
  escrowTokenAccount,    // newAccountPubkey (생성할 ATA 계정)
  escrowAuthorityPDA,    // owner (토큰 계정의 소유자 - 반드시 PDA)
  mintPubkey             // mint (토큰 민트 주소)
)
```

### 3. 통합 구현 가이드

#### 3.1 통합 스테이킹 모듈 사용 방법

새롭게 구현된 통합 스테이킹 모듈(`unified-staking.js`)을 사용하면 두 가지 오류를 모두 해결할 수 있습니다:

```javascript
// 1. 모듈 가져오기
const { prepareStakingTransaction } = require('../shared/utils/staking/unified-staking');

// 2. 통합 스테이킹 트랜잭션 준비
const result = await prepareStakingTransaction(
  connection,
  provider,
  walletPubkey,
  mintPubkey,
  stakingPeriod,
  nftTierIndex,
  nftStakingIdl
);

// 3. 결과 확인 및 트랜잭션 처리
if (result.success) {
  // 계정 초기화가 필요한 경우
  if (result.requiredPhases.phase1) {
    // phase1 트랜잭션 처리 (토큰 계정 초기화)
    await processTransaction(result.transactions.phase1);
  }
  
  // 스테이킹 트랜잭션 처리
  await processTransaction(result.transactions.phase3);
}
```

#### 3.2 통합 스테이킹 버튼 사용 방법

UI에서는 `UnifiedStakingButton` 컴포넌트를 통해 간단하게 통합 스테이킹 경험을 제공할 수 있습니다:

```jsx
import EnhancedStakingButton from "./staking/EnhancedStakingButton";

// 컴포넌트 사용 예시
<EnhancedStakingButton
  nft={nft}
  stakingPeriod={stakingPeriod}
  onSuccess={handleSuccess}
  onError={handleError}
  onStartLoading={() => setLoading(true)}
  onEndLoading={() => setLoading(false)}
  disabled={!verifiedOwnership || transactionInProgress}
/>
```

### 4. 통합 API 엔드포인트

새로운 통합 API 엔드포인트를 통해 클라이언트와 서버 간 일관된 통합 스테이킹 경험을 제공합니다:

- `unified-staking.js`: 스테이킹 준비 API 엔드포인트
- `completeStaking-unified.js`: 스테이킹 완료 기록 API 엔드포인트

### 5. 코드 레퍼런스

통합 구현이 적용된 주요 파일 목록:

1. `/shared/utils/staking/unified-staking.js`: 통합 스테이킹 핵심 모듈
2. `/shared/utils/idl-helper.js`: IDL 파싱 유틸리티
3. `/components/staking/UnifiedStakingButton.jsx`: 통합 UI 컴포넌트
4. `/components/staking/EnhancedStakingButton.jsx`: 래퍼 컴포넌트
5. `/pages/api/staking/unified-staking.js`: 통합 API 엔드포인트
6. `/pages/api/staking/completeStaking-unified.js`: 완료 API 엔드포인트

### 6. 트러블슈팅

통합 스테이킹 구현 중 문제가 발생할 경우 다음 항목을 확인하세요:

1. IDL의 `vec<pubkey>` 필드가 모두 `bytes[]`로 변환되었는지 확인
2. 에스크로 계정 초기화 시 매개변수 순서가 올바른지 확인
3. 사용자 스테이킹 정보 계정이 올바르게 초기화되는지 확인
4. 모든 필요한 계정이 트랜잭션 전에 초기화되는지 확인
5. 트랜잭션 시뮬레이션을 통해 오류를 미리 확인

이 가이드를 따라 NFT 스테이킹 기능을 구현하면 사용자에게 더 안정적인 스테이킹 경험을 제공할 수 있습니다.