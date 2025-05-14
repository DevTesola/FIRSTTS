# NFT 스테이킹 "AccountNotInitialized" 오류 수정 요약

이 문서는 NFT 스테이킹 시스템에서 발생하는 `AccountNotInitialized` 오류(Error Code: 3012)를 수정하기 위한 접근 방식과 구현을 요약합니다.

## 문제 설명

스테이킹 과정에서 다음과 같은 오류가 발생했습니다:
```
Error: Failed to send transaction: Simulation failed. Message: Transaction simulation failed: Error processing Instruction 4: custom program error: 0xbc4. Logs: [...AnchorError caused by account: user_nft_account. Error Code: AccountNotInitialized."]
```

이 오류는 스테이킹 트랜잭션이 초기화되지 않은 계정(user_nft_account)을 사용하려고 할 때 발생합니다.

## 해결 접근 방식

### 1. 두 단계 트랜잭션 접근법

문제를 해결하기 위해 스테이킹 과정을 두 개의 별도 트랜잭션으로 분리했습니다:

1. **초기화 트랜잭션**: 필요한 모든 계정을 명시적으로 초기화합니다.
2. **스테이킹 트랜잭션**: 초기화된 계정을 사용하여 실제 NFT 스테이킹을 수행합니다.

### 2. 계정 초기화 검사 및 처리 개선

- 사용자 NFT 토큰 계정(ATA) 존재 여부 확인 및 필요시 초기화
- Escrow 토큰 계정 존재 여부 확인 및 필요시 초기화
- 사용자 스테이킹 정보 계정 존재 여부 확인 및 필요시 초기화

### 3. Anchor 프로그램 기반 구현

Anchor 프로그램을 사용하여 계정 관리 및 트랜잭션 생성을 더 효율적으로 구현했습니다.

## 수정된 파일

### 1. `/pages/api/staking/prepareStaking-anchor.js`

- 두 단계 트랜잭션 접근법 구현
- 명시적 계정 초기화 로직 추가:
  - 사용자 NFT 토큰 계정 초기화 확인 및 처리
  - Escrow 토큰 계정 초기화 확인 및 처리
  - 사용자 스테이킹 정보 초기화 확인 및 처리
- 응답에 두 트랜잭션을 별도로 전달

### 2. `/components/staking/AnchorStakingHandler.jsx`

- 두 단계 트랜잭션 순차 처리 구현
- 트랜잭션 간 지연 추가 (온체인 상태 업데이트 시간 확보)
- 오류 처리 강화 및 로깅 개선
- 서명 관리 로직 개선

### 3. `/pages/api/staking/completeStaking-anchor.js`

- 트랜잭션 확인 로직 개선
- 상세한 상태 및 오류 처리 추가
- DB 기록 처리 개선

### 4. `/shared/utils/error-handler.js`

- Anchor 특정 오류 처리 로직 추가
- AccountNotInitialized 오류 (코드 3012) 특별 처리
- 디버깅 로깅 개선

### 5. `/shared/utils/error-codes.js`

- Anchor 관련 오류 코드 추가 (3012: AccountNotInitialized)

### 6. `/home/tesola/ttss/tesolafixjs/ANCHOR_IMPLEMENTATION_SUMMARY.md`

- AccountNotInitialized 오류 해결 방법 설명 추가
- 두 단계 트랜잭션 접근법 설명

## 주요 개선 사항

1. **계정 초기화 오류 해결**: 모든 필수 계정이 트랜잭션 전에 명시적으로 초기화되므로 "AccountNotInitialized" 오류가 해결됩니다.

2. **견고한 오류 처리**: 더 명확한 오류 메시지와 로깅으로 문제 진단이 용이해졌습니다.

3. **순차적 트랜잭션 처리**: 온체인 상태 업데이트를 위한 적절한 지연이 추가되어 안정성이 향상되었습니다.

4. **IDL size 속성 문제 해결**: Anchor 방식으로 전환하여 IDL size 속성 누락 문제가 자동으로 해결되었습니다.

## 테스트 방법

1. 개발 서버 실행:
```bash
npm run dev
```

2. 브라우저에서 스테이킹 페이지 접속

3. 스테이킹 과정 테스트:
   - 월렛 연결
   - NFT 선택
   - 스테이킹 기간 선택
   - "Anchor로 NFT 스테이킹" 버튼 클릭
   - 두 개의 트랜잭션이 순차적으로 진행되는지 확인

4. 로그 확인:
   - 브라우저 콘솔
   - 서버 로그

## 주의사항

1. 초기화 트랜잭션과 스테이킹 트랜잭션 사이에 충분한 지연(2초)을 두어 온체인 상태가 업데이트될 시간을 확보했습니다.

2. 트랜잭션 확인 과정에서 오류가 발생하더라도 DB 기록은 시도하도록 하여 나중에 동기화할 수 있게 했습니다.

---

작성일: 2025년 5월 12일