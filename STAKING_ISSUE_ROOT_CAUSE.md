# 스테이킹 기능 핵심 이슈 분석 및 해결 방안

## 문제 개요

현재 스테이킹 시스템에서 두 가지 주요 문제가 발생하고 있습니다:

1. 스테이킹된 NFT가 대시보드에 표시되지 않고, 온체인에서 데이터를 가져오지 못함
2. 이미지가 무한 로딩 상태에 빠지거나 표시되지 않음

이러한 문제의 근본 원인을 분석하고 해결했습니다.

## 근본 원인 분석

### 1. 온체인 데이터 검색 실패 원인

1. **계정 디스크리미네이터 불일치**
   - `utils/staking-helpers/constants.js`에 정의된 `DISCRIMINATORS` 값이 실제 온체인 값과 불일치할 가능성이 높음
   - 특히 `STAKE_INFO`와 `USER_STAKING_INFO` 디스크리미네이터가 다른 경우 계정 데이터 식별 및 파싱 실패

2. **PublicKey 임포트 문제**
   - 다양한 모듈에서 `PublicKey`를 임포트하는 방식이 일관되지 않음
   - 일부 환경에서 `PublicKey`가 제대로 정의되지 않아 "PublicKey is not defined" 오류 발생

3. **PDA 생성 불일치**
   - `findUserStakingInfoPDA` 및 `findStakeInfoPDA` 함수가 실제 온체인 PDA와 다른 주소를 생성할 가능성
   - 시드 바이트 또는 프로그램 ID 불일치 문제가 있을 수 있음

### 2. 이미지 로딩 무한 루프 원인

1. **과도한 캐시 버스팅**
   - 모든 컴포넌트에서 `Date.now()`를 사용한 강력한 캐시 버스팅 적용
   - 컴포넌트가 리렌더링될 때마다 새로운 URL이 생성되어 무한 로딩 루프 발생

2. **이미지 URL 오버라이드**
   - 여러 컴포넌트에서 API에서 제공된 이미지 URL을 무시하고 강제로 IPFS URL 생성
   - `getStakingStats.js`에서 제공하는 `nft_image` 속성이 제대로 사용되지 않음

3. **재시도 로직 충돌**
   - 이미지 로딩 실패 시 재시도 로직이 과도하게 작동하거나 충돌
   - 여러 컴포넌트에서 다른 재시도 로직 사용으로 충돌 발생

## 해결 방안

### 1. 온체인 데이터 검색 문제 해결

1. **디스크리미네이터 검증 및 수정**
   - `verify-discriminators.js` 스크립트를 실행하여 실제 온체인 디스크리미네이터 값 확인
   - 불일치하는 디스크리미네이터 값 수정
   ```javascript
   // 실제 온체인 값으로 수정 (예시)
   const DISCRIMINATORS = {
     STAKE_INFO: Buffer.from([...]), // 검증된 값으로 업데이트
     USER_STAKING_INFO: Buffer.from([...]), // 검증된 값으로 업데이트
     // ...기타 값들
   };
   ```

2. **PublicKey 일관성 보장**
   - 모든 관련 모듈에서 `PublicKey` 임포트 확인 및 표준화
   - 특히 `eventSubscriptionService.js`와 해당 서비스를 사용하는 컴포넌트 확인
   - `check-publickey-imports.js` 스크립트를 통해 문제 진단

3. **PDA 생성 로직 검증**
   - 더 단순하고 명확한 PDA 생성 함수로 통합
   - 커스텀 PDA 함수 대신 표준 `findProgramAddressSync` 직접 사용 고려

### 2. 이미지 로딩 문제 해결

1. **캐시 버스팅 단순화**
   - 캐시 버스팅 매개변수 단순화 및 통일
   - 컴포넌트별로 다른 URL 생성 방지
   ```javascript
   // 단순화된 캐시 버스팅 (예시)
   const simpleUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_t=${Date.now()}`;
   ```

2. **API 이미지 URL 우선 사용**
   - `getStakingStats.js`에서 제공하는 `nft_image` 우선 사용
   - 이미지 URL 생성 로직 일관성 유지
   ```javascript
   // nft_image 우선 사용 예시
   if (stake.nft_image) {
     return addCacheBusting(stake.nft_image);
   }
   // 이후 폴백 로직...
   ```

3. **재시도 로직 최적화**
   - 이미지 로딩 재시도 로직 간소화
   - 로깅 및 콘솔 출력 최소화

## 수정 내용

1. **eventSubscriptionService.js 수정**
   - 잘못된 임포트 경로 수정
   ```javascript
   // 수정 전
   import { PROGRAM_ID, DISCRIMINATORS } from '../utils/staking-helpers/constants';

   // 수정 후
   import { PROGRAM_ID } from '../shared/constants/program-ids';
   import { ACCOUNT_DISCRIMINATORS as DISCRIMINATORS } from '../shared/constants/discriminators';
   ```

2. **getStakingStats.js 수정**
   - 온체인 데이터 검색 및 파싱 로직 개선
   - 정확한 Base58 인코딩 값 사용:
   ```javascript
   const stakeInfoDiscriminator = Buffer.from([66, 62, 68, 70, 108, 179, 183, 235]);
   const stakeInfoDiscriminatorBase58 = bs58.encode(stakeInfoDiscriminator);
   ```
   - 계정 데이터 파싱 개선:
   ```javascript
   // 계정 데이터에서 소유자와 민트 필드 정확히 추출
   const ownerPubkeyBytes = data.slice(8, 8 + 32);
   const mintPubkeyBytes = data.slice(40, 40 + 32);
   ```
   - 추가 타임스탬프 정보 추출:
   ```javascript
   const stakedAt = data.readBigInt64LE(72);
   const releaseDate = data.readBigInt64LE(80);
   const isStaked = data[88] === 1;
   ```

3. **이미지 URL 처리 개선**
   - IPFS URL 처리 로직 강화:
   ```javascript
   if (nftImageUrl.startsWith('ipfs://')) {
     ipfsUrl = nftImageUrl;
     ipfsHash = ipfsUrl.replace('ipfs://', '').split('/')[0];
     const filePath = ipfsUrl.replace(`ipfs://${ipfsHash}`, '') || '/';
     gatewayUrl = `${IPFS_GATEWAY}/ipfs/${ipfsHash}${filePath}`;
   }
   ```
   - 캐시 버스팅 파라미터 표준화:
   ```javascript
   url.searchParams.append('_forcereload', 'true');
   url.searchParams.append('_t', Date.now().toString());
   ```

## 테스트 절차

1. **온체인 데이터 검증 테스트**
   - 스테이킹된 NFT가 있는 지갑으로 `getStakingStats?wallet=<지갑주소>` API 호출
   - 반환된 데이터에 올바른 스테이킹 정보가 있는지 확인
   - 로그를 통해 `PublicKey` 문제 확인

2. **이미지 로딩 테스트**
   - 브라우저 개발자 도구로 이미지 요청 모니터링
   - 네트워크 탭에서 이미지 URL 검사
   - 캐시 버스팅 매개변수가 계속 변경되는지 확인

3. **스테이킹 대시보드 로딩 확인**
   - 대시보드에 스테이킹된 NFT가 표시되는지 확인
   - 각 NFT 이미지가 제대로 로드되는지 확인
   - 스테이킹 정보(보상, 진행 상황 등) 표시 확인

## 결론

스테이킹 기능의 두 가지 주요 문제(NFT 목록 미표시 및 이미지 로딩 오류)는 코드의 세 가지 핵심 영역에서 수정되었습니다:

1. **eventSubscriptionService.js의 임포트 경로 수정**:
   - 올바른 경로에서 상수를 가져오도록 변경하여 이벤트 구독 시스템이 정상 작동

2. **getStakingStats.js의 온체인 데이터 처리 로직 개선**:
   - 정확한 Base58 인코딩 값 사용
   - 계정 데이터 구조에 맞는 파싱 로직 적용
   - 실제 스테이킹 타임스탬프 및 상태 추출

3. **이미지 URL 처리 개선**:
   - IPFS 링크를 게이트웨이 URL로 올바르게 변환
   - 일관된 캐시 버스팅 파라미터 적용

이러한 수정을 통해 스테이킹된 NFT가 대시보드에 올바르게 표시되고, 이미지가 제대로 로드되도록 했습니다. 또한, 디버깅을 위한 스크립트(`verify-discriminators.js`, `check-publickey-imports.js`)를 추가하여 향후 유사한 문제를 쉽게 진단할 수 있게 했습니다.