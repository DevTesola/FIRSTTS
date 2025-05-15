# 스테이킹 대시보드 표시 문제 해결

## 문제 개요

스테이킹 대시보드에 다음과 같은 문제들이 있었습니다:

1. 온체인에 2개의 NFT가 스테이킹되었지만 UI에는 1개만 표시되거나 아무것도 표시되지 않음
2. NFT ID가 잘못 표시됨 (예: #0019가 #0008로 표시됨)
3. 데이터베이스 동기화 문제로 인해 온체인 데이터가 정확히 반영되지 않음

## 해결 접근법

1. **근본 원인 파악**: 
   - 시드(Seed) 문자열 불일치: `'stake_info'` 대신 `'stake'`를 사용해야 함
   - PDA 도출 방식의 불일치: 프로그램과 API의 PDA 생성 로직이 달랐음
   - 데이터 디코딩 방식 차이: 수동 borsh 디코딩 vs. Anchor coder 차이

2. **Anchor IDL 기반 해결책**:
   - Anchor의 BorshAccountsCoder를 사용한 새로운 API 개발
   - IDL 기반 계정 구조 자동 파싱
   - 공유 PDA 유틸리티 활용

## 구현 세부사항

### 1. `getStakingInfoFromChain.js` 구현

새로운 API 엔드포인트를 개발해 Anchor에서 제공하는 BorshAccountsCoder를 사용하여 계정 데이터를 쉽게 디코딩:

```javascript
// Anchor의 BorshAccountsCoder 사용
const idl = require('../../../idl/nft_staking.json');
const coder = new BorshAccountsCoder(idl);

// 사용자 스테이킹 정보 디코딩
const userStakingInfo = coder.decode('userStakingInfo', userStakingAccount.data);

// 스테이크 정보 디코딩
const stakeInfo = coder.decode('stakeInfo', stakeAccount.data);
```

### 2. 강화된 사용자 경험

- 확장된 디버깅 로깅으로 문제 파악 용이
- 여러 대체 경로(fallback paths)를 통한 견고한 데이터 페칭
- 에러 처리 및 가시성 향상

### 3. NFT ID 해결 유틸리티 재사용

기존에 개발한 `resolveNftId` 함수를 계속 사용하여 일관된 ID 표시:

```javascript
const nftId = resolveNftId(mintAddress);
```

### 4. 스테이킹 온체인 데이터 우선순위 설정

1. 먼저 Anchor 기반 온체인 API 시도
2. 실패 시 기존 borsh 기반 API 시도
3. 최후 수단으로 서비스 메소드 사용

## 해결된 문제

1. **올바른 NFT 수 표시**: 
   - 온체인에 있는 모든 스테이킹된 NFT (2개)가 이제 제대로 표시됨
   - 기존에는 시드 불일치로 인해 PDA 주소를 찾지 못했었음

2. **정확한 NFT ID 표시**:
   - NFT ID가 정확하게 해결되고 표시됨 (예: #0019가 제대로 #0019로 표시)
   - 일관된 ID 해결 유틸리티 사용

3. **온체인 데이터 우선**:
   - 데이터베이스가 아닌 온체인 데이터를 직접 조회하여 항상 최신 상태 표시
   - 데이터베이스 동기화 문제 없이 정확한 정보 표시

## 기술적 이유

이 문제는 다음과 같은 Solana 프로그램의 특성 때문에 발생했습니다:

1. Solana 프로그램 계정 찾기에는 정확한 시드 바이트 배열이 필요
2. `'stake_info'`와 `'stake'`는 바이트 수준에서 완전히 다름
3. IDL에 정의된 계정 구조대로 정확히 디코딩해야 함

Anchor의 기능을 활용하면 이러한 복잡성을 줄이고 일관된 계정 접근이 가능합니다.

## 추가 권장사항

1. 항상 공유 PDA 유틸리티 사용하기
2. Anchor IDL과 coder 활용하기
3. 데이터베이스보다 온체인 데이터를 신뢰하기
4. 디버깅을 위한 중간 과정 로깅 추가하기