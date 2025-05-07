# 스테이킹 문제 해결 가이드

이 문서는 스테이킹 문제를 해결하기 위한 지침을 제공합니다.

## 문제 상황

현재 발생한 문제:
- 데이터베이스에는 NFT가 스테이킹된 것으로 기록되어 있지만 온체인에는 계정이 존재하지 않습니다.
- 오류 메시지: `Stake info account does not exist on-chain`

## 해결 단계

### 1. 스테이킹 상태 확인 스크립트 실행

먼저 스테이킹 상태를 확인하는 스크립트를 실행하세요:

```bash
# .env 파일이 있는지 확인 (없으면 생성)
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" > .env
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key" >> .env

# 스크립트 실행
node fix-staking-status.js
```

이 스크립트는 모든 스테이킹된 NFT를 확인하고 온체인 상태와 일치하지 않는 항목을 표시합니다.

### 2. 특정 NFT 확인

특정 NFT를 확인하려면:

```bash
node fix-staking-status.js check 3CdamxQPu6W5hksLqPwmc71gbAKPCutWNjrawi6duY7R
```

### 3. 데이터베이스 상태 수정

온체인에 존재하지 않는 스테이킹 레코드의 상태를 수정하려면:

```bash
# ID가 20인 레코드를 'failed' 상태로 변경
node fix-staking-status.js update 20 failed
```

또는 스크립트에서 제공하는 안내에 따라 자동으로 모든 불일치 항목을 수정할 수 있습니다.

## 수동 수정 방법

Supabase 대시보드를 통해 데이터를 직접 수정할 수도 있습니다:

1. Supabase 대시보드에 로그인
2. Table Editor > nft_staking 테이블 선택
3. ID가 20인 레코드를 찾아 status 필드를 'failed'로 변경

## 프론트엔드 수정

언스테이킹 실패 시 사용자에게 더 명확한 오류 메시지를 표시하도록 프론트엔드 코드를 수정할 수 있습니다:

```javascript
try {
  const response = await fetch('/api/prepareUnstaking_v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, mintAddress, stakingId })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    // 오류 메시지 처리
    if (data.error && data.error.includes('스테이킹 정보를 찾을 수 없습니다')) {
      // 사용자에게 친화적인 메시지 표시
      alert('스테이킹 정보를 온체인에서 찾을 수 없습니다. 관리자에게 문의하세요.');
      // 또는 데이터베이스 상태 자동 수정 (관리자 권한 필요)
      await fetch('/api/admin/fixStakingStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakingId, newStatus: 'failed' })
      });
    } else {
      alert('언스테이킹 오류: ' + data.error);
    }
    return;
  }
  
  // 성공 로직...
} catch (error) {
  console.error('언스테이킹 중 오류:', error);
  alert('언스테이킹 중 오류가 발생했습니다.');
}
```

## 관리자용 API 추가

상태 수정을 위한 간단한 API 엔드포인트를 추가하려면:

```javascript
// pages/api/admin/fixStakingStatus.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // 간단한 관리자 검증 (실제로는 더 강력한 인증 필요)
  const { admin_key } = req.headers;
  if (admin_key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { stakingId, newStatus } = req.body;
    
    if (!stakingId || !newStatus) {
      return res.status(400).json({ error: 'stakingId and newStatus are required' });
    }
    
    const { data, error } = await supabase
      .from('nft_staking')
      .update({ status: newStatus })
      .eq('id', stakingId)
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## 향후 방지 방법

이런 문제를 방지하기 위해:

1. 스테이킹 트랜잭션 후 온체인 확인 로직 추가:
   ```javascript
   // 트랜잭션 완료 후 확인
   const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
   if (!stakeInfoAccount) {
     // 트랜잭션은 성공했지만 계정이 생성되지 않음
     return res.status(500).json({ 
       error: '트랜잭션은 성공했지만 스테이킹 계정이 생성되지 않았습니다',
       success: false 
     });
   }
   ```

2. 데이터베이스 업데이트 전 온체인 확인:
   ```javascript
   // 데이터베이스에 저장하기 전 확인
   const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
   if (stakeInfoAccount) {
     // 데이터베이스에 저장
     await supabase.from('nft_staking').insert({...});
   }
   ```