import { createClient } from "@supabase/supabase-js";
import { 
  sendSuccess, 
  sendError, 
  handleSupabaseError, 
  validateMethod, 
  withErrorHandling 
} from '../../utils/apiResponses';
import { withReadOnlyApiMiddleware } from '../../utils/simpleApiMiddleware';

// Supabase 클라이언트 초기화
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase URL or Key not set in environment variables");
  // 정적 초기화 중에는 오류를 던지지 않고 로깅만 함
}

// Supabase 클라이언트 생성 (지연 초기화)
let supabaseClient = null;
const getSupabase = () => {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
};

/**
 * 현재까지 민팅된 NFT 수를 반환하는 API
 * 
 * @param {object} req - HTTP 요청 객체
 * @param {object} res - HTTP 응답 객체
 */
async function handler(req, res) {
  // HTTP 메서드 검증 (GET만 허용)
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }
  
  try {
    // Supabase 클라이언트 가져오기
    const supabase = getSupabase();
    if (!supabase) {
      return sendError(res, "Database configuration is missing", 500, "CONFIG_ERROR");
    }
    
    // 현재 민팅된 NFT 수 조회
    const { count, error } = await supabase
      .from("minted_nfts")
      .select("*", { count: "exact", head: true });

    // 에러 처리
    if (error) {
      return handleSupabaseError(res, error, "Failed to fetch minted count");
    }
    
    // 캐싱 헤더 설정 (민팅 수 정보는 5분 캐싱)
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=300', // 5분 캐싱
    };
    
    // 성공 응답 반환
    return sendSuccess(res, { 
      count: count || 0,
      supply: {
        minted: count || 0,
        total: parseInt(process.env.NFT_TOTAL_SUPPLY || "1000") // 총 공급량
      }
    }, 200, cacheHeaders);
    
  } catch (err) {
    console.error("[getMintedCount] Error:", err);
    return sendError(res, "Failed to retrieve minted count", 500, "SERVER_ERROR", err);
  }
}

// 미들웨어를 적용한 API 핸들러 내보내기
// 읽기 전용 API 미들웨어 (보안, 속도 제한, 캐싱, 에러 처리)와 오류 처리 래퍼 적용
export default withReadOnlyApiMiddleware(withErrorHandling(handler));