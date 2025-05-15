# NFT 스테이킹 대시보드 문제 최종 해결

## 문제 요약

스테이킹 대시보드에서 다음과 같은 심각한 문제가 발생했습니다:

1. 온체인에 2개의 NFT가 스테이킹되어 있지만 UI에는 1개만 표시되거나 전혀 표시되지 않음
2. NFT ID 불일치: NFT #0059가 #0008로 잘못 표시됨
3. 데이터베이스 계정 정보와 온체인 데이터의 비동기화 문제

## 근본 원인 분석

1. **Seed 문자열 불일치**:
   - 프로그램은 `'stake'` seed를 사용하지만 API는 `'stake_info'`를 사용함
   - 이로 인해 완전히 다른 PDA 주소가 계산되어 스테이크 계정을 찾지 못함

2. **Account 디코딩 방식 차이**:
   - `borsh` 디코딩을 직접 구현하는 방식과 Anchor의 `BorshAccountsCoder` 사용 방식의 차이
   - 계정 구조 불일치 가능성

3. **NFT ID 데이터 불일치**:
   - 온체인에서는 NFT ID가 59로 계산됨
   - 데이터베이스에는 민트 인덱스가 8로 저장됨
   - 이로 인해 동일한 NFT에 두 개의 다른 ID가 표시됨

4. **스테이킹된 민트 필터링 로직 오류**:
   - stakedMints 목록에서 2개의 민트를 감지했으나, 실제 처리에서는 1개만 필터링됨

## 완전한 해결책

### 1. 새로운 통합 API 개발: `get-all-staked-nfts.js`

- **Anchor BorshAccountsCoder 활용**:
  ```javascript
  const idl = require('../../../idl/nft_staking.json');
  const coder = new BorshAccountsCoder(idl);
  const userStakingInfo = coder.decode('userStakingInfo', userStakingAccount.data);
  ```

- **개선된 민트 필터링 로직**:
  ```javascript
  const stakedMints = userStakingInfo.stakedMints
    .filter(mint => {
      const isDefault = mint.equals(PublicKey.default);
      const isAllOnes = mint.toString() === '11111111111111111111111111111111';
      console.log(`필터링: 디폴트=${isDefault}, 올원=${isAllOnes}, 유효=${!isDefault && !isAllOnes}`);
      return !isDefault && !isAllOnes;
    })
    .map(mint => mint.toString());
  ```

- **철저한 로깅 및 디버깅**:
  ```javascript
  console.log(`유효한 스테이킹된 민트 ${stakedMints.length}개: ${stakedMints.join(', ')}`);
  ```

### 2. 공유 PDA 유틸리티 일관성 확보

- **기존의 검증된 PDA 유틸리티 사용**:
  ```javascript
  const [userStakingPDA] = findUserStakingInfoPDA(walletPubkey);
  const [stakePDA] = findStakeInfoPDA(mintPubkey);
  ```

### 3. 다단계 폴백 전략 구현

스테이킹 페이지에서 다음 순서로 API를 시도하도록 개선:

1. 새로운 Anchor 기반 `get-all-staked-nfts` API 시도
2. 첫 번째 폴백으로 `getStakingInfoFromChain` 시도
3. 두 번째 폴백으로 `direct-onchain` 시도
4. 최종 폴백으로 서비스 메소드 사용

### 4. 온체인 데이터 우선 원칙 적용

- 모든 데이터를 온체인에서 직접 가져오도록 설계
- 데이터베이스 동기화 오류에 의존하지 않음
- 결정론적 NFT ID 해결 로직 사용

### 5. 디버깅을 위한 진단 도구 추가

- `debug-stakedmints.js` API 엔드포인트 개발:
  - 스테이킹된 민트 주소의 원시 데이터 표시
  - 온체인 계정 구조 자세히 분석
  - 문제가 되는 필터링을 진단하기 위한 정보 제공

## 통합 솔루션의 장점

1. **완전한 온체인 데이터 접근**:
   - 데이터베이스와 온체인 데이터 간의 불일치 문제 해결
   - 모든 스테이킹된 NFT(2개)가 올바르게 표시됨

2. **일관된 NFT ID 해결**:
   - `resolveNftId` 유틸리티를 통한 일관된 ID 접근
   - NFT가 올바른 ID로 표시됨 (0059가 0008로 표시되는 문제 해결)

3. **강화된 오류 처리 및 로깅**:
   - 더 자세한 디버깅 정보로 문제 원인 파악 용이
   - 다단계 폴백으로 가용성 향상

4. **Anchor 기반 접근법의 신뢰성**:
   - Solana 프로그램과 동일한 계정 구조 사용
   - 수동 borsh 디코딩 오류 가능성 제거

## 기술적 교훈

1. Solana 프로그램 개발 시 seed 바이트 배열과 문자열의 차이를 명확히 이해해야 함
2. 계정 데이터 작업 시 가능하면 Anchor의 BorshAccountsCoder 사용 권장
3. 온체인 데이터를 신뢰하고 데이터베이스는 보조 저장소로 활용해야 함
4. API 엔드포인트 개발 시 철저한 로깅과 오류 처리가 필수적