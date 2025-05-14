# 스테이킹 및 언스테이킹 문제 해결 요약

## 1. 문제 진단

NFT 스테이킹 시스템에서 다음 문제가 발견되었습니다:

1. **언스테이킹 실패**: "AccountNotInitialized" 오류로 언스테이킹이 실패하는 문제가 있었습니다.
2. **stake_info 계정 초기화 문제**: 이 오류는 stake_info 계정이 온체인에 존재하지 않거나 초기화되지 않았음을 나타냅니다.
3. **계정 추적 부재**: stake_info 계정이 올바르게 생성되었는지 확인하는 로직이 없었습니다.
4. **계정 구조 불일치**: 스테이킹과 언스테이킹 트랜잭션의 계정 구조 차이가 있었습니다.
5. **PDA 생성 불일치**: escrow_authority PDA를 생성하는 방식이 일치하지 않았습니다.

## 2. 해결된 문제

1. **계정 구조 일치**: prepareUnstaking_v3.js 파일에서 계정 구조를 prepareStaking_v3.js와 일치시켰습니다.
   - system_program, associated_token_program, rent 계정을 추가했습니다.

2. **escrow_authority PDA 생성 일관성**: PDA 생성 방식을 일관되게 변경했습니다.
   ```javascript
   // 수정 전 (prepareUnstaking_v3.js)
   const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
     [ESCROW_SEED, mintPubkey.toBuffer()],
     new PublicKey(PROGRAM_ID)
   );
   
   // 수정 후
   const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
     [Buffer.from(ESCROW_SEED), mintPubkey.toBuffer()],
     programId
   );
   ```

3. **계정 검증 로직 강화**: stake_info 계정이 존재하고 올바른 프로그램에 의해 소유되었는지 확인하는 검증을 추가했습니다.

4. **오류 메시지 개선**: 시뮬레이션 로그에서 특정 오류 패턴을 찾아 더 명확한 오류 메시지를 제공합니다.

## 3. 추가된 기능

1. **진단 도구**:
   - 관리자용 디버깅 페이지 (/admin/debug-staking)
   - 진단 API 엔드포인트 (/api/staking/diagnose)
   - 계정 상태 및 문제 진단을 위한 유틸리티 함수 (utils/staking-helpers/diagnostic.js)

2. **문제해결 가이드**: 일반적인 스테이킹 문제와 해결책을 설명하는 문서 (STAKING-TROUBLESHOOTING.md)

3. **계정 상태 추적**: stake_info 및 user_staking_info 계정의 상태를 확인하고 문제 발생 시 적절한 오류 메시지를 제공합니다.

## 4. 권장 사항

1. **스테이킹된 NFT 데이터 정리**:
   - 현재 스테이킹된 모든 NFT에 대해 온체인 stake_info 계정의 존재와 상태를 확인하세요.
   - 불일치가 있는 경우 데이터베이스 상태를 업데이트하세요.

2. **디버깅 도구 활용**:
   - 앞으로 문제 발생 시 /admin/debug-staking 페이지를 활용하여 문제를 진단하세요.
   - 자동화된 진단 API를 프론트엔드에 통합하여 사용자에게 더 나은 오류 메시지를 제공하세요.

3. **트랜잭션 시뮬레이션 활용**:
   - 언스테이킹 트랜잭션 시뮬레이션 결과를 활용하여 문제를 조기에 발견하세요.
   - 문제가 있는 경우 프론트엔드에서 적절한 메시지를 표시하여 사용자가 취할 수 있는 조치를 안내하세요.

4. **사용자 경험 개선**:
   - 언스테이킹 전에 stake_info 계정이 존재하는지 확인하는 사전 검사를 프론트엔드에 추가하세요.
   - 문제가 발생했을 때 사용자가 실행할 수 있는 수정 단계를 제공하세요.

## 5. 계정 요약

스테이킹 과정에 필요한 주요 계정:

1. **pool_state**: 관리자가 초기화한 프로그램 구성 계정
   - 주소: YBZdU27VdXY7AHpzFDkphMFX1GHQ888ivU4Kgua5uCu

2. **stake_info**: NFT 스테이킹 정보가 저장된 PDA
   - 시드: [115, 116, 97, 107, 101] ("stake") + NFT 민트 주소

3. **user_staking_info**: 사용자의 스테이킹 정보가 저장된 PDA
   - 시드: [117, 115, 101, 114, 95, 115, 116, 97, 107, 105, 110, 103] ("user_staking") + 지갑 주소

4. **escrow_authority**: 에스크로 토큰 계정 권한을 위한 PDA
   - 시드: [101, 115, 99, 114, 111, 119] ("escrow") + NFT 민트 주소