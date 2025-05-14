/**
 * 스테이킹 작업의 성능을 측정하고 로깅하기 위한 유틸리티 모듈
 */

// 성능 측정 시작 시간을 저장하는 맵
const startTimes = new Map();

// 최근 성능 메트릭을 저장하는 객체
const recentMetrics = {
  staking: [],
  unstaking: [],
  poolInitialization: [],
  rewardCalculation: []
};

// 최대 저장 항목 수
const MAX_METRICS = 100;

/**
 * 성능 측정 시작
 * @param {string} operationId - 작업 식별자 (고유한 값이어야 함)
 * @param {string} operationType - 작업 유형 (staking, unstaking, poolInitialization, rewardCalculation)
 * @param {object} metadata - 작업 관련 메타데이터
 */
export function startPerformanceMeasurement(operationId, operationType, metadata = {}) {
  startTimes.set(operationId, {
    startTime: performance.now(),
    operationType,
    metadata
  });
  
  console.log(`[성능 측정] ${operationType} 작업 시작: ${operationId}`);
}

/**
 * 성능 측정 종료 및 로깅
 * @param {string} operationId - 작업 식별자 (startPerformanceMeasurement에서 사용한 것과 일치해야 함)
 * @param {object} additionalMetadata - 추가 메타데이터
 * @returns {object|null} 성능 측정 결과, 시작되지 않은 작업이면 null
 */
export function endPerformanceMeasurement(operationId, additionalMetadata = {}) {
  if (!startTimes.has(operationId)) {
    console.warn(`[성능 측정] 시작되지 않은 작업 ID: ${operationId}`);
    return null;
  }
  
  const endTime = performance.now();
  const { startTime, operationType, metadata } = startTimes.get(operationId);
  const duration = endTime - startTime;
  
  // 메트릭 객체 생성
  const metric = {
    operationId,
    operationType,
    startTime,
    endTime,
    duration,
    timestamp: new Date().toISOString(),
    metadata: { ...metadata, ...additionalMetadata }
  };
  
  // 작업 유형별 메트릭 저장
  if (recentMetrics[operationType]) {
    recentMetrics[operationType].push(metric);
    
    // 최대 크기 유지
    if (recentMetrics[operationType].length > MAX_METRICS) {
      recentMetrics[operationType].shift();
    }
  }
  
  console.log(`[성능 측정] ${operationType} 작업 완료: ${operationId}, 소요 시간: ${duration.toFixed(2)}ms`);
  
  // 시작 시간 맵에서 제거
  startTimes.delete(operationId);
  
  return metric;
}

/**
 * 지정된 작업 유형의 평균 성능 측정 값을 반환
 * @param {string} operationType - 작업 유형
 * @returns {number} 평균 소요 시간 (밀리초)
 */
export function getAveragePerformance(operationType) {
  const metrics = recentMetrics[operationType];
  
  if (!metrics || metrics.length === 0) {
    return 0;
  }
  
  const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0);
  return totalDuration / metrics.length;
}

/**
 * 모든 작업 유형의 성능 통계를 반환
 * @returns {object} 작업 유형별 성능 통계
 */
export function getPerformanceStatistics() {
  const statistics = {};
  
  for (const [operationType, metrics] of Object.entries(recentMetrics)) {
    if (metrics.length === 0) {
      statistics[operationType] = {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0
      };
      continue;
    }
    
    const durations = metrics.map(metric => metric.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    
    statistics[operationType] = {
      count: metrics.length,
      avgDuration: durations.reduce((sum, duration) => sum + duration, 0) / metrics.length,
      minDuration: sortedDurations[0],
      maxDuration: sortedDurations[sortedDurations.length - 1],
      p95Duration: sortedDurations[Math.floor(sortedDurations.length * 0.95)]
    };
  }
  
  return statistics;
}

/**
 * 진행 중인 작업 수를 반환
 * @returns {number} 진행 중인 작업 수
 */
export function getActiveOperationsCount() {
  return startTimes.size;
}

/**
 * 성능 측정 데이터 초기화
 */
export function resetPerformanceMetrics() {
  startTimes.clear();
  
  for (const operationType of Object.keys(recentMetrics)) {
    recentMetrics[operationType] = [];
  }
  
  console.log('[성능 측정] 모든 메트릭이 초기화되었습니다.');
}

// 모듈 내보내기
export default {
  startPerformanceMeasurement,
  endPerformanceMeasurement,
  getAveragePerformance,
  getPerformanceStatistics,
  getActiveOperationsCount,
  resetPerformanceMetrics
};