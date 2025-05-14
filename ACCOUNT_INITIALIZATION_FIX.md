# NFT 스테이킹 시스템 계정 초기화 문제 해결

## 문제 개요

NFT 스테이킹 시스템에서 다음과 같은 오류가 발생했습니다:

1. **AccountNotInitialized (Error Code: 3012)**: 스테이킹 과정에서 필요한 계정이 올바르게 초기화되지 않음
2. **TypeError: Cannot read properties of undefined (reading 'size')**: Anchor 프로그램 초기화 과정에서 IDL의 계정 크기 누락
3. **Cannot use 'in' operator to search for 'vec' in pubkey**: PublicKey 벡터 타입 처리 오류

이러한 오류들은 사용자가 NFT를 스테이킹할 때 트랜잭션 실패로 이어졌습니다.

## 해결 방법

### 1. IDL 문제 해결 (fix-idl-issues.js)

IDL(Interface Description Language)의 구조적 문제를 해결하기 위해 `fix-idl-issues.js` 스크립트를 생성했습니다:

- 모든 계정 타입에 `size` 속성 추가 (기본값: 1024)
- `vec pubkey` 타입을 `array pubkey` 형식으로 변환
- 수정된 IDL을 `nft_staking_updated.json` 파일로 저장

### 2. 프로그램 초기화 유틸리티 (program-initializer.js)

Anchor 프로그램 초기화 과정을 안정화하기 위한 전문 유틸리티 모듈을 개발했습니다:

- 수정된 IDL 또는 원본 IDL 중 선택할 수 있는 옵션 제공
- 프로그램 초기화 과정의 오류 처리 개선
- 초기화 로그 활성화 옵션

### 3. 토큰 계정 초기화 검증 강화

토큰 계정 초기화 상태를 더 정확하게 검증하기 위한 로직을 구현했습니다:

- 계정 존재 여부 확인
- 적절한 데이터 크기 검증
- 올바른 소유자 및 민트 주소 확인
- 충분한 토큰 잔액 확인 (NFT의 경우 1)

## 구현 파일

### 새로 생성된 파일

1. **fix-idl-issues.js**
   - IDL 문제를 해결하고 업데이트된 IDL 파일 생성
   - 실행 방법: `node fix-idl-issues.js`

2. **idl/nft_staking_updated.json**
   - 수정된 IDL 파일 (size 속성 및 타입 수정 적용)

3. **shared/utils/program-initializer.js**
   - Anchor 프로그램 초기화를 위한 안정적인 유틸리티
   - 계정 초기화 상태 확인 함수 포함

### 수정된 파일

1. **pages/api/getStakingInfo.js**
   - 새로운 프로그램 초기화 유틸리티 적용
   - 계정 파싱 로직 안정화

## 사용 예시

### 프로그램 초기화

```javascript
import { initializeStakingProgram } from '../../shared/utils/program-initializer';

// Anchor 프로그램 초기화
const program = initializeStakingProgram({
  connection,  // Solana 연결 객체
  wallet,      // 사용자 지갑 (선택사항)
  useUpdatedIdl: true,  // 수정된 IDL 사용
  enableLogs: true      // 로그 활성화
});

// 프로그램 사용
if (program) {
  // 계정 정보 조회
  const stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  
  // 스테이킹 명령 실행
  await program.methods
    .stakeNft(stakingPeriod, nftTier, autoCompound)
    .accounts({...})
    .rpc();
}
```

### 토큰 계정 초기화 상태 확인

```javascript
import { checkTokenAccountInitialized } from '../../shared/utils/program-initializer';

// 토큰 계정 초기화 상태 확인
const isInitialized = await checkTokenAccountInitialized(
  connection,
  walletPubkey,
  mintPubkey
);

if (!isInitialized) {
  // 토큰 계정 초기화 로직 실행
  // ...
}
```

## 결론

이 솔루션은 스테이킹 과정에서 발생하는 계정 초기화 오류를 해결하기 위한 종합적인 접근법을 제공합니다. IDL 문제 해결, 프로그램 초기화 프로세스 개선, 그리고 토큰 계정 검증 강화를 통해 "AccountNotInitialized" 오류를 방지하고 안정적인 스테이킹 경험을 제공합니다.

이 접근법은 기존의 컴포넌트 구조를 해치지 않으면서 내부 로직만 개선하여 최소한의 변경으로 최대한의 안정성을 확보했습니다.