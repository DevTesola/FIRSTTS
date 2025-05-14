# Solana On-Chain Staking System Resolution Guide
# Solana 온체인 스테이킹 시스템 문제 해결 가이드

## Identified Issues / 발견된 문제

1. **UserStakingInfo Discriminator Mismatch / UserStakingInfo discriminator 불일치**
   - Error: `Invalid UserStakingInfo data: discriminator mismatch`
   - Cause: The account discriminator used in the client does not match the on-chain program's discriminator
   - 오류 메시지: `Invalid UserStakingInfo data: discriminator mismatch`
   - 원인: 클라이언트에서 사용하는 계정 discriminator가 온체인 프로그램의 discriminator와 일치하지 않음

2. **NFT Staking Account Initialization Issue / NFT 스테이킹 계정 초기화 문제**
   - Error: `AccountNotInitialized. Error Number: 3012`
   - Cause: The NFT staking account was not properly initialized before usage
   - 오류 메시지: `AccountNotInitialized. Error Number: 3012`
   - 원인: NFT 스테이킹 계정이 적절히 초기화되지 않음

3. **Minting System Concurrent Access Error / 민팅 시스템의 동시 접근 오류**
   - Error: `Failed to acquire lock: NFT #631 may have been selected by another user`
   - Cause: Stale lock records remaining in the database
   - 오류 메시지: `Failed to acquire lock: NFT #631 may have been selected by another user`
   - 원인: 데이터베이스에 남아있는 오래된 락 레코드

4. **UI Component Rendering Issue / UI 컴포넌트 렌더링 문제**
   - Issue: Newly implemented UI elements not displaying
   - Cause: Unmet conditions in conditional rendering or lack of data
   - 문제: 새로 구현된 UI 요소가 표시되지 않음
   - 원인: 조건부 렌더링에서 충족되지 않는 조건 또는 데이터 부족

## Solutions / 해결 방법

### 1. UserStakingInfo Discriminator Fix / UserStakingInfo discriminator 문제 해결

```javascript
// utils/staking-helpers/constants.js 파일 수정
// 이 부분을 다음과 같이 업데이트
const DISCRIMINATORS = {
  // Account discriminators
  POOL_STATE: Buffer.from([4, 146, 216, 218, 165, 66, 244, 30]),
  STAKE_INFO: Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]),
  // 이 값을 온체인 프로그램의 값과 일치하도록 수정
  USER_STAKING_INFO: Buffer.from([155, 12, 170, 224, 60, 153, 248, 72]),  // 올바른 값으로 수정
  // 나머지 discriminator...
};
```

### 2. NFT Staking Account Initialization Fix / NFT 스테이킹 계정 초기화 문제

`pages/api/prepareStaking_v3.js`에서 다음과 같이 수정:

```javascript
// 스테이킹 명령 전에 사용자 토큰 계정이 초기화되었는지 확인
const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
if (!userTokenAccountInfo) {
  console.log('사용자 토큰 계정 초기화 필요, ATA 생성 명령 추가...');
  const createUserATAIx = createAssociatedTokenAccountInstruction(
    walletPubkey,          // 지불자
    userTokenAccount,      // 생성할 계정
    walletPubkey,          // 계정 소유자
    mintPubkey             // 토큰 민트
  );
  tx.add(createUserATAIx);
}

// 나머지 코드는 동일하게 유지
```

### 3. Minting System Lock Issue Fix / 민팅 시스템 락 문제 해결

`utils/purchaseNFT.js`의 락 관리 메커니즘 개선:

```javascript
// 만료된 락을 모두 정리하는 개선된 함수
async function cleanAllExpiredLocks() {
  try {
    // 모든 만료된 락 정리 (타임아웃 확장)
    const { data, error } = await supabase.rpc('clean_all_expired_locks', {
      timeout_minutes: 60  // 60분 이상 지난 락은 모두 정리
    });
    
    if (error) {
      console.warn(`Lock cleanup error: ${error.message}`);
      return false;
    }
    
    console.log(`Cleaned ${data || 0} expired locks`);
    return true;
  } catch (err) {
    console.error('Lock cleanup exception:', err);
    return false;
  }
}

// purchaseNFT 함수 시작 부분에 추가
await cleanAllExpiredLocks();
```

Supabase 함수도 추가 필요 (SQL 함수):

```sql
CREATE OR REPLACE FUNCTION clean_all_expired_locks(timeout_minutes int DEFAULT 60)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned_count int;
BEGIN
  UPDATE minted_nfts
  SET 
    status = 'available',
    wallet = 'none',
    lock_id = NULL,
    payment_tx_signature = NULL,
    updated_at = NOW()
  WHERE 
    status = 'pending' AND
    updated_at < NOW() - (timeout_minutes || ' minutes')::interval;
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$;
```

### 4. UI Component Rendering Fix / UI 컴포넌트 렌더링 문제

`components/staking/StakingDashboard.jsx`에서 조건부 렌더링 수정:

```javascript
{/* Dynamic Reward Booster Visualization - 항상 표시 */}
{!isLoading && (
  <div className="bg-black/30 rounded-xl p-4 mb-6">
    <h4 className="text-sm font-bold text-white mb-3 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
      Dynamic Reward Booster
    </h4>
    
    {/* 보상 정보가 없어도 기본 정보 표시 */}
    <div className="p-3 bg-gray-900/30 rounded-lg flex flex-col gap-2">
      {boostInfo ? (
        // boostInfo가 있을 때 기존 UI 표시
        <>
          {/* Time-based Multiplier */}
          <div className="mb-4">
            {/* 기존 코드... */}
          </div>
        </>
      ) : (
        // boostInfo가 없을 때 안내 메시지 표시
        <div className="text-gray-400 text-sm text-center py-2">
          <p>스테이킹 시작 후 보상 부스터 정보가 표시됩니다.</p>
          <p className="mt-2">30일마다 5%의 보상 부스트가 추가되며 최대 50%까지 적용됩니다.</p>
        </div>
      )}
    </div>
  </div>
)}

{/* 컬렉션 보너스 - 항상 표시 */}
<CollectionBonus stats={stats || { activeStakes: [], stats: { collectionBonus: 0 } }} />

{/* 실시간 업데이트 섹션 - 항상 표시 */}
<div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6 mb-4">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-bold text-white flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
      Real-time Updates
    </h3>
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-400">
        <span className="font-medium">{activeSubscriptions?.length || 0}</span> active subscriptions
      </div>
    </div>
  </div>
  
  <div className="text-center py-3 bg-gray-900/30 rounded-lg text-gray-400 text-sm">
    {liveUpdateEnabled 
      ? '실시간 업데이트를 대기 중입니다. 스테이킹 상태가 변경되면 여기에 표시됩니다.' 
      : '실시간 업데이트가 일시 중지되었습니다. 활성화하려면 위의 버튼을 클릭하세요.'}
  </div>
</div>
```

## Testing Procedures / 테스트 프로시저

1. Update discriminator values and restart the system
2. Verify "Invalid UserStakingInfo" errors no longer appear in system logs
3. Confirm account initialization errors are resolved when staking is attempted
4. Check that locking errors no longer occur on the minting page
5. Verify UI components are displayed regardless of conditional rendering state

1. discriminator 값 업데이트 후, 시스템 재시작
2. 시스템 로그에서 "Invalid UserStakingInfo" 오류가 사라졌는지 확인
3. 스테이킹 시도 시 계정 초기화 오류가 해결되었는지 확인
4. 민팅 페이지에서 락 오류가 발생하는지 확인
5. UI 컴포넌트가 조건부 렌더링에 관계없이 표시되는지 확인

## Future Improvements / 향후 개선사항

1. **Strengthen On-chain Program and Client Integration / 온체인 프로그램과 클라이언트 통합 강화**
   - Implement build scripts to automatically apply IDL files to client code
   - Prevent discriminator value mismatches
   - IDL 파일을 자동으로 클라이언트 코드에 적용하는 빌드 스크립트 구현
   - discriminator 값 불일치 방지

2. **Enhance Error Handling Mechanisms / 에러 처리 매커니즘 강화**
   - Implement user-friendly error messages
   - Develop automatic recovery mechanisms
   - 사용자 친화적인 오류 메시지
   - 자동 복구 메커니즘 구현

3. **Improve Minting System Lock Management / 민팅 시스템 락 관리 개선**
   - Transition to Redis-based lock system
   - Strengthen stability in distributed environments
   - Redis 기반 락 시스템으로 전환
   - 분산 환경에서의 안정성 강화

4. **Enhance UI Component Reliability / UI 컴포넌트 신뢰성 향상**
   - Implement more fallback UI options
   - Improve loading state handling
   - 더 많은 fallback UI 구현
   - 로딩 상태 처리 개선

5. **Technical Debt Reduction / 기술 부채 해소**
   - Update all component dependencies
   - Implement comprehensive testing suite
   - Create clear documentation for future developers
   - 모든 컴포넌트 의존성 업데이트
   - 포괄적인 테스트 스위트 구현
   - 미래 개발자를 위한 명확한 문서화 작성