# NFT 스테이킹 문제 수동 해결 가이드

현재 문제:
- 스테이킹 레코드 ID 20(민트 주소: 3CdamxQPu6W5hksLqPwmc71gbAKPCutWNjrawi6duY7R)이 데이터베이스에는 'staked'로 기록되어 있으나 온체인에는 계정이 존재하지 않습니다.
- 이로 인해 언스테이킹 시도 시 "Stake info account does not exist on-chain" 오류가 발생합니다.

## 해결 방법 1: Supabase 대시보드 사용

1. Supabase 대시보드(https://app.supabase.com)에 로그인합니다.
2. 해당 프로젝트를 선택합니다.
3. 왼쪽 사이드바에서 "Table Editor"를 클릭합니다.
4. "nft_staking" 테이블을 선택합니다.
5. ID가 20인 레코드를 찾습니다(필터링 기능 사용).
6. "status" 열의 값을 'staked'에서 'failed'로 변경합니다.
7. 변경사항을 저장합니다.

## 해결 방법 2: SQL 쿼리 실행

1. Supabase 대시보드에서 "SQL Editor"를 클릭합니다.
2. 새 쿼리를 생성하고 다음 SQL을 입력합니다:

```sql
-- 먼저 현재 상태 확인
SELECT * FROM nft_staking WHERE id = 20;

-- 상태 업데이트
UPDATE nft_staking 
SET status = 'failed' 
WHERE id = 20;

-- 업데이트 확인
SELECT * FROM nft_staking WHERE id = 20;
```

3. "Run" 버튼을 클릭하여 쿼리를 실행합니다.

## 해결 방법 3: API 엔드포인트 사용

개발 서버가 실행 중인 경우 다음 API 엔드포인트를 호출할 수 있습니다:

```bash
curl -X POST http://localhost:3000/api/admin/fixStakingStatus \
  -H "Content-Type: application/json" \
  -H "admin_key: YOUR_ADMIN_SECRET_KEY" \
  -d '{"stakingId": 20, "newStatus": "failed"}'
```

`YOUR_ADMIN_SECRET_KEY`는 서버에 설정된 관리자 키로 교체해야 합니다.

## 해결 방법 4: 직접 데이터베이스 액세스 사용

pgAdmin 또는 다른 PostgreSQL 클라이언트를 사용하여 데이터베이스에 직접 연결하고 SQL 쿼리를 실행할 수 있습니다.

## 다음 단계

레코드 상태를 'failed'로 변경한 후에는:

1. 사용자에게 NFT를 다시 스테이킹하도록 안내합니다.
2. 수정된 prepareUnstaking_v3.js 파일을 배포합니다.
3. 모든 스테이킹 레코드를 검사하여 유사한 불일치가 없는지 확인합니다.

## 향후 방지 방법

이런 문제를 방지하기 위해:

1. 트랜잭션이 실제로 완료된 후에만 데이터베이스 상태를 업데이트합니다.
2. 온체인 계정의 존재 여부를 확인하는 검증 로직을 추가합니다.
3. 트랜잭션 로깅을 개선하여 실패한 트랜잭션을 추적합니다.