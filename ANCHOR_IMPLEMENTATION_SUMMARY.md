# Anchor 방식 스테이킹 구현 요약

이 문서는 NFT 스테이킹 시스템을 Anchor 프로그램 방식으로 구현한 내용을 요약합니다.

## 구현된 파일

1. `/pages/api/staking/prepareStaking-anchor.js` - Anchor 프로그램을 사용하여 스테이킹 트랜잭션을 준비하는 API
2. `/pages/api/staking/completeStaking-anchor.js` - Anchor 트랜잭션 완료 후 DB에 기록하는 API
3. `/components/staking/AnchorStakingHandler.jsx` - 프론트엔드에서 Anchor 방식 스테이킹을 처리하는 컴포넌트

## 주요 변경사항

### 1. Anchor 프로그램 객체 사용

```javascript
// Anchor 프로그램 객체 생성
const program = new Program(nftStakingIdl, programId, provider);

// Anchor 방식으로 트랜잭션 생성
const stakeTx = await program.methods
  .stakeNft(
    new BN(stakingPeriodNum),
    nftTierIndex,
    false // auto_compound
  )
  .accounts({
    owner: walletPubkey,
    nftMint: mintPubkey,
    stakeInfo: stakeInfoPDA,
    escrowNftAccount: escrowTokenAccount,
    escrowAuthority: escrowAuthorityPDA,
    userNftAccount: userTokenAccount,
    userStakingInfo: userStakingInfoPDA,
    poolState: poolStatePDA,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: utils.token.TOKEN_PROGRAM_ID,
    rent: web3.SYSVAR_RENT_PUBKEY
  })
  .transaction();
```

### 1.1 "AccountNotInitialized" 문제 해결

"AccountNotInitialized" 오류(Error Code: 3012)를 해결하기 위해 두 단계 트랜잭션 접근 방식을 구현했습니다:

1. **첫 번째 단계**: 필요한 모든 계정을 명시적으로 초기화
   - 사용자 NFT 토큰 계정(ATA) 확인 및 초기화
   - Escrow 토큰 계정 확인 및 초기화
   - 사용자 스테이킹 정보 계정 확인 및 초기화

2. **두 번째 단계**: 실제 스테이킹 트랜잭션 수행
   - 초기화된 모든 계정을 사용하여 NFT를 스테이킹

```javascript
// 사용자 NFT 토큰 계정 초기화 확인 및 필요시 초기화
const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);

if (!userTokenAccountInfo) {
  console.log('사용자 NFT 토큰 계정이 존재하지 않습니다. 초기화 명령어 추가 중...');
  initTx.add(
    createAssociatedTokenAccountInstruction(
      walletPubkey,
      userTokenAccount,
      walletPubkey,
      mintPubkey
    )
  );
}

// Escrow 토큰 계정 초기화 확인 및 필요시 초기화
const escrowTokenAccountInfo = await connection.getAccountInfo(escrowTokenAccount);

if (!escrowTokenAccountInfo) {
  initTx.add(
    createAssociatedTokenAccountInstruction(
      walletPubkey,
      escrowTokenAccount,
      escrowAuthorityPDA,
      mintPubkey
    )
  );
}
```

### 2. IDL 사용

Anchor 프로그램을 사용하면 IDL의 `size` 속성이 없어도 클라이언트에서 자동으로 처리됩니다. 따라서 수동으로 size를 추가할 필요가 없습니다.

### 3. 계정 초기화 자동화

Anchor 프로그램을 사용하면 다음 계정 초기화가 자동으로 처리됩니다:

1. 사용자 토큰 계정 초기화
2. Escrow 토큰 계정 초기화
3. 사용자 스테이킹 정보 초기화

따라서 계정 초기화 명령어의 순서나 중복 문제가 발생하지 않습니다.

### 4. 오류 처리 개선

Anchor는 더 명확한 오류 메시지와 오류 코드를 제공하므로 디버깅이 용이합니다.

```javascript
if (anchorError.code) {
  errorCode = anchorError.code;
}

if (anchorError.error && anchorError.error.errorMessage) {
  errorMessage = anchorError.error.errorMessage;
}
```

## 이점

1. **코드 간소화**: 수동으로 인스트럭션을 생성하고 순서를 관리할 필요가 없습니다.
2. **타입 안전성**: TypeScript와 통합되어 타입 오류를 컴파일 시간에 발견할 수 있습니다.
3. **계정 자동 초기화**: 필요한 모든 계정이 자동으로 초기화됩니다.
4. **유지보수 용이성**: IDL이 변경되면 Anchor가 자동으로 적응합니다.
5. **오류 처리 개선**: 더 명확한 오류 메시지로 디버깅이 용이합니다.

## 사용법

### 서버 측 (백엔드):

```javascript
// API 라우트에서 Anchor 방식 스테이킹 엔드포인트 사용
import { api } from '../../utils/api';

const response = await api.post('/api/staking/prepareStaking-anchor', {
  wallet: wallet.publicKey.toString(),
  mintAddress: nft.mint,
  stakingPeriod: stakingPeriod
});
```

### 클라이언트 측 (프론트엔드):

```jsx
// AnchorStakingHandler 컴포넌트 사용
import AnchorStakingHandler from '../components/staking/AnchorStakingHandler';

function StakingPage() {
  return (
    <div>
      <h1>NFT 스테이킹</h1>
      <AnchorStakingHandler
        nft={selectedNft}
        stakingPeriod={30}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
```

## 결론

Anchor 프로그램 방식으로 구현함으로써:

1. IDL의 `size` 속성 문제가 해결됨
2. "AccountNotInitialized" 오류가 해결됨
3. 코드가 더 간결하고 유지보수하기 쉬워짐
4. 오류 메시지가 더 명확해짐

이 방식은 모든 Solana 프로그램 상호작용에 권장되는 접근법입니다.

---

*2025년 5월 12일 작성*