# TESOLA NFT 민팅 시스템 개선사항

이 문서는 TESOLA NFT 민팅 시스템의 개선사항과 구현된 기능에 대한 상세한 설명을 제공합니다. 중복 민팅 방지, 오류 처리 개선, 트랜잭션 추적성 강화를 포함한 주요 변경사항을 설명합니다.

## 목차

1. [개요](#개요)
2. [주요 문제점](#주요-문제점)
3. [구현된 해결책](#구현된-해결책)
4. [핵심 변경사항](#핵심-변경사항)
5. [락 시스템 상세 설명](#락-시스템-상세-설명)
6. [오류 처리 개선](#오류-처리-개선)
7. [요청 ID 시스템](#요청-id-시스템)
8. [테스트 및 검증](#테스트-및-검증)
9. [향후 개선 사항](#향후-개선-사항)

## 개요

TESOLA NFT 민팅 시스템은 사용자가 NFT를 구매하고 민팅하는 과정을 관리합니다. 초기 시스템에서는 동시 요청, 트랜잭션 실패, 네트워크 문제 등으로 인한 데이터 불일치와 중복 민팅 문제가 발생했습니다. 이러한 문제를 해결하기 위해 락 시스템, 향상된 오류 처리, 강화된 추적성을 포함한 여러 개선 사항이 구현되었습니다.

## 주요 문제점

초기 NFT 민팅 시스템에서 식별된 주요 문제점은 다음과 같습니다:

1. **중복 민팅**: 동일한 NFT가 여러 사용자에게 민팅되는 경우가 발생
2. **고스트 락**: 트랜잭션 실패 후 락이 해제되지 않아 NFT가 "유령 상태"로 남는 문제
3. **불완전한 오류 복구**: 민팅 실패 시 적절한 롤백 메커니즘 부재
4. **제한된 추적성**: 문제 발생 시 디버깅이 어려움
5. **데이터 불일치**: 블록체인 상태와 데이터베이스 상태 간의 불일치

## 구현된 해결책

위 문제들을 해결하기 위해 다음과 같은 해결책이 구현되었습니다:

1. **타임아웃이 있는 락 시스템**: NFT 선택 시 3분 제한이 있는 락을 설정
2. **자동 정리 메커니즘**: 만료된 락을 자동으로 정리하여 고스트 락 방지
3. **요청 ID 기반 추적**: 각 요청에 고유 ID를 부여하여 전체 과정 추적
4. **강화된 오류 처리**: 각 단계에서 적절한 오류 처리 및 롤백
5. **검증 단계 추가**: 트랜잭션 완료 전에 여러 검증 단계를 추가

## 핵심 변경사항

### 1. 타임아웃이 있는 락 시스템 (`/utils/purchaseNFT.js`)

```javascript
// 락 타임아웃 설정 (3분)
const LOCK_TIMEOUT_MS = 180000;

// 만료된 락 정리
try {
  const { data: cleanupData, error: cleanupError } = await supabase.rpc('clean_expired_locks');
  if (cleanupError) {
    console.warn(`[${requestId}] Warning: Failed to clean expired locks: ${cleanupError.message}`);
  } else if (cleanupData) {
    console.log(`[${requestId}] Cleaned up ${cleanupData} expired locks`);
  }
} catch (cleanupErr) {
  console.warn(`[${requestId}] Warning: Error during lock cleanup: ${cleanupErr.message}`);
}

// 락 설정 (시간 제한 포함)
try {
  const now = new Date().toISOString();
  const { data: lockResult, error: lockError } = await supabase
    .from('minted_nfts')
    .update({
      status: 'locked',
      locked_by: walletAddress,
      updated_at: now
    })
    .eq('id', selectedNFT.id)
    .eq('status', 'available')
    .select();
  
  // ... 락 성공 여부 확인 및 처리
} catch (lockError) {
  // ... 오류 처리
}
```

### 2. 만료된 락 정리를 위한 데이터베이스 함수

```sql
-- 만료된 락을 정리하는 Supabase 함수
CREATE OR REPLACE FUNCTION clean_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- 3분 이상 지난 락을 해제
  UPDATE minted_nfts
  SET status = 'available', 
      locked_by = NULL
  WHERE status = 'locked' 
    AND updated_at < NOW() - INTERVAL '3 minutes';
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;
```

### 3. 요청 ID를 통한 추적성 향상

```javascript
// 요청 ID 생성
const requestId = crypto.randomBytes(8).toString('hex');
console.log(`[${requestId}] Starting NFT purchase for wallet ${walletAddress}`);

// 각 단계에서 요청 ID 포함하여 로깅
try {
  // ... 작업 수행
  console.log(`[${requestId}] NFT ${selectedNFT.id} locked successfully`);
} catch (error) {
  console.error(`[${requestId}] Error locking NFT: ${error.message}`);
  // ... 오류 처리
}
```

### 4. 민팅 완료 시 강화된 검증 (`/utils/completeMinting.js`)

```javascript
// 락 만료 여부 확인
if (lockData.updated_at) {
  const lockTimestamp = new Date(lockData.updated_at).getTime();
  const currentTime = Date.now();
  
  if (currentTime - lockTimestamp > LOCK_TIMEOUT_MS) {
    throw new Error(`Lock expired. Lock time: ${lockData.updated_at}, Timeout: ${LOCK_TIMEOUT_MS}ms`);
  }
}

// 락 소유자 확인
if (lockData.locked_by !== walletAddress) {
  throw new Error(`NFT is locked by another wallet. Expected: ${walletAddress}, Actual: ${lockData.locked_by}`);
}

// 상태 확인
if (lockData.status !== 'locked') {
  throw new Error(`Invalid NFT status: ${lockData.status}. Expected: locked`);
}
```

## 락 시스템 상세 설명

NFT 민팅 시스템의 핵심 개선사항은 타임아웃이 있는 락 시스템입니다. 이 시스템은 다음과 같이 작동합니다:

1. **락 타임아웃**: 모든 락에는 3분(180,000ms)의 타임아웃이 설정됩니다.
2. **자동 정리**: 새로운 NFT 구매 요청이 있을 때마다 만료된 락을 자동으로 정리합니다.
3. **락 획득**: NFT를 선택할 때 락을 획득하며, 성공 시에만 진행합니다.
4. **락 검증**: 민팅 완료 시 락이 유효한지, 만료되지 않았는지, 올바른 지갑에 의해 획득되었는지 검증합니다.
5. **락 해제**: 민팅 완료 후 상태를 'completed'로 변경하거나, 실패 시 'available'로 되돌립니다.

이 락 시스템은 다음과 같은 상황에서 효과적으로 작동합니다:

- **동시 요청**: 여러 사용자가 동시에 같은 NFT를 요청할 때 하나의 요청만 성공하도록 함
- **처리 지연**: 사용자가 결제를 완료하지 않고 이탈할 경우 3분 후 자동 해제
- **서버 장애**: 서버 재시작 후에도 타임아웃 메커니즘으로 고스트 락 방지

## 오류 처리 개선

오류 처리는 다음과 같이 개선되었습니다:

1. **구조화된 오류 응답**: 모든 오류는 일관된 형식으로 반환됩니다:

```javascript
{
  error: {
    code: "ERROR_CODE",
    message: "사용자 친화적인 메시지",
    details: "개발자 디버깅용 세부정보" // 개발 환경에서만 포함
  }
}
```

2. **단계별 롤백 메커니즘**: 각 단계에서 오류 발생 시 적절한 롤백 작업이 수행됩니다:

```javascript
try {
  // 1. NFT 락 획득
  const nft = await lockNFT();
  
  try {
    // 2. 블록체인 트랜잭션 구성
    const tx = await buildTransaction(nft);
    
    try {
      // 3. 트랜잭션 제출
      const result = await submitTransaction(tx);
      
      // 4. 성공 처리
      await completeProcess(nft, result);
    } catch (txError) {
      // 3단계 실패 시 롤백
      await releaseNFT(nft);
      throw txError;
    }
  } catch (buildError) {
    // 2단계 실패 시 롤백
    await releaseNFT(nft);
    throw buildError;
  }
} catch (lockError) {
  // 1단계 실패 시 처리
  throw lockError;
}
```

3. **상세한 로깅**: 각 단계에서 상세한 로그를 기록하여 디버깅을 용이하게 합니다:

```javascript
console.log(`[${requestId}] Step 1: Acquiring lock for NFT ${nftId}`);
// ... 락 획득 코드
console.log(`[${requestId}] Step 1: Success, lock acquired`);

console.log(`[${requestId}] Step 2: Building transaction`);
// ... 트랜잭션 구성 코드
console.log(`[${requestId}] Step 2: Success, transaction built with signature ${sig}`);

// ... 이하 동일
```

## 요청 ID 시스템

요청 ID 시스템은 다음과 같이 구현되었습니다:

1. **ID 생성**: 각 요청마다 고유한 ID를 생성합니다:

```javascript
const requestId = crypto.randomBytes(8).toString('hex');
```

2. **로그 연결**: 모든 로그 메시지에 요청 ID를 포함합니다:

```javascript
console.log(`[${requestId}] Starting NFT purchase process for wallet ${walletAddress}`);
// ... 다양한 단계의 로그
console.log(`[${requestId}] NFT purchase process completed successfully`);
```

3. **데이터베이스 추적**: 요청 ID를 데이터베이스에 저장하여 추적성을 높입니다:

```javascript
const { data, error } = await supabase
  .from('minted_nfts')
  .update({
    status: 'locked',
    locked_by: walletAddress,
    request_id: requestId,
    updated_at: now
  })
  .eq('id', selectedNFT.id)
  .select();
```

4. **응답 포함**: API 응답에 요청 ID를 포함시켜 클라이언트에서도 추적 가능하게 합니다:

```javascript
return res.status(200).json({
  success: true,
  requestId,
  nft: selectedNFT,
  price,
  ...otherData
});
```

## 테스트 및 검증

NFT 민팅 시스템의 개선사항은 다음과 같은 방법으로 테스트되었습니다:

1. **단위 테스트**: 락 획득, 만료 검증, 오류 처리 등 각 기능을 개별적으로 테스트
2. **동시성 테스트**: 여러 요청을 동시에 보내 락 시스템이 올바르게 작동하는지 확인
3. **회복 테스트**: 서버 장애를 시뮬레이션하여 시스템이 적절히 복구되는지 확인
4. **타임아웃 테스트**: 락 타임아웃이 올바르게 작동하는지 확인

테스트 결과:
- 동일한 NFT에 대한 동시 요청에서 하나만 성공하고 나머지는 실패
- 만료된 락은 자동으로 정리되어 다른 사용자가 사용 가능
- 트랜잭션 실패 시 롤백 메커니즘이 올바르게 작동
- 요청 ID를 통해 전체 프로세스가 정확히 추적됨

## 향후 개선 사항

NFT 민팅 시스템에서 추가로 개선할 수 있는 사항은 다음과 같습니다:

1. **분산 락 시스템**: 현재의 데이터베이스 기반 락에서 더 확장성 있는 분산 락 시스템으로 전환
2. **모니터링 및 알림**: 중요한 오류 및 이벤트에 대한 알림 시스템 구현
3. **자동화된 복구**: 오류 상태에서 자동 복구를 시도하는 백그라운드 작업 추가
4. **성능 최적화**: 데이터베이스 쿼리 및 블록체인 상호작용 최적화
5. **사용자 경험 개선**: 락 타임아웃, 오류 등에 대한 사용자 친화적인 메시지 제공