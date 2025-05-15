const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.resolve('/home/tesola/ttss/tesolafixjs/components/staking/StakingDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define replacements
const replacements = [
  { from: '// Reducer 함수 정의 - 컴포넌트 외부에 위치', to: '// Reducer function definition - located outside the component' },
  { from: '// 이전 업데이트가 있는지 확인', to: '// Check if there\'s a previous update' },
  { from: '// 기존 항목 업데이트', to: '// Update existing item' },
  { from: '// 새 항목 추가', to: '// Add new item' },
  { from: '// 마지막 10개 업데이트만 유지', to: '// Keep only the last 10 updates' },
  { from: '// 초기 상태 정의', to: '// Define initial state' },
  { from: '// 비동기 ID 해결을 위한 state', to: '// State for async ID resolution' },
  { from: '* 최적화된 상태 관리를 위해 useReducer 사용', to: '* Using useReducer for optimized state management' },
  { from: '// useReducer를 사용하여 관련 상태를 하나로 통합', to: '// Using useReducer to consolidate related states' },
  { from: '// 상태 값을 구조 분해 할당으로 쉽게 접근', to: '// Easily access state values using destructuring assignment' },
  { from: '// 스테이킹 NFT의 실제 ID 해결을 위한 useEffect - 무한 렌더링 방지를 위해 최적화', to: '// useEffect for resolving actual IDs of staked NFTs - optimized to prevent infinite rendering' },
  { from: '`받은 스테이킹 NFT ${stats.activeStakes.length}개 중 유효한 데이터 필터링`', to: '`Filtering valid data from ${stats.activeStakes.length} received staking NFTs`' },
  { from: '// 민트 주소가 있는 NFT만 필터링 - 데이터 일관성 유지', to: '// Only filter NFTs with mint addresses - maintain data consistency' },
  { from: '`유효하지 않은 스테이킹 NFT ${stats.activeStakes.length - validStakes.length}개 제외`', to: '`Excluded ${stats.activeStakes.length - validStakes.length} invalid staking NFTs`' },
  { from: '// 초기 상태 설정: 기존 ID 또는 null로 설정', to: '// Initial state setup: set to existing ID or null' },
  { from: '// 상태 업데이트는 한 번만 수행', to: '// State update is performed only once' },
  { from: '// 비동기 처리를 위한 함수 - useEffect 내부의 함수는 의존성에 포함되지 않음', to: '// Function for async processing - functions inside useEffect are not included in dependencies' },
  { from: '// 이미 처리된 민트 주소 추적', to: '// Track already processed mint addresses' },
  { from: '// 중복 처리 방지', to: '// Prevent duplicate processing' },
  { from: '// 모든 NFT에 대해 민트 주소에서 ID 결정론적으로 추출', to: '// Deterministically extract ID from mint address for all NFTs' },
  { from: '// NFT ID 해결 로깅 추가', to: '// Add logging for NFT ID resolution' },
  { from: '`스테이킹 NFT 처리 완료: 민트=${stake.mint_address}, 해결ID=${realId}`', to: '`Staking NFT processing complete: mint=${stake.mint_address}, resolvedID=${realId}`' },
  { from: '// 실제 ID가 조회되면 state 업데이트 - 컴포넌트가 마운트되어 있는지 확인', to: '// Update state when real ID is retrieved - check if component is still mounted' },
  { from: '// 현재 상태 가져와서 업데이트', to: '// Get current state and update' },
  { from: '// 인덱스가 유효한지 확인', to: '// Check if index is valid' },
  { from: '// 상태 업데이트 디스패치', to: '// Dispatch state update' },
  { from: '`NFT ID 해결 중 오류: ${stake.mint_address}`', to: '`Error resolving NFT ID: ${stake.mint_address}`' },
  { from: '// 약간의 지연으로 초기 렌더링 완료 후 실행', to: '// Run after initial rendering with slight delay' },
  { from: '// 비동기 함수 실행', to: '// Execute async function' },
  { from: '// 전체 배열 대신 길이만 의존성에 포함', to: '// Include only length in dependency instead of entire array' },
  { from: '// Subscribe to all stake accounts when stats change - 무한 렌더링 방지', to: '// Subscribe to all stake accounts when stats change - prevent infinite rendering' },
  { from: '// 비동기 작업을 별도 함수로 분리', to: '// Separate async work into a dedicated function' },
  { from: '// 구독 작업을 setTimeout으로 분리하여 렌더링 사이클과 분리', to: '// Separate subscription work with setTimeout to detach from rendering cycle' },
  { from: '// stakesWithIds에 데이터가 있으면 사용하고, 그렇지 않으면 원본 사용', to: '// Use data from stakesWithIds if available, otherwise use original' },
  { from: '`처리된 스테이킹 NFT ID들: ${stakesToUse.map(s => s.nft_id || \'null\').join(\', \')}`', to: '`Processed staking NFT IDs: ${stakesToUse.map(s => s.nft_id || \'null\').join(\', \')}`' },
  { from: '// 정렬은 stakesToUse 사용 (최신 ID 정보 포함)', to: '// Use stakesToUse for sorting (includes latest ID information)' },
  { from: '// 기본 초기값 설정', to: '// Set default initial values' },
  { from: '// 데이터가 없으면 기본값 반환', to: '// Return default value if there\'s no data' },
  { from: '// 분포 계산을 위한 객체 복제', to: '// Clone object for distribution calculation' },
  { from: '// 배열 복제 후 작업하여 불변성 유지', to: '// Work with array clone to maintain immutability' },
  { from: '// 오류 발생 시 기본값 반환', to: '// Return default value if an error occurs' },
  { from: '// activeStakes 배열 전체가 아닌 길이만 의존성에 포함', to: '// Include only length in dependency instead of entire activeStakes array' },
  { from: '{/* 스테이킹 동기화 버튼 추가 */}', to: '{/* Add staking synchronization button */}' },
  { from: '// 동기화 중 로딩 표시 - 항상 내부 상태만 사용', to: '// Show loading during synchronization - always use internal state only' },
  { from: '// 동기화 전 현재 상태 기록', to: '// Record current state before synchronization' },
  { from: '\'현재 표시된 스테이킹 NFT:\'', to: '\'Currently displayed staking NFTs:\'' },
  { from: '// 현재 표시된 NFT들의 ID 정보 출력', to: '// Output ID information of currently displayed NFTs' },
  { from: '\'현재 표시된 NFT 정보:\'', to: '\'Currently displayed NFT information:\'' },
  { from: '// 새로 추가한 강제 동기화 API 사용', to: '// Use newly added forced synchronization API' },
  { from: '\'강제 동기화 API 호출 시도...\'', to: '\'Attempting to call force sync API...\'' },
  { from: '\"강제 동기화 결과:\"', to: '\"Force sync result:\"' },
  { from: '`성공적으로 ${data.stakedCount}개의 NFT를 동기화했습니다`', to: '`Successfully synchronized ${data.stakedCount} NFTs`' },
  { from: '\'동기화된 NFT 정보:\'', to: '\'Synchronized NFT information:\'' },
  { from: '\'동기화 중 오류 발생:\'', to: '\'Error during synchronization:\'' },
  { from: '\'알 수 없는 오류\'', to: '\'Unknown error\'' },
  { from: '\'동기화 중 오류가 발생했습니다. 다시 시도해주세요.\'', to: '\'An error occurred during synchronization. Please try again.\'' },
  { from: '// 동기화 완료 후 데이터 새로고침', to: '// Refresh data after synchronization completes' },
  { from: '// 약간의 지연 후 새로고침 (DB 업데이트가 완료되도록)', to: '// Refresh after a slight delay (to allow DB updates to complete)' },
  { from: '\'데이터 새로고침 완료\'', to: '\'Data refresh complete\'' },
  { from: '// 로딩 상태 해제 - 항상 내부 상태만 사용', to: '// Reset loading state - always use internal state only' },
  { from: '// 정적 값 사용하여 무한 렌더링 방지', to: '// Use static values to prevent infinite rendering' },
  { from: '// 온체인 데이터 기반 처리 표시', to: '// Display processing based on on-chain data' },
  { from: '// 캐시 버스팅 추가 - 정적 값 사용 (문자열 접두사 추가로 타입 안정성 확보)', to: '// Add cache busting - use static values (add string prefix for type safety)' },
  { from: '// 실제 NFT 데이터 사용 강제', to: '// Force use of actual NFT data' },
  { from: '// 해시 기반으로 결정론적으로 생성된 NFT ID 사용', to: '// Use deterministically generated NFT ID based on hash' },
  { from: '// 환경 변수 전달', to: '// Pass environment variables' },
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('All Korean text has been replaced with English equivalents in StakingDashboard.jsx');