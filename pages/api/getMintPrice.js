// pages/api/getMintPrice.js
import { 
  sendSuccess, 
  sendError, 
  validateMethod, 
  withErrorHandling 
} from '../../utils/apiResponses';

/**
 * NFT 민팅 가격을 반환하는 API
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
    // 가격 정보 조회 (환경 변수 또는 기본값)
    const priceInLamports = process.env.NFT_PRICE_LAMPORTS
      ? parseInt(process.env.NFT_PRICE_LAMPORTS)
      : 1.5 * 1e9; // 기본 1.5 SOL
    
    // SOL 단위로 변환
    const priceInSol = priceInLamports / 1e9;
    
    // 캐싱 헤더 설정 (가격 정보는 1시간 캐싱)
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=3600', // 1시간 캐싱
    };
    
    // 성공 응답 반환
    return sendSuccess(res, 
      {
        price: `${priceInSol} SOL`,
        price_sol: priceInSol,
        price_lamports: priceInLamports,
      }, 
      200, 
      cacheHeaders
    );
  } catch (error) {
    console.error("[getMintPrice] Error:", error);
    return sendError(res, "Failed to retrieve mint price", 500, "SERVER_ERROR", error);
  }
}

// 오류 처리 래퍼로 핸들러 내보내기
export default withErrorHandling(handler);