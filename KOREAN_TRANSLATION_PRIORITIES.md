# Korean Text Translation Priorities

This document lists the most important Korean text segments in the tesolafixjs project that should be translated to English, focusing on user-visible components, error messages, and loading screens.

## High Priority (User Interface Elements)

1. **StakingComponent.jsx**
   ```jsx
   // Line 1432-1436
   <h3 className="text-sm font-bold text-indigo-700 mb-1">통합 스테이킹 방식이 적용되었습니다</h3>
   <p className="text-xs text-indigo-600">
     이제 기존에 발생하던 모든 오류가 수정된 단일 스테이킹 방식을 제공합니다.
     계정 초기화 오류와 벡터 파싱 오류가 해결되어 더 안정적인 스테이킹이 가능합니다.
   </p>
   ```
   English Translation:
   ```jsx
   <h3 className="text-sm font-bold text-indigo-700 mb-1">Unified Staking Method Applied</h3>
   <p className="text-xs text-indigo-600">
     We now provide a single staking method with all previous errors fixed.
     Account initialization errors and vector parsing errors have been resolved, allowing for more stable staking.
   </p>
   ```

2. **index.js** (Root Page)
   ```jsx
   // Line 36-37
   message.textContent = '복구 중...';
   
   // Line 44
   button.textContent = '새로고침';
   
   // Line 89
   <FallbackLoading message="TESOLA 경험 로딩 중..." />
   ```
   English Translation:
   ```jsx
   message.textContent = 'Recovering...';
   
   button.textContent = 'Refresh';
   
   <FallbackLoading message="Loading TESOLA experience..." />
   ```

## Medium Priority (Error Messages)

1. **utils/staking-helpers/error-handler.js**
   ```js
   // Lines 8-27 (Error codes and messages)
   6000: { code: 'NotStaked', message: 'NFT가 스테이킹되지 않았습니다' },
   6001: { code: 'NotOwner', message: 'NFT의 소유자가 아닙니다' },
   6002: { code: 'NotAdmin', message: '관리자 권한이 없습니다' },
   6003: { code: 'PoolPaused', message: '스테이킹 풀이 일시 중지되었습니다' },
   6004: { code: 'StakingPeriodNotCompleted', message: '스테이킹 기간이 아직 완료되지 않았습니다' },
   6005: { code: 'InvalidNftTier', message: '유효하지 않은 NFT 등급입니다' },
   6006: { code: 'InvalidStakingPeriod', message: '유효하지 않은 스테이킹 기간입니다. 허용되는 값: 30, 60, 90일' },
   6007: { code: 'MaxNftsExceeded', message: '사용자당 최대 NFT 수를 초과했습니다' },
   6008: { code: 'ProposalNotFound', message: '제안을 찾을 수 없습니다' },
   6009: { code: 'VotingNotStarted', message: '투표 기간이 시작되지 않았습니다' },
   6010: { code: 'VotingEnded', message: '투표 기간이 종료되었습니다' },
   6011: { code: 'VotingNotEnded', message: '투표가 아직 종료되지 않았습니다' },
   6012: { code: 'AlreadyVoted', message: '이미 이 제안에 투표했습니다' },
   6013: { code: 'InsufficientVotingPower', message: '투표력이 부족합니다' },
   6014: { code: 'QuorumNotReached', message: '정족수에 도달하지 못했습니다' },
   6015: { code: 'ProposalCancelled', message: '제안이 취소되었습니다' },
   6016: { code: 'ProposalAlreadyExecuted', message: '제안이 이미 실행되었습니다' },
   6017: { code: 'ProposalFailed', message: '제안이 통과되지 못했습니다' },
   6018: { code: 'TimelockNotCompleted', message: '타임락 기간이 완료되지 않았습니다' },
   6019: { code: 'InvalidVotingParams', message: '유효하지 않은 투표 매개변수입니다' },
   ```
   English Translation:
   ```js
   6000: { code: 'NotStaked', message: 'NFT is not staked' },
   6001: { code: 'NotOwner', message: 'Not the owner of the NFT' },
   6002: { code: 'NotAdmin', message: 'No admin permissions' },
   6003: { code: 'PoolPaused', message: 'Staking pool is currently paused' },
   6004: { code: 'StakingPeriodNotCompleted', message: 'Staking period has not yet completed' },
   6005: { code: 'InvalidNftTier', message: 'Invalid NFT tier' },
   6006: { code: 'InvalidStakingPeriod', message: 'Invalid staking period. Allowed values: 30, 60, 90 days' },
   6007: { code: 'MaxNftsExceeded', message: 'Maximum number of NFTs per user exceeded' },
   6008: { code: 'ProposalNotFound', message: 'Proposal not found' },
   6009: { code: 'VotingNotStarted', message: 'Voting period has not started' },
   6010: { code: 'VotingEnded', message: 'Voting period has ended' },
   6011: { code: 'VotingNotEnded', message: 'Voting period has not ended yet' },
   6012: { code: 'AlreadyVoted', message: 'Already voted on this proposal' },
   6013: { code: 'InsufficientVotingPower', message: 'Insufficient voting power' },
   6014: { code: 'QuorumNotReached', message: 'Quorum not reached' },
   6015: { code: 'ProposalCancelled', message: 'Proposal has been cancelled' },
   6016: { code: 'ProposalAlreadyExecuted', message: 'Proposal has already been executed' },
   6017: { code: 'ProposalFailed', message: 'Proposal failed to pass' },
   6018: { code: 'TimelockNotCompleted', message: 'Timelock period has not completed' },
   6019: { code: 'InvalidVotingParams', message: 'Invalid voting parameters' },
   ```

2. **utils/staking-helpers/staking-error-handler.js**
   ```js
   // Lines 13-53 (Staking-specific error codes)
   'TokenAccountNotFoundError': {
     code: 'TokenAccountNotFound',
     message: '토큰 계정을 찾을 수 없습니다. 해당 NFT의 토큰 계정이 존재하지 않습니다.'
   },
   'TokenInvalidAccountOwnerError': {
     code: 'InvalidAccountOwner',
     message: '토큰 계정 소유자가 유효하지 않습니다. 에스크로 계정의 소유자가 잘못 설정되었습니다.'
   },
   'TokenInvalidMintError': {
     code: 'InvalidMint',
     message: '민트가 유효하지 않습니다. 토큰 계정과 민트 주소가 일치하지 않습니다.'
   },
   'TokenInvalidOwnerError': {
     code: 'InvalidOwner',
     message: '소유자가 유효하지 않습니다. 토큰 계정의 소유자가 PDA가 아닙니다.'
   },
   // ...more errors
   'IdlParseError': {
     code: 'IdlParseError',
     message: 'Anchor IDL 파싱 오류가 발생했습니다. IDL의 vec<pubkey>를 변환해야 합니다.'
   },
   'VecPubkeyError': {
     code: 'VecPubkeyError',
     message: 'vec<pubkey> 타입을 처리할 수 없습니다. IDL을 수정해야 합니다.'
   },
   ```
   English Translation:
   ```js
   'TokenAccountNotFoundError': {
     code: 'TokenAccountNotFound',
     message: 'Token account not found. The token account for this NFT does not exist.'
   },
   'TokenInvalidAccountOwnerError': {
     code: 'InvalidAccountOwner',
     message: 'Token account owner is invalid. The escrow account owner is incorrectly set.'
   },
   'TokenInvalidMintError': {
     code: 'InvalidMint',
     message: 'Invalid mint. The token account and mint address do not match.'
   },
   'TokenInvalidOwnerError': {
     code: 'InvalidOwner',
     message: 'Invalid owner. The token account owner is not a PDA.'
   },
   // ...more errors
   'IdlParseError': {
     code: 'IdlParseError',
     message: 'Anchor IDL parsing error occurred. IDL vec<pubkey> must be converted.'
   },
   'VecPubkeyError': {
     code: 'VecPubkeyError',
     message: 'Cannot process vec<pubkey> type. IDL needs to be modified.'
   },
   ```

3. **TransactionWarningModal.jsx**
   ```jsx
   // Lines 5-7
   /**
    * 트랜잭션 경고 모달 컴포넌트
    * 사용자에게 트랜잭션 세부 정보를 표시하고 확인을 요청합니다.
    */
   
   // Lines 21-22
   // 서명 창에 금액이 제대로 표시되지 않는 문제로 인한 추가 경고
   
   // Lines 41-42
   {/* 모달 정렬 트릭 */}
   
   // Lines 49-50
   {/* 모달 내용 */}
   
   // Lines 52-53
   {/* 헤더 및 아이콘 */}
   
   // Lines 67-68
   {/* 경고 메시지 */}
   
   // Lines 75-76
   {/* 트랜잭션 세부 정보 */}
   
   // Lines 99-100
   {/* 선택적 추가 세부 정보 */}
   
   // Lines 107-108
   {/* 버튼 영역 */}
   ```
   English Translation:
   ```jsx
   /**
    * Transaction Warning Modal Component
    * Displays transaction details to the user and requests confirmation
    */
   
   // Additional warning due to issue with amount not displaying properly in the signing window
   
   {/* Modal alignment trick */}
   
   {/* Modal content */}
   
   {/* Header and icon */}
   
   {/* Warning message */}
   
   {/* Transaction details */}
   
   {/* Optional additional details */}
   
   {/* Button area */}
   ```

## Low Priority (Developer-Facing / Comments)

1. **utils/staking-helpers/staking-error-handler.js**
   ```js
   // Lines 1-6 (File header comment)
   /**
    * NFT 스테이킹 전용 에러 핸들링 모듈
    * 
    * 이 모듈은 스테이킹 과정에서 발생하는 특정 오류에 대한 자세한 정보를 제공합니다.
    * 오류 코드와 메시지를 사용자 친화적인 방식으로 변환하여 디버깅 및 트러블슈팅을 용이하게 합니다.
    */
   ```
   English Translation:
   ```js
   /**
    * NFT Staking Specific Error Handling Module
    * 
    * This module provides detailed information about specific errors that occur during the staking process.
    * It converts error codes and messages in a user-friendly way to facilitate debugging and troubleshooting.
    */
   ```

2. **components/staking/EnhancedStakingButton.jsx**
   ```jsx
   // Lines 6-9
   /**
    * 향상된 스테이킹 버튼 래퍼 컴포넌트
    * 통합된 스테이킹 방식을 제공하여 사용자 경험을 단순화
    * vec<pubkey> 및 IllegalOwner 오류가 수정된 안정적인 단일 흐름 제공
    */
   
   // Lines 23-25 (Comment)
   // 로딩 상태 관리
   ```
   English Translation:
   ```jsx
   /**
    * Enhanced Staking Button Wrapper Component
    * Simplifies user experience by providing an integrated staking approach
    * Offers a stable single flow with vec<pubkey> and IllegalOwner errors fixed
    */
    
   // Loading state management
   ```

3. **WalletGuide.jsx**
   ```jsx
   // Line 20
   // 사용자의 SOL 잔액 조회
   
   // Line 54
   // 잔액 조회 주기적 업데이트
   
   // Line 65
   // 첫 방문 확인 및 강제 표시 처리
   
   // Line 84
   // 연결 시 상태 업데이트
   
   // Line 99
   // 가이드 닫기 핸들러
   
   // Line 113
   // ESC 키 핸들러
   
   // Line 125
   // 단계 변경 핸들러
   
   // Lines 150-152
   {/* 닫기 버튼 */}
   
   // Lines 161-162
   {/* 진행 상태 표시기 */}
   
   // Lines 178-179
   {/* 단계별 콘텐츠 */}
   ```
   English Translation:
   ```jsx
   // Query user's SOL balance
   
   // Periodic balance update
   
   // Check first visit and handle forced display
   
   // Update status on connection
   
   // Guide close handler
   
   // ESC key handler
   
   // Step change handler
   
   {/* Close button */}
   
   {/* Progress indicator */}
   
   {/* Step-by-step content */}
   ```

## Implementation Recommendations

1. **Order of Translation**:
   - First translate user-facing interface elements (High Priority)
   - Then translate error messages visible to users (Medium Priority)
   - Finally translate developer comments and documentation (Low Priority)

2. **Testing Requirements**:
   - After translation, test all error scenarios to ensure error messages appear correctly
   - Check for layout issues in components where text length may change after translation
   - Verify that loading screens and notifications display correctly

3. **Files Requiring Most Attention**:
   - `/components/StakingComponent.jsx` - Contains visible UI elements
   - `/utils/staking-helpers/error-handler.js` - Contains user-visible error messages
   - `/utils/staking-helpers/staking-error-handler.js` - Contains staking-specific error handling
   - `/components/TransactionWarningModal.jsx` - Important transaction-related UI