# NFT Staking Fix Summary (업데이트됨)

## Issues Fixed

1. **Staked NFTs Not Displaying**
   - Fixed `eventSubscriptionService.js` to use correct import path for constants
   - Enhanced `getStakingStats.js` API to correctly read on-chain data with proper Base58 encoding
   - Improved account data parsing logic to extract owner and mint fields correctly
   - Added transaction_signature field detection to prevent database errors
   - Enhanced on-chain data retrieval with better error handling

2. **NFT Images Not Loading**
   - Enhanced `StakedNFTCard.jsx` to prioritize using the nft_image property from the getStakingStats API
   - Added proper cache busting parameters to IPFS URLs to prevent browser caching issues
   - Improved error handling and recovery in image loading components
   - Added enhanced logging for image loading diagnostics
   - Added NFT ID extraction from various sources to reliably generate fallback image URLs

3. **Unstaking Workflow Preparation**
   - Created comprehensive test plan for unstaking functionality
   - Documented unstaking workflow from start to finish
   - Identified potential issues to watch for during testing
   - Outlined test cases for various unstaking scenarios

## Key Components Modified

1. `/services/eventSubscriptionService.js`
   - Fixed import paths for constants to correctly reference shared modules:
   ```javascript
   // 수정 전
   import { PROGRAM_ID, DISCRIMINATORS } from '../utils/staking-helpers/constants';

   // 수정 후
   import { PROGRAM_ID } from '../shared/constants/program-ids';
   import { ACCOUNT_DISCRIMINATORS as DISCRIMINATORS } from '../shared/constants/discriminators';
   ```

2. `/pages/api/staking/getStakingStats.js`
   - Implemented proper Base58 encoding for account discriminator:
   ```javascript
   const stakeInfoDiscriminator = Buffer.from([66, 62, 68, 70, 108, 179, 183, 235]);
   const stakeInfoDiscriminatorBase58 = bs58.encode(stakeInfoDiscriminator);
   ```
   - Fixed account data parsing logic with correct field offsets:
   ```javascript
   // 계정 데이터 구조:
   // 0-8: discriminator (8 bytes)
   // 8-40: owner (32 bytes)
   // 40-72: mintAddress (32 bytes)
   // 72-80: stakedAt (i64 - 8 bytes)
   // 80-88: releaseDate (i64 - 8 bytes)
   ```
   - Added proper transaction_signature conditional field handling

3. `/components/staking/StakedNFTCard.jsx`
   - Improved image URL processing with enhanced IPFS handling:
   ```javascript
   // IPFS URL을 게이트웨이 URL로 변환
   if (nftImageUrl.startsWith('ipfs://')) {
     ipfsUrl = nftImageUrl;
     ipfsHash = ipfsUrl.replace('ipfs://', '').split('/')[0];
     const filePath = ipfsUrl.replace(`ipfs://${ipfsHash}`, '') || '/';
     gatewayUrl = `${IPFS_GATEWAY}/ipfs/${ipfsHash}${filePath}?_t=${Date.now()}`;
   }
   ```
   - Added consistent cache busting for all image URLs:
   ```javascript
   const url = new URL(nftImageUrl);
   url.searchParams.append('_forcereload', 'true');
   url.searchParams.append('_t', Date.now().toString());
   ```
   - Added better fallback mechanisms and diagnostic logging

## Next Steps for Testing

1. **Verify Staking Dashboard Display**
   - Confirm that all staked NFTs appear in the dashboard
   - Verify that NFT images load correctly
   - Check that staking progress and rewards display accurately

2. **Test Unstaking Functionality**
   - Follow the test cases outlined in UNSTAKING_TEST_PLAN.md
   - Test both completed staking period and early unstaking scenarios
   - Verify that emergency unstaking works correctly
   - Check that rewards are correctly calculated and applied

3. **Verify Database Updates**
   - Check that staking records are properly updated on unstaking
   - Verify that reward records are created for unstaked NFTs
   - Ensure transaction signatures are properly recorded

4. **Monitor for Errors**
   - Watch browser console for any "PublicKey is not defined" errors
   - Check server logs for database schema errors
   - Monitor for any image loading failures

## Technical Details

### 문제 진단 및 디버깅 도구

추가된 디버깅 스크립트:

1. `/scripts/verify-discriminators.js`
   - 온체인 계정 디스크리미네이터 값을 검증하는 스크립트
   - 주요 기능:
     - 지정된 지갑 주소의 UserStakingInfo PDA 생성
     - 실제 온체인 데이터에서 discriminator 바이트 추출
     - shared/constants/discriminators.js의 값과 비교

2. `/scripts/check-publickey-imports.js`
   - PublicKey import 문제를 진단하는 스크립트
   - 주요 기능:
     - 프로젝트 내 모든 JS 파일에서 PublicKey 사용 패턴 검색
     - 잘못된 import 방식 감지
     - 권장 import 패턴 제시

### 온체인 데이터 처리 개선

1. 정확한 계정 필터링 구현:
   - 올바른 Base58 인코딩 값 사용
   - 실제 온체인 데이터 구조에 맞는 파싱 로직
   - 타임스탬프 및 상태 데이터 정확히 추출

2. PDA 생성 및 계정 조회 로직 표준화:
   - findUserStakingInfoPDA 함수를 사용하여 정확한 PDA 생성
   - 계정 데이터의 올바른 오프셋 사용
   - 중복 계정 필터링 로직 개선

### IPFS 이미지 처리 개선

1. IPFS URL 처리 로직 개선:
   - IPFS 해시 및 파일 경로 정확히 추출
   - 올바른 게이트웨이 URL 형식 사용
   - 일관된 환경 변수 참조

2. 캐시 버스팅 최적화:
   - 모든 이미지 URL에 통일된 캐시 버스팅 파라미터 사용
   - `_forcereload=true` 및 타임스탬프 파라미터 추가
   - URL 객체를 활용한 체계적인 쿼리 파라미터 추가

이러한 개선 사항을 통해 스테이킹된 NFT가 정상적으로
 표시되고 이미지가 올바르게 로드됩니다.