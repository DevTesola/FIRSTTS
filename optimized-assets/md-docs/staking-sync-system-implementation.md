# TESOLA 스테이킹 동기화 시스템 구현

이 문서는 TESOLA 프로젝트의 스테이킹 동기화 시스템 구현에 대한 종합적인 설명입니다. 블록체인 상태와 오프체인 데이터베이스 간의 일관성을 유지하기 위한 시스템을 설명합니다.

## 목차

1. [시스템 개요](#시스템-개요)
2. [핵심 기능](#핵심-기능)
3. [시스템 구조](#시스템-구조)
4. [구현 세부사항](#구현-세부사항)
5. [API 명세](#api-명세)
6. [관리자 대시보드](#관리자-대시보드)
7. [자동화 및 크론 작업](#자동화-및-크론-작업)
8. [보안 고려사항](#보안-고려사항)
9. [온체인 코드 수정 제안](#온체인-코드-수정-제안)
10. [테스트 및 배포](#테스트-및-배포)

## 시스템 개요

TESOLA 스테이킹 시스템은 두 가지 주요 구성 요소로 이루어져 있습니다:

1. **온체인 스테이킹 프로그램**: Solana 블록체인에서 실행되는 스마트 컨트랙트로, NFT 스테이킹, 보상 계산, 언스테이킹을 관리합니다.
2. **오프체인 데이터베이스**: Supabase에 구현된 데이터베이스로, 스테이킹 상태, 메타데이터 및 사용자 인터페이스에 필요한 정보를 저장합니다.

이 두 시스템 간의 상태 일관성을 보장하는 것이 중요합니다. 스테이킹 동기화 시스템은 다음과 같은 목적을 가지고 있습니다:

- 블록체인과 데이터베이스 간의 불일치 감지
- 자동 동기화를 통한 불일치 해결
- 관리자를 위한 모니터링 및 수동 동기화 도구 제공
- 데이터 불일치로 인한 사용자 경험 문제 방지

## 핵심 기능

스테이킹 동기화 시스템의 핵심 기능은 다음과 같습니다:

1. **상태 불일치 감지**
   - 블록체인에는 존재하지만 데이터베이스에 없는 스테이킹 레코드 식별
   - 데이터베이스에는 스테이킹되었지만 블록체인에서 언스테이킹된 NFT 식별
   - 누락된 메타데이터(이미지 URL, 티어 정보 등) 식별

2. **자동 동기화**
   - 블록체인 상태를 기준으로 데이터베이스 레코드 업데이트
   - 블록체인에 없는 레코드는 언스테이킹으로 표시
   - 블록체인에만 있는 레코드는 데이터베이스에 추가

3. **메타데이터 관리**
   - NFT 이미지 URL 및 메타데이터 업데이트
   - 스테이킹된 NFT의 티어 및 보상률 동기화

4. **관리 도구**
   - 관리자 대시보드를 통한 동기화 상태 모니터링
   - 수동 동기화 작업 트리거
   - 동기화 로그 및 오류 기록

5. **자동화**
   - 크론 작업을 통한 정기적인 동기화 실행
   - 중요한 이벤트(스테이킹, 언스테이킹) 후 자동 동기화

## 시스템 구조

스테이킹 동기화 시스템은 다음 구성 요소로 이루어져 있습니다:

1. **동기화 유틸리티 모듈** (`/utils/staking-helpers/sync-utilities.js`)
   - 블록체인 상태 조회 함수
   - 데이터베이스 업데이트 함수
   - 불일치 확인 및 해결 로직

2. **로깅 모듈** (`/utils/staking-helpers/sync-logger.js`)
   - 동기화 작업 로깅
   - 오류 로깅
   - 통계 수집

3. **보안 모듈** (`/utils/staking-helpers/security-checker.js`)
   - API 요청 검증
   - 관리자 인증
   - 요청 속도 제한

4. **API 엔드포인트**
   - 관리자 동기화 API (`/api/admin/sync-staking.js`)
   - 로그 조회 API (`/api/admin/sync-logs.js`)
   - 크론 작업 API (`/api/cron/sync-staking.js`)

5. **관리자 인터페이스**
   - 동기화 관리 페이지 (`/admin/sync-staking.js`)
   - 로그 조회 페이지 (`/admin/sync-logs.js`)

## 구현 세부사항

### 스테이킹 계정 구조

온체인 스테이킹 계정은 다음과 같은 구조를 가집니다:

```javascript
class StakeInfo {
  constructor(properties) {
    Object.assign(this, properties);
  }

  static schema = new Map([
    [
      StakeInfo,
      {
        kind: 'struct',
        fields: [
          ['discriminator', [8]], // 계정 타입 식별자
          ['isInitialized', 'u8'], // 초기화 여부
          ['nftMint', [32]], // NFT 민트 주소
          ['owner', [32]], // 소유자 주소
          ['stakedAt', 'u64'], // 스테이킹 시작 시간
          ['lastUpdateTime', 'u64'], // 마지막 업데이트 시간
          ['releaseTime', 'u64'], // 릴리즈 시간
          ['rewardRatePerDay', 'u64'], // 일일 보상 비율
          ['accumulatedReward', 'u64'], // 누적 보상
          ['tierMultiplier', 'u8'], // 등급 배수
          ['isUnstaked', 'u8'], // 언스테이킹 여부
        ],
      },
    ],
  ]);
}
```

이 구조는 borsh 라이브러리를 사용하여 블록체인에서 계정 데이터를 디코딩하는 데 사용됩니다.

### 블록체인 데이터 조회

블록체인 데이터 조회는 다음 함수들을 통해 이루어집니다:

1. **getStakeInfoFromChain**: 특정 NFT 민트 주소에 대한 스테이킹 정보를 조회합니다.
2. **getWalletStakingInfoFromChain**: 특정 지갑에 스테이킹된 모든 NFT 정보를 조회합니다.

```javascript
export async function getStakeInfoFromChain(mintPubkey) {
  // 민트 주소로부터 PDA 도출
  const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
    programId
  );

  // 계정 정보 조회
  const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
  
  if (!stakeInfoAccount) {
    return null;
  }

  // 계정 데이터 디코딩
  const stakeInfo = decodeStakeInfo(stakeInfoAccount.data);
  // ... 디코딩된 데이터 처리 및 반환
}
```

### 데이터베이스 업데이트

데이터베이스 업데이트는 다음 함수들을 통해 이루어집니다:

1. **upsertStakingRecord**: 블록체인 데이터를 기반으로 데이터베이스 레코드를 생성하거나 업데이트합니다.
2. **markAsUnstaked**: 언스테이킹된 NFT를 데이터베이스에서 업데이트합니다.

```javascript
export async function upsertStakingRecord(onchainData) {
  // NFT ID 확인 또는 생성
  let nftId = await getNftId(onchainData.nftMint);
  
  // 이미지 URL 생성
  const imageUrlData = createImageUrl(nftId.toString());
  
  // 스테이킹 레코드 생성
  const stakingRecord = {
    mint_address: onchainData.nftMint,
    wallet_address: onchainData.owner,
    nft_id: nftId.toString(),
    nft_name: `SOLARA #${nftId}`,
    nft_tier: determineTier(onchainData.tierMultiplier),
    staked_at: formatDate(onchainData.stakedAt),
    release_date: formatDate(onchainData.releaseTime),
    // ... 기타 필드
  };
  
  // 데이터베이스에 업서트
  const { data, error } = await supabase
    .from('nft_staking')
    .upsert([stakingRecord], { onConflict: 'mint_address' })
    .select();
    
  // 결과 반환
}
```

### 불일치 감지 및 해결

불일치 감지 및 해결은 다음 함수들을 통해 이루어집니다:

1. **checkDiscrepancies**: 블록체인과 데이터베이스 간의 불일치를 감지합니다.
2. **syncNFT**: 특정 NFT의 상태를 동기화합니다.
3. **syncWalletNFTs**: 특정 지갑의 모든 NFT 상태를 동기화합니다.
4. **runSyncCheck**: 종합적인 동기화 작업을 실행합니다.

```javascript
export async function checkDiscrepancies() {
  // 데이터베이스에서 스테이킹된 NFT 목록 가져오기
  const { data: dbStakedNfts } = await supabase
    .from('nft_staking')
    .select('*')
    .eq('status', 'staked');
  
  // 각 NFT를 블록체인과 비교
  const missingOnChain = [];
  const imageUrlMissing = [];
  
  for (const dbNft of dbStakedNfts) {
    // 블록체인에서 상태 확인
    const onchainData = await getStakeInfoFromChain(dbNft.mint_address);
    
    // 불일치 감지
    if (!onchainData || onchainData.isUnstaked) {
      missingOnChain.push(dbNft);
    }
    
    // 이미지 URL 확인
    if (!dbNft.image_url) {
      imageUrlMissing.push(dbNft);
    }
  }
  
  // 블록체인에만 있는 NFT 확인
  // ... 생략
  
  return {
    missingOnChain,
    missingInDatabase,
    imageUrlMissing
  };
}
```

## API 명세

### 관리자 동기화 API

`POST /api/admin/sync-staking`

**요청 헤더:**
- `admin_key`: 관리자 인증 키

**요청 본문:**
```json
{
  "action": "OPERATION_NAME",
  "mintAddress": "MINT_ADDRESS", // 선택적
  "wallet": "WALLET_ADDRESS", // 선택적
  "other_params": "..." // 작업별 추가 매개변수
}
```

**지원되는 작업:**
- `test_auth`: 관리자 인증 테스트
- `check_discrepancies`: 불일치 확인
- `sync_nft`: 단일 NFT 동기화
- `sync_wallet`: 지갑의 모든 NFT 동기화
- `sync_all`: 모든 스테이킹 데이터 동기화
- `update_nft_metadata`: NFT 메타데이터 업데이트

### 크론 작업 API

`POST /api/cron/sync-staking`

**요청 헤더:**
- `x-cron-secret`: 크론 작업 인증 키

**요청 본문:**
```json
{
  "limit": 50, // 동기화할 최대 NFT 수
  "fixMissingRecords": true, // 누락된 레코드 생성 여부
  "updateMetadata": true, // 메타데이터 업데이트 여부
  "walletAddress": null // 특정 지갑으로 제한 (선택적)
}
```

## 관리자 대시보드

관리자 대시보드는 다음 페이지들로 구성되어 있습니다:

### 스테이킹 동기화 페이지 (`/admin/sync-staking`)

이 페이지는 다음 기능을 제공합니다:

1. 관리자 인증
2. 블록체인과 데이터베이스 간 불일치 확인
3. 단일 NFT 동기화
4. 지갑별 동기화
5. 전체 동기화
6. NFT 메타데이터 업데이트

```jsx
// 불일치 확인 버튼 예시
<button
  onClick={checkDiscrepancies}
  disabled={checkingDiscrepancies || loading}
  className="px-5 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 shadow-sm flex items-center transition duration-200"
>
  {checkingDiscrepancies ? (
    <>
      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 검사 중...
    </>
  ) : (
    <>
      <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2" /> 불일치 확인
    </>
  )}
</button>
```

### 동기화 로그 페이지 (`/admin/sync-logs`)

이 페이지는 다음 기능을 제공합니다:

1. 동기화 작업 로그 조회
2. 오류 로그 조회
3. 동기화 통계 확인

```jsx
{/* 통계 카드 예시 */}
<div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
  <div className="flex items-center mb-2">
    <ArrowPathIcon className="w-5 h-5 text-indigo-500 mr-2" />
    <h3 className="text-lg font-medium text-gray-800">총 동기화</h3>
  </div>
  <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
  <div className="mt-2 text-sm text-gray-500">최근 {filter.days}일</div>
</div>
```

## 자동화 및 크론 작업

스테이킹 동기화는 다음과 같은 자동화 매커니즘을 통해 정기적으로 실행됩니다:

1. **정기적인 크론 작업**: 외부 크론 서비스(예: Vercel Cron)를 통해 API를 호출하여 정기적인 동기화 실행
2. **이벤트 기반 동기화**: 스테이킹 또는 언스테이킹 작업 완료 후 자동 동기화

크론 작업 설정 예시(Vercel을 사용하는 경우):
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-staking",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 보안 고려사항

스테이킹 동기화 시스템에는 다음과 같은 보안 메커니즘이 구현되어 있습니다:

1. **API 인증**
   - 관리자 API에는 안전한 인증 키 필요
   - 크론 작업에는 별도의 비밀 키 필요

2. **요청 검증**
   - 모든 입력값에 대한 검증
   - 안전한 비교를 위한 상수 시간 비교 사용

3. **속도 제한**
   - 과도한 요청을 방지하기 위한 속도 제한 적용
   - IP 기반 요청 제한

4. **오류 처리**
   - 안전한 오류 처리 및 로깅
   - 사용자에게 최소한의 오류 정보만 노출

예시 코드:
```javascript
// 관리자 API 키 검증
function validateAdminKey(providedKey, correctKey) {
  if (!providedKey || !correctKey) {
    return false;
  }
  
  // 상수 시간 비교를 사용하여 타이밍 공격 방지
  return crypto.timingSafeEqual(
    Buffer.from(providedKey, 'utf8'),
    Buffer.from(correctKey, 'utf8')
  );
}
```

## 온체인 코드 수정 제안

현재 온체인 스테이킹 시스템에 다음과 같은 개선 사항을 고려할 수 있습니다:

1. **이벤트 발생 추가**
   - 스테이킹/언스테이킹 시 이벤트를 발생시켜 오프체인 시스템이 변경 사항을 더 쉽게 감지할 수 있도록 함
   - 예: `StakingEvent`, `UnstakingEvent`

2. **상태 확인 명령어 추가**
   - 특정 NFT의 스테이킹 상태를 쉽게 확인할 수 있는 읽기 전용 명령어 추가
   - 여러 NFT의 상태를 한 번에 조회할 수 있는 배치 조회 명령어 추가

3. **사용자 스테이킹 계정 구조 개선**
   - 사용자당 하나의 계정에 모든 스테이킹 정보를 저장하여 효율성 향상
   - 스테이킹된 NFT 목록에 빠르게 접근할 수 있는 인덱싱 기능 추가

4. **회복성 향상**
   - 실패한 작업을 복구할 수 있는 추가 기능 구현
   - 오프체인 상태와 온체인 상태 간의 불일치를 해결하기 위한 전용 명령어 추가

## 테스트 및 배포

스테이킹 동기화 시스템을 테스트하고 배포하기 위한 절차:

1. **테스트 스크립트**
   - `/tests/sync-system-test.js`: 스테이킹 동기화 시스템의 핵심 기능을 테스트

2. **환경 변수 설정**
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 롤 키
   - `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT`: Solana RPC 엔드포인트
   - `ADMIN_SECRET_KEY`: 관리자 API 인증 키
   - `CRON_SECRET_KEY`: 크론 작업 인증 키

3. **배포 전 확인 사항**
   - 보안 키가 안전하게 설정되었는지 확인
   - 데이터베이스에 필요한 테이블이 생성되었는지 확인
   - 로깅 시스템 구성이 완료되었는지 확인

4. **모니터링 및 유지 관리**
   - 정기적인 로그 검토
   - 동기화 통계 모니터링
   - 필요에 따라 수동 동기화 실행