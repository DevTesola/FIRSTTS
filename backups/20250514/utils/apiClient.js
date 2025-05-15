/**
 * API 클라이언트 유틸리티
 * 
 * 표준화된 방식으로 API 요청을 처리하고 응답을 일관되게 처리하는 함수들을 제공합니다.
 */

/**
 * API GET 요청을 보내는 함수
 * 
 * @param {string} endpoint - API 엔드포인트 경로 (예: "/api/getStakingStats")
 * @param {object} params - 쿼리 파라미터 객체
 * @param {object} options - 추가 fetch 옵션
 * @returns {Promise<object>} 처리된 API 응답
 * @throws {Error} API 오류 또는 네트워크 오류
 */
export async function fetchAPI(endpoint, params = {}, options = {}) {
  // 쿼리 파라미터 생성
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  // 캐시 방지 파라미터 추가 (필요한 경우)
  if (options.noCache) {
    queryParams.append('nocache', Date.now());
  }
  
  // URL 생성
  const url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  // 기본 fetch 옵션 설정
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  // 옵션에서 noCache 제거 (fetch API에 필요하지 않은 속성)
  if (fetchOptions.noCache) {
    delete fetchOptions.noCache;
  }
  
  try {
    // API 요청 보내기
    const response = await fetch(url, fetchOptions);
    
    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`API 응답이 JSON 형식이 아닙니다: ${contentType}`);
    }
    
    // JSON 변환
    const data = await response.json();
    
    // 표준화된 응답 처리
    if (!response.ok) {
      // API 에러 응답 (HTTP 4xx/5xx)
      const errorMessage = data.error || `HTTP 오류 ${response.status}`;
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      error.code = data.code || 'API_ERROR';
      error.details = data.details;
      throw error;
    }
    
    // 표준화된 응답 형식 검사
    if (data.success === false) {
      // API는 성공적으로 응답했지만 비즈니스 로직 에러 반환
      const errorMessage = data.error || 'Unknown API error';
      const error = new Error(errorMessage);
      error.code = data.code || 'BUSINESS_LOGIC_ERROR';
      error.details = data.details;
      throw error;
    }
    
    // 응답 구조 확인 및 적절한 데이터 반환
    // 1. 표준화된 응답 형식 (success/data 패턴)인 경우
    // 2. 기존 API 응답 형식 (success/data 패턴이 아닌 경우)이라면 그대로 반환
    // console.log('API Response Format:', JSON.stringify(data).substring(0, 200)); // 디버깅용
    
    // 명시적으로 success 필드가 있고 data 필드가 있는 경우에만 data 필드 반환
    // 그 외에는 원본 데이터 그대로 반환하여 하위 호환성 유지
    if (data && typeof data === 'object' && 'success' in data && data.success === true && 'data' in data) {
      return data.data;
    }
    
    // 기존 API 응답 형식
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // 커스텀 에러 정보가 있으면 보강, 없으면 원본 에러 그대로 전달
    if (!error.isApiError) {
      error.endpoint = endpoint;
      error.params = params;
      error.isApiError = true;
    }
    
    throw error;
  }
}

/**
 * API POST 요청을 보내는 함수
 * 
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {object} data - 요청 바디 데이터
 * @param {object} options - 추가 fetch 옵션
 * @returns {Promise<object>} 처리된 API 응답
 */
export async function postAPI(endpoint, data = {}, options = {}) {
  return fetchAPI(endpoint, {}, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
}

/**
 * API 응답에서 에러 메시지 추출
 * 
 * @param {Error} error - API 호출 중 발생한 에러
 * @param {string} fallbackMessage - 기본 에러 메시지
 * @returns {string} 사용자에게 보여줄 수 있는 에러 메시지
 */
export function getErrorMessage(error, fallbackMessage = '요청을 처리하는 중 오류가 발생했습니다.') {
  if (!error) return fallbackMessage;
  
  // API 에러 메시지가 있으면 사용
  if (error.message) return error.message;
  
  // 일반 문자열이라면 그대로 사용
  if (typeof error === 'string') return error;
  
  // 객체인 경우 error 속성 확인
  if (error.error && typeof error.error === 'string') return error.error;
  
  // 기본 메시지 반환
  return fallbackMessage;
}

/**
 * API 응답에서 데이터 정규화
 * 
 * 다양한 API의 응답 포맷을 일관된 형태로 변환합니다.
 * 
 * @param {object} data - API 응답 데이터
 * @param {object} options - 변환 옵션
 * @returns {object} 정규화된 데이터
 */
export function normalizeApiResponse(data, options = {}) {
  // 응답이 없으면 빈 객체 반환
  if (!data) return {};

  // success/data 형식이면 data 추출
  if (data.success === true && data.data !== undefined) {
    return data.data;
  }
  
  // 그대로 반환
  return data;
}

// 기본 내보내기
export default {
  fetchAPI,
  postAPI,
  getErrorMessage,
  normalizeApiResponse
};