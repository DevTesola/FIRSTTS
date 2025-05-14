# NFT 스테이킹 통합 가이드

이 문서는 온체인 NFT 스테이킹 시스템을 tesolafixjs 프론트엔드에 통합하는 방법에 대한 포괄적인 가이드입니다. 온체인 스테이킹 프로그램의 최근 개선사항을 도입하고 계정 역직렬화 오류 및 스테이킹 실패를 방지하기 위한 모범 사례를 제공합니다.

## 목차

1. [소개](#소개)
2. [주요 변경사항](#주요-변경사항)
3. [파일 구조](#파일-구조)
4. [설치 방법](#설치-방법)
5. [사용 방법](#사용-방법)
6. [API 엔드포인트](#api-엔드포인트)
7. [컴포넌트 사용법](#컴포넌트-사용법)
8. [오류 처리](#오류-처리)
9. [확장 및 사용자 정의](#확장-및-사용자-정의)

## 소개

NFT 스테이킹 시스템을 통해 사용자는 NFT를 스테이킹하고 이에 대한 보상을 받을 수 있습니다. 이전 구현에서는 Anchor 디스크리미네이터 계산 및 계정 순서 문제로 인해 스테이킹 실패 및 계정 역직렬화 오류가 발생했습니다. 이 통합 가이드는 이러한 문제를 해결하고 안정적인 스테이킹 기능을 제공하기 위한 것입니다.

### 해결된 문제점

1. **디스크리미네이터 계산 오류**: Anchor 프로그램의 명령어와 계정 디스크리미네이터를 `global:<함수명>` 방식으로 올바르게 계산
2. **계정 순서 오류**: 온체인 프로그램에서 기대하는 정확한 계정 순서 적용
3. **계정 적격성 확인 미흡**: 최대 NFT 수 확인 등 각종 전제 조건 검증 강화
4. **불완전한 오류 처리**: 계정 역직렬화 오류 등에 대한 사용자 친화적 오류 메시지 제공

## 주요 변경사항

### 1. Anchor 디스크리미네이터 계산 수정

Anchor 프로그램은 명령어와 계정을 식별하기 위해 고유한 8바이트 디스크리미네이터를 사용합니다. 올바른 계산 방법은 다음과 같습니다:

```javascript
function getInstructionDiscriminator(name) {
  return Buffer.from(crypto.createHash('sha256').update(`global:${name}`).digest()).slice(0, 8);
}
```

### 2. 계정 순서 수정

스테이킹 트랜잭션의 계정 순서가 온체인 프로그램에서 기대하는 순서와 정확히 일치하도록 수정되었습니다:

```javascript
const keys = [
  { pubkey: walletPubkey, isSigner: true, isWritable: true },           // owner
  { pubkey: mintPubkey, isSigner: false, isWritable: false },           // nft_mint
  { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },          // stake_info
  { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },    // escrow_nft_account
  { pubkey: escrowAuthority, isSigner: false, isWritable: false },      // escrow_authority
  { pubkey: userTokenAccount, isSigner: false, isWritable: true },      // user_nft_account
  { pubkey: userStakingInfoPDA, isSigner: false, isWritable: true },    // user_staking_info
  { pubkey: poolStateAddress, isSigner: false, isWritable: true },      // pool_state
  { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
  { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },     // token_program
  { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },   // rent
  { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false } // associated_token_program
];
```

### 3. 계정 적격성 검증 로직 추가

사용자는 최대 5개의 NFT만 스테이킹할 수 있습니다. 이를 사전에 확인하여 오류를 예방합니다:

```javascript
async function checkStakingLimit(connection, userStakingInfoPDA) {
  // 사용자 스테이킹 정보 확인
  const userStakingInfo = await connection.getAccountInfo(userStakingInfoPDA);
  if (userStakingInfo) {
    const stakedCount = userStakingInfo.data[40]; // 현재 스테이킹된 NFT 수
    if (stakedCount >= 5) {
      throw new Error("MaxNftsExceeded");
    }
    return stakedCount;
  }
  return 0;
}
```

### 4. 오류 처리 확장

계정 역직렬화 오류를 비롯한 다양한 오류에 대해 사용자 친화적인 메시지를 제공합니다:

```javascript
// 오류 메시지 개선
if (err.message.includes("MaxNftsExceeded")) {
  return "최대 NFT 스테이킹 한도에 도달했습니다. 다른 NFT를 스테이킹하기 전에 하나를 언스테이킹하세요.";
}
else if (err.message.includes("AccountDidNotDeserialize")) {
  return "계정 구조 문제가 발생했습니다. 비상 언스테이킹을 시도해보세요.";
}
```

## 파일 구조

새로 추가된 파일과 수정된 파일의 구조는 다음과 같습니다:

```
/shared/utils/
  ├── anchor-helpers.js          # Anchor 디스크리미네이터 계산 등 유틸리티
  ├── enhanced-error-handler.js  # 향상된 오류 처리 유틸리티
  ├── reward-calculator.js       # 보상 계산 유틸리티
  └── staking/
      └── enhanced-staking.js    # 향상된 스테이킹 유틸리티

/pages/api/staking/
  └── enhanced-staking.js        # 향상된 스테이킹 API 엔드포인트

/components/
  ├── common/
  │   └── InfoTooltip.jsx        # 정보 툴팁 컴포넌트
  └── staking/
      └── EnhancedStakingButton-V2.jsx # 향상된 스테이킹 버튼 컴포넌트
```

## 설치 방법

1. 필요한 모든 파일을 복사하여 프로젝트 구조에 추가합니다.
2. 패키지 종속성이 정확한지 확인합니다(`@solana/web3.js`, `@solana/spl-token`, `@project-serum/anchor` 등).
3. 환경 설정에서 올바른 프로그램 ID와 엔드포인트가 설정되어 있는지 확인합니다.

## 사용 방법

### 백엔드 통합

1. `anchor-helpers.js`를 사용하여 Anchor 프로그램과 상호 작용할 때 올바른 디스크리미네이터 계산을 보장합니다.
2. `enhanced-error-handler.js`를 사용하여 일관된 오류 처리 방식을 제공합니다.
3. `enhanced-staking.js` 유틸리티는 스테이킹 기능의 핵심 로직을 처리합니다.

### 프론트엔드 통합

1. 기존 스테이킹 버튼을 `EnhancedStakingButton-V2` 컴포넌트로 교체하거나, 필요에 따라 이 컴포넌트의 로직을 기존 코드에 통합합니다.
2. API 호출은 `/api/staking/enhanced-staking` 엔드포인트를 대상으로 이루어져야 합니다.

```jsx
import EnhancedStakingButtonV2 from "../components/staking/EnhancedStakingButton-V2";

// 컴포넌트 사용
<EnhancedStakingButtonV2
  nft={nftData}
  stakingPeriod={30}
  onSuccess={handleSuccess}
  onError={handleError}
  showStakingInfo={true}
  autoCompound={false}
/>
```

## API 엔드포인트

### Enhanced Staking API

**엔드포인트**: `/api/staking/enhanced-staking`
**메서드**: POST
**요청 본문**:
```json
{
  "wallet": "사용자 지갑 주소 (string)",
  "mintAddress": "NFT 민트 주소 (string)",
  "stakingPeriod": "스테이킹 기간(일) (number)",
  "nftTier": "NFT 등급 (string, 선택사항)",
  "nftName": "NFT 이름 (string, 선택사항)",
  "autoCompound": "자동 복리 여부 (boolean, 선택사항)"
}
```

**응답 본문**:
```json
{
  "success": true,
  "message": "향상된 스테이킹 방식으로 트랜잭션이 준비되었습니다",
  "data": {
    "wallet": "사용자 지갑 주소",
    "mintAddress": "NFT 민트 주소",
    "nftName": "NFT 이름",
    "stakingPeriod": 30,
    "nftTier": "COMMON",
    "nftTierIndex": 0,
    "autoCompound": false,
    "accountInitialization": {
      "userTokenAccount": "ready",
      "escrowTokenAccount": "needs_init",
      "userStakingInfo": "ready",
      "allReady": false
    },
    "transactions": {
      "phase1": "base64로 인코딩된 설정 트랜잭션",
      "phase2": null,
      "phase3": "base64로 인코딩된 스테이킹 트랜잭션"
    },
    "requiredPhases": {
      "phase1": true,
      "phase2": false,
      "phase3": true
    },
    "accounts": {
      "poolState": "풀 상태 계정 주소",
      "stakeInfo": "스테이크 정보 계정 주소",
      "escrowAuthority": "에스크로 권한 계정 주소",
      "userStakingInfo": "사용자 스테이킹 정보 계정 주소",
      "escrowTokenAccount": "에스크로 토큰 계정 주소",
      "userTokenAccount": "사용자 토큰 계정 주소"
    },
    "rewardDetails": {
      "baseRate": 25,
      "totalRewards": 750,
      "dailyRewards": [25, 25, 25, 25, 25, 25, 25],
      "averageDailyReward": 25,
      "longTermBonus": 0,
      "autoCompoundBonus": 0,
      "totalMultiplier": 1,
      "stakingPeriodDays": 30,
      "estimatedEndDate": "예상 종료일 ISO 문자열"
    },
    "expiresAt": "트랜잭션 만료일 ISO 문자열",
    "apiVersion": "enhanced-staking-v1"
  }
}
```

## 컴포넌트 사용법

### EnhancedStakingButton-V2

```jsx
import EnhancedStakingButtonV2 from "../components/staking/EnhancedStakingButton-V2";

<EnhancedStakingButtonV2
  nft={nftObject}                // 필수: NFT 객체 (mint, name, attributes 등 포함)
  stakingPeriod={30}             // 필수: 스테이킹 기간(일)
  onSuccess={handleSuccess}      // 선택: 성공 시 콜백 함수
  onError={handleError}          // 선택: 오류 시 콜백 함수
  disabled={false}               // 선택: 버튼 비활성화 여부
  onStartLoading={onStart}       // 선택: 로딩 시작 콜백
  onEndLoading={onEnd}           // 선택: 로딩 종료 콜백
  className="custom-class"       // 선택: 추가 CSS 클래스
  showStakingInfo={true}         // 선택: 스테이킹 정보 표시 여부
  autoCompound={false}           // 선택: 자동 복리 활성화 여부
/>
```

### InfoTooltip

```jsx
import { InfoTooltip } from "../components/common/InfoTooltip";

<InfoTooltip title="제목" position="top">
  툴팁에 표시할 내용
</InfoTooltip>
```

## 오류 처리

통합에는 향상된 오류 처리 메커니즘이 포함되어 있습니다. 일반적인 오류는 다음과 같습니다:

1. **MaxNftsExceeded**: 사용자가 이미 최대 개수(5개)의 NFT를 스테이킹했을 때 발생
2. **AccountDidNotDeserialize**: 계정 역직렬화 오류, 일반적으로 언스테이킹 중에 발생
3. **TokenAccountNotFound**: 토큰 계정을 찾을 수 없을 때 발생
4. **NotOwner**: 사용자가 NFT의 소유자가 아닐 때 발생
5. **AlreadyStaked**: NFT가 이미 스테이킹되어 있을 때 발생

이러한 오류는 `enhanced-error-handler.js`에서 처리되며, 사용자 친화적인 메시지로 변환됩니다.

## 확장 및 사용자 정의

### 보상 계산 사용자 정의

`reward-calculator.js`에서 티어별 보상 및 보너스 계산 로직을 사용자 정의할 수 있습니다.

```javascript
// 티어별 일일 기본 보상률 수정
const dailyRewardsByTier = {
  'LEGENDARY': 300,  // 상향 조정
  'EPIC': 150,       // 상향 조정
  'RARE': 70,        // 상향 조정
  'COMMON': 30       // 상향 조정
};
```

### 컴포넌트 스타일 사용자 정의

`EnhancedStakingButton-V2` 컴포넌트는 클래스 이름을 통한 스타일 사용자 정의를 지원합니다.

```jsx
<EnhancedStakingButtonV2
  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold"
  /* 기타 속성 */
/>
```

---

## 결론

이 통합 가이드는 테솔라 NFT 스테이킹 시스템의 안정성을 크게 향상시킵니다. Anchor 프로그램 호환성 문제와 계정 역직렬화 오류를 해결하여 사용자가 NFT를 원활하게 스테이킹할 수 있도록 합니다. 또한 사용자 친화적인 오류 메시지와 더 나은 UI/UX를 제공하여 전반적인 사용자 경험을 개선합니다.

이 가이드에 대한 질문이나 문제가 있으면 개발팀에 문의하세요.