/**
 * Supabase 클라이언트 설정
 * 애플리케이션 전체에서 재사용 가능한 Supabase 클라이언트를 생성합니다.
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL 및 서비스 롤 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 애플리케이션 전체에서 사용할 Supabase 클라이언트 인스턴스
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;