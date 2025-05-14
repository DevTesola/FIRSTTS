# 통합 NFT 스테이킹 구현 가이드

이 문서는 NFT 스테이킹 기능의 통합 구현에 대한 기술적 가이드입니다. 기존에 분리되어 있던 여러 스테이킹 방식을 하나로 통합하고, 두 가지 주요 버그를 수정했습니다.

## 1. 수정된 주요 문제

### 1.1 IDL 파싱 오류 해결

**문제**: Anchor IDL의 `vec<pubkey>` 타입을 JavaScript에서 처리할 수 없어 발생하는 오류
```
Cannot use 'in' operator to search for 'vec' in pubkey
```

**해결**: 
- `prepareIdlForAnchor` 함수를 사용하여 IDL의 `vec<pubkey>` 타입을 JavaScript에서 처리 가능한 형식으로 변환
- 모든 `vec<pubkey>` 타입을 `bytes[]`로 변환하여 클라이언트에서 문제 없이 처리할 수 있도록 함

**구현 위치**:
- `/shared/utils/idl-helper.js` - IDL 변환 유틸리티 함수 구현
- `/pages/api/staking/prepareStaking-anchor-fixed.js` - API 엔드포인트에 적용

### 1.2 에스크로 계정 초기화 오류 해결

**문제**: 에스크로 토큰 계정 초기화 시 매개변수 순서가 잘못되어 발생하는 오류
```
Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL failed: Provided owner is not allowed
```

**해결**:
- `createAssociatedTokenAccountInstruction` 함수 호출 시 매개변수 순서 수정
- 올바른 순서: payer, newAccountPubkey, owner, mint
- 특히 `owner` 매개변수에 올바른 PDA 값을 전달하도록 수정

**구현 위치**:
- `/pages/api/staking/prepareStaking-anchor-fixed.js` - 에스크로 토큰 계정 초기화 부분 수정

### 1.3 UI 통합

**문제**: 사용자 혼란을 야기하는 여러 스테이킹 버튼 및 방식 존재

**해결**:
- 두 개의 스테이킹 버튼("3단계 초기화 방식"과 "기존 방식")을 하나의 통합된 버튼으로 통합
- 항상 가장 안정적인 3단계 방식을 사용하도록 수정

**구현 위치**:
- `/components/StakingComponent.jsx` - UI 컴포넌트 수정

## 2. 통합 구현 세부 사항

### 2.1 IDL 처리 개선

IDL 처리를 위한 핵심 함수 구현:

```javascript
function prepareIdlForAnchor(idl) {
  const fixedIdl = JSON.parse(JSON.stringify(idl)); // 깊은 복사
  
  // 계정 타입 처리
  if (fixedIdl.accounts) {
    fixedIdl.accounts.forEach(account => {
      if (account.type && account.type.fields) {
        account.type.fields.forEach(field => {
          // vec<pubkey> 타입 변환
          if (field.type && typeof field.type === 'object' && field.type.vec === 'pubkey') {
            field.type = "bytes";
            field.isArray = true;
          }
        });
      }
    });
  }
  
  // 기타 타입 처리...
  
  return fixedIdl;
}
```

### 2.2 에스크로 계정 초기화 수정

에스크로 토큰 계정 초기화 코드 수정:

```javascript
// 올바른 매개변수 순서 사용
createAssociatedTokenAccountInstruction(
  walletPubkey,          // payer (트랜잭션 비용 지불자)
  escrowTokenAccount,    // newAccountPubkey (생성할 ATA 계정)
  escrowAuthorityPDA,    // owner (토큰 계정의 소유자 - 반드시 PDA)
  mintPubkey             // mint (토큰 민트 주소)
)
```

### 2.3 단일 스테이킹 버튼 통합

UI 컴포넌트에서 두 개의 버튼을 하나로 통합:

```jsx
{/* 통합된 단일 스테이킹 버튼 */}
<button
  onClick={() => {
    // Check token account first
    if (tokenAccountStatus !== 'ready') {
      checkTokenAccount();
    } else {
      // 항상 3단계 방식 사용 (가장 안정적인 방식)
      handleThreePhaseStaking();
    }
  }}
  // 스타일 및 기타 속성...
>
  NFT 스테이킹 ({stakingPeriod}일)
</button>
```

## 3. 스테이킹 워크플로우

통합된 스테이킹 워크플로우는 다음 단계를 따릅니다:

1. **계정 확인 단계**
   - 사용자 토큰 계정
   - 에스크로 토큰 계정
   - 사용자 스테이킹 정보 계정

2. **초기화 단계** (필요한 경우)
   - Phase 1: 토큰 계정 초기화 (사용자 및 에스크로)
   - Phase 2: 사용자 스테이킹 정보 초기화

3. **스테이킹 실행 단계**
   - Phase 3: 실제 스테이킹 트랜잭션 실행

4. **결과 확인 단계**
   - 스테이킹 정보 확인
   - 에스크로 토큰 계정 확인

## 4. 개발 시 참고 사항

### 4.1 IDL 처리 관련

- Anchor 프로그램을 초기화할 때 항상 `prepareIdlForAnchor` 함수를 사용하여 IDL을 처리해야 합니다.
- IDL에 새로운 `vec<pubkey>` 타입 필드가 추가되면 `idl-helper.js`에 특별 케이스 처리를 추가해야 할 수 있습니다.

### 4.2 토큰 계정 초기화 관련

- 에스크로 토큰 계정 초기화 시 매개변수 순서를 항상 주의해야 합니다.
- 소유자 매개변수에는 반드시 PDA를 사용해야 합니다.

### 4.3 트랜잭션 시뮬레이션

- 실제 트랜잭션을 제출하기 전에 항상 트랜잭션 시뮬레이션을 수행하는 것이 좋습니다.
- 시뮬레이션을 통해 오류를 미리 감지하고 사용자에게 적절한 피드백을 제공할 수 있습니다.

## 5. 결론

이 통합 구현은 두 가지 주요 문제(IDL 파싱 오류, 에스크로 계정 초기화 오류)를 해결하고 사용자 경험을 개선했습니다. 또한 코드 중복을 줄이고 유지 관리가 용이한 단일 스테이킹 워크플로우를 제공합니다.

향후 개발 시 이 문서에 설명된 패턴을 따라 오류 없는 스테이킹 기능을 구현할 수 있습니다.