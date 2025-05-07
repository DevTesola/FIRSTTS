# 스테이킹 문제 최종 해결 보고서

## 문제 요약

1. **데이터베이스와 온체인 상태 불일치**:
   - 데이터베이스에는 ID 20인 레코드가 'staked' 상태로 기록되어 있었으나,
   - 온체인에는 해당하는 stake_info 계정이 존재하지 않았습니다.
   - 이로 인해 언스테이킹 시도 시 "Stake info account does not exist on-chain" 오류가 발생했습니다.

2. **원인**:
   - 스테이킹 트랜잭션이 실제로 온체인에서 완료되기 전에 데이터베이스가 업데이트되었거나,
   - 트랜잭션은 서명되었으나 온체인 확인 중 실패했을 가능성이 있습니다.
   - 사용자에게 트랜잭션 서명창이 보였으나, 실제로는 온체인에 기록되지 않았습니다.

## 해결 조치

1. **데이터베이스 레코드 수정**:
   - ID 20인 레코드의 상태를 'staked'에서 'unstaked'로 변경했습니다.
   - 이제 사용자는 해당 NFT를 다시 스테이킹할 수 있습니다.

2. **코드 개선**:
   - prepareUnstaking_v3.js 파일을 수정하여 온체인 계정 검증을 강화했습니다.
   - escrow_authority PDA 생성 방식을 올바르게 수정했습니다.
   - 계정 구조를 일관되게 유지하기 위해 누락된 계정들을 추가했습니다.
   - 더 명확한 오류 메시지를 제공하도록 수정했습니다.

3. **진단 도구 제작**:
   - 스테이킹 상태를 확인하고 수정하는 스크립트를 만들었습니다 (fix-staking-status.cjs).
   - 관리자용 API 엔드포인트를 추가했습니다 (/api/admin/fixStakingStatus).
   - 문제 해결 가이드 문서를 작성했습니다 (STAKING_FIX_MANUAL.md).

## 재발 방지 대책

1. **트랜잭션 확인 강화**:
   ```javascript
   // 트랜잭션 서명 후 온체인 확인
   const txId = await sendTransaction(...);
   
   // 트랜잭션 확인
   const confirmation = await connection.confirmTransaction(txId);
   
   // 온체인 상태 확인
   const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
   if (!stakeInfoAccount) {
     // 트랜잭션이 성공했지만 계정이 없음 - 불일치 상황
     console.error('Transaction succeeded but stake_info account not found');
     return { success: false, error: "온체인 계정이 생성되지 않았습니다" };
   }
   
   // 계정이 존재하면 데이터베이스 업데이트
   await supabase.from('nft_staking').insert({...});
   ```

2. **오류 로깅 개선**:
   - 스테이킹 및 언스테이킹 트랜잭션에 대한 자세한 로그를 저장합니다.
   - 트랜잭션 ID와 결과를 데이터베이스에 기록합니다.
   - 장애 발생 시 조사를 위한 트랜잭션 시뮬레이션 결과를 저장합니다.

3. **상태 모니터링**:
   - 주기적으로 데이터베이스와 온체인 상태를 비교하여 불일치를 감지하는 스크립트를 만듭니다.
   - 불일치가 발견되면 관리자에게 알림을 보냅니다.

## 기술적 개선사항

1. **계정 구조 일관성**:
   - prepareStaking_v3.js와 prepareUnstaking_v3.js 사이의 계정 구조와 PDA 생성 방식을 일관되게 유지합니다.

2. **계정 검증 로직**:
   - 모든 중요한 계정에 대해 존재 여부와 소유권을 확인하는 로직을 추가합니다.

3. **아토믹 업데이트**:
   - 데이터베이스 업데이트를 트랜잭션 확인과 함께 아토믹하게 처리합니다.
   - 트랜잭션 상태와 데이터베이스 상태를 동기화합니다.

## 결론

이번 문제는 데이터베이스와 온체인 상태 간의 불일치로 인해 발생했습니다. ID 20인 레코드의 상태를 'unstaked'로 변경하여 문제를 해결했으며, 코드를 개선하여 유사한 문제가 재발하지 않도록 조치했습니다.

향후 개선사항으로는 트랜잭션 확인 로직 강화, 오류 로깅 개선, 상태 모니터링 시스템 구축 등이 있습니다.