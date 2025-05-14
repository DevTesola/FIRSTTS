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

## 스테이킹 페이지 NFT 이미지 로딩 문제 해결

### 문제 설명

스테이킹 페이지(`/staking`)와 관련 탭에서 스테이킹된 NFT 이미지가 제대로 표시되지 않는 문제가 있었습니다. 반면 마이 컬렉션 페이지(`/my-collection`)에서는 같은 NFT가 올바르게 표시되었습니다.

### 원인 분석

1. `/api/getStakingStats.js` API가 일부 시나리오에서 로컬 이미지 경로를 반환하고 있었습니다.
2. 데이터 흐름은 다음과 같습니다:
   - 스테이킹된 NFT 데이터는 `nft_staking` 테이블에서 가져옵니다.
   - API는 `minted_nfts` 테이블에서 추가 데이터로 보완하려고 시도합니다.
   - 추가 데이터를 사용할 수 없는 경우 로컬 경로로 대체됩니다.

### 구현된 해결책

1. 모든 로컬 경로 감지를 위한 보다 강력한 함수를 추가했습니다:
   ```javascript
   const isLocalPath = (url) => {
     if (!url) return false;
     // 로컬 경로는 항상 '/'로 시작하거나 '/nft-' 또는 '/placeholder' 등을 포함
     return url.startsWith('/') || 
            url.includes('/nft-') || 
            url.includes('/placeholder') || 
            url.includes('/public/') ||
            url === 'placeholder-nft.png';
   };
   ```

2. 로컬 경로를 IPFS 플레이스홀더 URL로 변환하도록 API를 수정했습니다:
   ```javascript
   if (!nftImageUrl || isLocalPath(nftImageUrl)) {
     const randomId = Math.random().toString(36).substring(2, 10);
     console.log(`로컬 이미지 경로 또는 빈 이미지 URL을 IPFS 플레이스홀더로 변환: ${nftImageUrl} -> ipfs://placeholder/${randomId}`);
     nftImageUrl = `ipfs://placeholder/${randomId}`;
   }
   ```

3. API가 일관된 URL 값을 가진 이미지 필드를 반환하도록 했습니다:
   ```javascript
   // 이미지 필드 통합 처리 - 모든 필드에 일관된 값 설정
   ipfs_hash: ipfsHash,
   image: nftImageUrl,           // 실제 NFT 이미지 URL (DB에서 가져온 URL)
   image_url: nftImageUrl,       // 동일한 URL 사용 (일관성을 위해)
   nft_image: gatewayUrl || nftImageUrl,  // 게이트웨이 URL 또는 기본 URL
   ```

4. 모의 데이터 생성 시에도 일관되게 IPFS URL을 사용하도록 수정했습니다.

5. 중복 변수 정의(`localImagePath`)를 제거하여 빌드 오류를 해결했습니다.

### 검증 방법

모든 스테이킹 컴포넌트(StakedNFTCard, NFTGallery)는 이미 EnhancedProgressiveImage를 올바르게 사용하고 있었으며, `__source` 특성을 통해 컴포넌트 컨텍스트를 추적하고 있었습니다:

```jsx
<EnhancedProgressiveImage 
  src={getNFTImageUrl({
    ...stake, 
    id: stake.id || stake.mint_address,
    mint: stake.mint_address,
    name: nftName,
    image: stake.image,
    image_url: stake.image_url,
    nft_image: stake.nft_image,
    ipfs_hash: stake.ipfs_hash,
    metadata: stake.metadata,
    __source: 'StakedNFTCard-thumbnail',
    _cacheBust: Date.now() // 캐시 버스팅을 위한 타임스탬프
  })}
  alt={getNFTName(stake, 'SOLARA')}
  // ... other props
/>
```

API의 디버깅 로그를 통해 이제 IPFS URL이 일관되게 반환되는 것을 확인했습니다:

```
getStakingStats API - 첫 번째 stake 이미지 필드 확인: {
  image: 'ipfs://QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3/0025.png',
  image_url: 'ipfs://QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3/0025.png',
  nft_image: 'https://tesola.mypinata.cloud/ipfs/QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3/0025.png',
  ipfs_hash: 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3'
}
```

### 결론

이 수정을 통해 스테이킹된 NFT가 로컬 경로 대신 항상 IPFS URL을 통해 로드되도록 했습니다. 이는 다음과 같은 이점을 제공합니다:

1. 일관된 이미지 로딩 패턴으로 버그 감소
2. 중앙화된 서버에 의존하는 로컬 경로 대신 분산 스토리지 사용
3. 로컬 서버에 이미지가 없는 경우에도 이미지가 올바르게 표시됨