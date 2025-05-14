# 컬럼 이름 불일치 수정 요약

## 문제 설명

데이터베이스의 `nft_staking` 테이블은 `tx_signature` 컬럼을 사용하지만, 일부 코드는 `transaction_signature`를 참조하여 오류가 발생했습니다. 이로 인해 스테이킹 데이터가 데이터베이스에 제대로 저장되지 않고, 온체인 ID (예: "onchain_Fos7QW8J")를 가진 스테이킹 레코드의 언스테이킹이 실패했습니다.

## 수정된 파일

1. `/pages/api/staking/completeStaking-unified.js`:
   - `transaction_signature` → `tx_signature` 변경

2. `/pages/api/staking/completeStaking-anchor.js`:
   - `transaction_signature` → `tx_signature` 변경

3. `/pages/api/staking/getStakingStats.js`:
   - 모든 `transaction_signature` 참조를 `tx_signature`로 변경
   - 메시지 텍스트 수정: "스키마 확인 오류. transaction_signature 없이 시도" → "스키마 확인 오류. tx_signature 없이 시도"

4. `/pages/api/staking/completeEmergencyUnstaking.js`:
   - `transaction_signature` → `unstake_tx_signature` 변경
   - `penalty_percentage` → `unstake_penalty_percentage` 변경
   - `final_rewards` → `unstake_final_reward` 변경

## 이미 올바른 컬럼명을 사용하는 파일

1. `/pages/api/staking/completeStaking.js`: 이미 `tx_signature` 사용 중
2. `/pages/api/completeStaking.js`: 이미 `tx_signature` 사용 중

## 수정 전략

1. 데이터베이스 구조에 맞게 코드를 수정했습니다 (현재 테이블 스키마):
   - `tx_signature`: 스테이킹 트랜잭션의 서명
   - `unstake_tx_signature`: 언스테이킹 트랜잭션의 서명
   - `unstake_penalty_percentage`: 언스테이킹 패널티 비율
   - `unstake_final_reward`: 언스테이킹 후 최종 보상

2. 수정된 코드를 통해 온체인에서 감지된 스테이킹(onchain_* ID)에 대한 언스테이킹이 가능해집니다.

## 데이터베이스 스키마 참조

상세한 데이터베이스 스키마:

| column_name                | data_type                | character_maximum_length | is_nullable |
| -------------------------- | ------------------------ | ------------------------ | ----------- |
| id                         | integer                  | null                     | NO          |
| wallet_address             | text                     | null                     | NO          |
| mint_address               | text                     | null                     | NO          |
| staking_period             | integer                  | null                     | NO          |
| staked_at                  | timestamp with time zone | null                     | NO          |
| release_date               | timestamp with time zone | null                     | NO          |
| unstaked_at                | timestamp with time zone | null                     | YES         |
| total_rewards              | numeric                  | null                     | NO          |
| earned_rewards             | numeric                  | null                     | YES         |
| daily_reward_rate          | numeric                  | null                     | NO          |
| early_unstake_penalty      | numeric                  | null                     | YES         |
| tx_signature               | text                     | null                     | NO          |
| unstake_tx_signature       | text                     | null                     | YES         |
| status                     | text                     | null                     | NO          |
| nft_tier                   | text                     | null                     | NO          |
| created_at                 | timestamp with time zone | null                     | YES         |
| updated_at                 | timestamp with time zone | null                     | YES         |
| base_reward_rate           | numeric                  | null                     | YES         |
| long_term_bonus_rate       | numeric                  | null                     | YES         |
| estimated_rewards_json     | jsonb                    | null                     | YES         |
| nft_name                   | text                     | null                     | YES         |
| original_tier_value        | text                     | null                     | YES         |
| final_reward               | numeric                  | null                     | YES         |
| unstake_penalty_percentage | numeric                  | null                     | YES         |
| unstake_penalty_amount     | numeric                  | null                     | YES         |
| unstake_final_reward       | numeric                  | null                     | YES         |
| last_verified              | timestamp with time zone | null                     | YES         |
| validation_logs            | jsonb                    | null                     | YES         |
| api_version                | text                     | null                     | YES         |