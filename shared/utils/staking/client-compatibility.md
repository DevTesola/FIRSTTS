# NFT 스테이킹 프로그램 업데이트 - 클라이언트 호환성 가이드

## 주요 변경사항

온체인 프로그램이 다음과 같이 업데이트되었습니다:

1. `StakeNft` 구조체의 `escrow_nft_account`에 `signer = false` 속성을 추가하여 서명자가 아님을 명시적으로 표시했습니다.
2. `upgrade/stake_nft.rs`의 `StakeNftImproved` 구조체에도 동일한 변경사항을 적용했습니다.

## 클라이언트 코드 검토 결과

기존 클라이언트 코드 (`enhanced-staking.js`)가 이미 올바르게 구현되어 있습니다:

```javascript
// 계정 메타 데이터 구성 - 정확한 순서가 중요
const keys = [
  { pubkey: walletPubkey, isSigner: true, isWritable: true },                // owner
  { pubkey: mintPubkey, isSigner: false, isWritable: false },                // nft_mint
  { pubkey: addresses.stakeInfoPDA, isSigner: false, isWritable: true },     // stake_info
  { pubkey: addresses.escrowTokenAccount, isSigner: false, isWritable: true }, // escrow_nft_account - 서명자가 아님
  { pubkey: addresses.escrowAuthority, isSigner: false, isWritable: false }, // escrow_authority
  ...
];
```

클라이언트 코드가 이미 `escrow_nft_account`를 서명자가 아닌 것으로 올바르게 처리하고 있습니다. 코드 내에 주석도 적절히 추가되어 있습니다:

```javascript
// 주의: escrow_nft_account는 온체인 프로그램에서 서명자로 요청되지만
// 클라이언트에서는 이 계정에 서명할 수 없습니다. ATA 생성 명령을 사용하여
// 계정을 만들고, 프로그램이 PDA 메커니즘을 통해 서명권한을 가지게 됩니다.
```

## 호환성 권장사항

1. **IDL 업데이트**: 프로그램 업데이트 후 새로운 IDL을 다운로드하고 `/idl/nft_staking.json` 파일을 업데이트하세요.

2. **트랜잭션 제출 방식 업데이트**: 임시 해결책으로 사용되던 `skipPreflight: true` 옵션은 새 IDL이 적용된 후에는 더 이상 필요하지 않습니다. 다음과 같이 정상적인 방식으로 트랜잭션을 제출할 수 있습니다:

   ```javascript
   const signature = await connection.sendRawTransaction(transactionBuffer, {
     preflightCommitment: 'confirmed'
   });
   ```

3. **코드 업데이트 불필요**: 클라이언트 측 계정 구성이 이미 올바르게 설정되어 있어 추가 코드 변경이 필요하지 않습니다. 기존 스테이킹 로직은 다음과 같이 계속 사용할 수 있습니다:

   ```javascript
   // 이미 올바르게 설정되어 있음
   { pubkey: addresses.escrowTokenAccount, isSigner: false, isWritable: true }
   ```

4. **테스트 권장**: 코드 변경이 필요하지 않더라도, 프로그램 업데이트 후 다음 기능을 꼼꼼히 테스트하세요:
   - 새 NFT 스테이킹
   - 기존 스테이킹된 NFT의 언스테이킹
   - 보상 청구
   - 비상 언스테이킹 (응급 상황용)

## 결론

온체인 프로그램의 변경으로 클라이언트와 프로그램 간의 불일치가 수정되었습니다. 클라이언트 코드는 이미 올바르게 구현되어 있으므로 IDL 업데이트 외에 추가 변경이 필요하지 않습니다. 이로 인해 "ConstraintSigner was violated" 오류가 더 이상 발생하지 않아야 합니다.