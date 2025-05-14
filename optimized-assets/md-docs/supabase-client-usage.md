# TESOLA Supabase 클라이언트 사용 가이드

본 문서는 TESOLA 프로젝트의 Supabase 데이터베이스 연결을 위한 최적화된 클라이언트 유틸리티 사용법을 설명합니다.

## 주요 기능

- 연결 풀링을 통한 DB 연결 최적화
- 쿼리 결과 캐싱으로 성능 향상
- 페이지네이션 지원
- 대량 데이터 처리를 위한 배치 작업
- 오류 처리 표준화

## 기본 사용법

### 클라이언트 가져오기

```javascript
import { getSupabase, getSupabaseAdmin } from '../utils/supabaseClient';

// 일반 권한 클라이언트 (Row Level Security 적용)
const supabase = getSupabase();

// 관리자 권한 클라이언트 (RLS 우회)
const supabaseAdmin = getSupabaseAdmin();
```

### 기본 데이터 쿼리

```javascript
// 기본 데이터 조회
const { data, error } = await supabase
  .from('users')
  .select('id, username, email')
  .eq('status', 'active');
  
if (error) {
  console.error('쿼리 오류:', error);
  return;
}

// 데이터 처리
console.log('사용자 목록:', data);
```

## 고급 기능

### 1. 쿼리 결과 캐싱

반복되는 쿼리 결과를 캐싱하여 성능 향상:

```javascript
import { cachedQuery } from '../utils/supabaseClient';

// 결과를 캐싱하는 쿼리 실행 (기본 TTL: 1분)
const userData = await cachedQuery(
  'user-info-123', // 캐시 키
  async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, profile')
      .eq('id', 123)
      .single();
      
    if (error) throw error;
    return data;
  },
  60 * 1000 // 캐시 TTL: 1분 (선택 사항)
);

// 같은 캐시 키로 다시 호출하면 캐시된 결과를 반환
const sameUserData = await cachedQuery('user-info-123', /* 같은 쿼리 함수 */);
```

### 2. 캐시 무효화

데이터가 변경되면 관련 캐시 항목 제거:

```javascript
import { invalidateCache } from '../utils/supabaseClient';

// 특정 캐시 항목 제거
invalidateCache('user-info-123');

// 정규식 패턴으로 여러 캐시 항목 제거
invalidateCache(/^user-info-/); // 'user-info-'로 시작하는 모든 캐시 항목 제거
```

### 3. 페이지네이션 쿼리

페이지네이션이 필요한 목록 조회:

```javascript
import { paginatedQuery } from '../utils/supabaseClient';

// 페이지네이션 쿼리 실행
const usersPage = await paginatedQuery(
  supabase, // Supabase 클라이언트
  'users', // 테이블 이름
  {
    page: 2, // 페이지 번호 (1부터 시작)
    pageSize: 20, // 페이지당 항목 수
    orderBy: 'created_at', // 정렬 컬럼
    ascending: false, // 내림차순 정렬
    filters: {
      status: 'active', // 기본 필터 (eq)
      points: { gt: 100 }, // 고급 필터 (greater than)
      role: { in: ['user', 'moderator'] } // in 필터
    },
    select: 'id, username, email, created_at' // 조회할 컬럼
  }
);

// 응답 형식
// {
//   data: [...], // 현재 페이지 데이터
//   page: 2, // 현재 페이지
//   pageSize: 20, // 페이지 크기
//   total: 156, // 전체 항목 수
//   totalPages: 8 // 전체 페이지 수
// }
```

### 4. 배치 작업

대량의 데이터를 효율적으로 처리:

```javascript
import { batchOperation } from '../utils/supabaseClient';

// 대량의 데이터 삽입
const users = [
  { username: 'user1', email: 'user1@example.com' },
  { username: 'user2', email: 'user2@example.com' },
  // ... 더 많은 항목
];

// 배치 작업 실행 (100개씩 처리)
const results = await batchOperation(
  supabase, // Supabase 클라이언트
  'users', // 테이블 이름
  'insert', // 작업 타입 ('insert', 'update', 'upsert', 'delete')
  users, // 데이터 배열
  100 // 배치 크기 (선택 사항, 기본값: 100)
);
```

## 오류 처리 통합

Supabase 오류 처리와 API 응답 유틸리티 통합:

```javascript
import { getSupabase } from '../utils/supabaseClient';
import { handleSupabaseError, sendSuccess } from '../utils/apiResponses';

// API 핸들러 예시
export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    
    // 데이터 쿼리
    const { data, error } = await supabase
      .from('products')
      .select('*');
      
    // Supabase 오류 처리
    if (error) {
      return handleSupabaseError(res, error, '상품 목록 조회 실패');
    }
    
    // 성공 응답
    return sendSuccess(res, { products: data });
    
  } catch (err) {
    console.error('예상치 못한 오류:', err);
    return handleSupabaseError(res, err, '서버 오류 발생');
  }
}
```

## 성능 최적화 팁

1. **필요한 컬럼만 조회**: 항상 `select()`에 필요한 컬럼만 지정하세요.
2. **적절한 인덱스 활용**: 자주 필터링하는 컬럼에 인덱스를 설정하세요.
3. **캐싱 활용**: 자주 조회하는 데이터는 `cachedQuery`를 사용하세요.
4. **일괄 처리**: 대량의 데이터 처리는 항상 `batchOperation`을 사용하세요.
5. **페이지네이션**: 대량의 목록 조회 시 항상 페이지네이션을 적용하세요.

## 주의 사항

1. **민감한 쿼리**: 민감한 데이터를 다룰 때는 항상 `getSupabaseAdmin()`을 사용하고, 적절한 접근 제어를 구현하세요.
2. **캐시 TTL 설정**: 데이터의 변경 빈도에 맞게 적절한 캐시 TTL을 설정하세요.
3. **오류 처리**: Supabase 쿼리 결과의 `error` 객체를 항상 확인하세요.
4. **트랜잭션 제한**: Supabase는 완전한 트랜잭션을 지원하지 않으므로, 복잡한 트랜잭션이 필요한 경우 다른 방법을 고려하세요.

## 예제: 완전한 API 엔드포인트

```javascript
// pages/api/users/[id].js
import { getSupabase } from '../../../utils/supabaseClient';
import { 
  sendSuccess, 
  sendError, 
  handleSupabaseError, 
  validateMethod 
} from '../../../utils/apiResponses';
import { withApiMiddleware } from '../../../utils/apiMiddleware';

async function handler(req, res) {
  // HTTP 메서드 검증
  if (!validateMethod(req, res, ['GET', 'PUT', 'DELETE'])) {
    return;
  }
  
  // 사용자 ID 가져오기
  const { id } = req.query;
  if (!id) {
    return sendError(res, '사용자 ID가 필요합니다', 400, 'MISSING_ID');
  }
  
  const supabase = getSupabase();
  
  try {
    // GET 요청 처리
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, profile, created_at')
        .eq('id', id)
        .single();
        
      if (error) {
        return handleSupabaseError(res, error, '사용자 정보 조회 실패');
      }
      
      return sendSuccess(res, { user: data });
    }
    
    // PUT 요청 처리
    if (req.method === 'PUT') {
      const { username, email, profile } = req.body;
      
      const { data, error } = await supabase
        .from('users')
        .update({ username, email, profile, updated_at: new Date() })
        .eq('id', id)
        .single();
        
      if (error) {
        return handleSupabaseError(res, error, '사용자 정보 업데이트 실패');
      }
      
      return sendSuccess(res, { user: data });
    }
    
    // DELETE 요청 처리
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (error) {
        return handleSupabaseError(res, error, '사용자 삭제 실패');
      }
      
      return sendSuccess(res, { message: '사용자가 삭제되었습니다' });
    }
    
  } catch (err) {
    console.error('예상치 못한 오류:', err);
    return sendError(res, '서버 오류 발생', 500, 'SERVER_ERROR', err);
  }
}

// 미들웨어 적용하여 내보내기
export default withApiMiddleware(handler);
```