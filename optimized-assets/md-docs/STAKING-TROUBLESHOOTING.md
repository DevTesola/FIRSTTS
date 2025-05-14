# NFT 스테이킹 문제해결 가이드

이 문서는 TESOLA NFT 스테이킹 시스템의 일반적인 문제와 해결책을 설명합니다.

## 스테이킹 시스템 아키텍처

스테이킹 시스템은 다음과 같은 요소로 구성됩니다:

1. **온체인 프로그램**: Solana 위에 배포된 Anchor 프로그램 (4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs)
2. **API 엔드포인트**: 프론트엔드와 온체인 프로그램 간의 중개자 역할
3. **프론트엔드 인터페이스**: 사용자가 NFT를 스테이킹하고 보상을 받을 수 있는 UI
4. **데이터베이스**: 스테이킹 기록과 오프체인 데이터를 저장

## 확인사항

문제가 발생했을 때 먼저 다음을 확인하세요:

1. **풀 초기화**: 풀 상태 계정이 올바르게 초기화되었는지 확인 (관리자 전용 작업)
2. **사용자 계정 초기화**: 사용자가 처음 스테이킹하기 전에 user_staking_info 계정이 초기화되었는지 확인
3. **NFT 소유권**: 스테이킹하려는 NFT를 사용자가 소유하고 있는지 확인
4. **계정 주소**: 모든 PDA와 계정 주소가 올바르게 생성되었는지 확인

## 일반적인 오류와 해결책

### 1. "AccountNotInitialized" 오류

```
Program log: AnchorError caused by account: stake_info. Error Code: AccountNotInitialized. Error Number: 3012. 
Error Message: The program expected this account to be already initialized.
```

**원인**:
- 스테이킹 과정에서 stake_info 계정이 올바르게 초기화되지 않았습니다.
- stake_info 계정은 최초 스테이킹 시 프로그램에 의해 생성되어야 합니다.

**해결책**:
1. `/admin/debug-staking` 페이지에서 stake_info 계정이 존재하는지 확인
2. 계정이 존재하지 않는 경우 해당 NFT를 다시 스테이킹
3. 계정이 있지만 초기화되지 않은 경우 관리자에게 문의

### 2. "AccountOwnedByWrongProgram" 오류

```
Program log: AnchorError caused by account: pool_state. Error Code: AccountOwnedByWrongProgram. Error Number: 3007.
Error Message: The given account is owned by a different program than expected.
```

**원인**:
- 풀 상태 계정이 스테이킹 프로그램에 의해 소유되지 않았습니다.
- 관리자가 풀을 초기화하지 않았거나 잘못된 계정을 사용했습니다.

**해결책**:
1. `/admin/initialize-pool` 페이지에서 풀 상태 초기화
2. pool_state 계정이 올바른 프로그램 ID에 의해 소유되었는지 확인

### 3. 스테이킹은 성공했지만 언스테이킹이 실패하는 경우

**원인**:
- stake_info 계정이 잘못된 방식으로 초기화되었을 수 있습니다.
- escrow_authority PDA가 스테이킹과 언스테이킹 사이에 일관성이 없을 수 있습니다.
- 트랜잭션에 포함된 계정 목록이 다를 수 있습니다.

**해결책**:
1. `/admin/debug-staking` 페이지에서 stake_info 계정 데이터 확인
2. prepareStaking_v3.js와 prepareUnstaking_v3.js에서 escrow_authority PDA 생성 방식 비교
3. 두 트랜잭션에서 계정 구조가 일치하는지 확인

### 4. "Custom program error: 0x1770" 오류

**원인**:
- NFT가 이미 스테이킹되어 있지만 다시 스테이킹을 시도하고 있습니다.
- 트랜잭션에 잘못된 민트 주소가 포함되어 있습니다.

**해결책**:
1. NFT가 이미 스테이킹되어 있는지 확인
2. 데이터베이스와 온체인 상태가 일치하는지 확인

### 5. "Transaction simulation failed: Error processing Instruction" 오류

**원인**:
- 트랜잭션 구성이 올바르지 않습니다.
- 시뮬레이션 중 일부 계정이 존재하지 않거나 접근할 수 없습니다.

**해결책**:
1. 로그에서 구체적인 오류 메시지 확인
2. 모든 계정이 올바른 순서로 포함되었는지 확인
3. 시드 값과 PDA 생성 방식이 일관되게 적용되었는지 확인

## 디버깅 도구

1. **관리자 디버깅 페이지**: `/admin/debug-staking`에서 스테이킹 상태 확인 가능
2. **풀 초기화 페이지**: `/admin/initialize-pool`에서 스테이킹 풀 초기화 가능
3. **API 엔드포인트**:
   - `/api/admin/debug-staking`: 온체인 계정 상태 확인
   - `/api/prepareStaking_v3.js`: 스테이킹 트랜잭션 준비
   - `/api/prepareUnstaking_v3.js`: 언스테이킹 트랜잭션 준비

## 주요 PDA 시드

1. **stake_info**: `[115, 116, 97, 107, 101]` + NFT 민트 주소
2. **escrow_authority**: `[101, 115, 99, 114, 111, 119]` + NFT 민트 주소 
3. **user_staking_info**: `[117, 115, 101, 114, 95, 115, 116, 97, 107, 105, 110, 103]` + 지갑 주소

## 문제 신고

문제가 지속되는 경우 다음 정보와 함께 개발팀에 문의하세요:

1. NFT 민트 주소
2. 지갑 주소
3. 트랜잭션 ID (가능한 경우)
4. 로그 또는 오류 메시지
5. 문제 발생 단계 설명