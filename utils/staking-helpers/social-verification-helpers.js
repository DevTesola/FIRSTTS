/**
 * NFT 스테이킹 프로그램의 소셜 활동 인증 관련 유틸리티 스크립트
 * 프론트엔드에서 소셜 활동 인증 기능 구현에 사용할 헬퍼 함수들을 제공합니다.
 */

import { PublicKey } from '@solana/web3.js';
import { getErrorMessage } from './error-handler.js';

// Seeds for PDAs
const USER_STAKING_SEED = Buffer.from([117, 115, 101, 114, 95, 115, 116, 97, 107, 105, 110, 103]); // "user_staking"
const SOCIAL_SEED = Buffer.from([115, 111, 99, 105, 97, 108]); // "social"

// 소셜 활동 타입 정의
const SOCIAL_ACTIVITY_TYPES = {
  TWITTER: 0,
  TELEGRAM: 1,
  DISCORD: 2
};

/**
 * 소셜 활동 인증 상태를 조회합니다.
 * 
 * @param {PublicKey} programId - 스테이킹 프로그램 ID
 * @param {PublicKey} walletPublicKey - 사용자 지갑 주소
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<{initialized: boolean, twitter: {username: string, lastClaim: Date}, telegram: {username: string, lastClaim: Date}, discord: {username: string, lastClaim: Date}, totalRewardsEarned: number}>}
 */
async function getSocialActivityStatus(programId, walletPublicKey, connection) {
  try {
    // 사용자 소셜 활동 계정 주소 계산
    const [userSocialActivityPDA] = PublicKey.findProgramAddressSync(
      [SOCIAL_SEED, walletPublicKey.toBuffer()],
      programId
    );
    
    // 소셜 활동 계정 정보 조회
    const accountInfo = await connection.getAccountInfo(userSocialActivityPDA);
    if (!accountInfo) {
      return {
        initialized: false,
        twitter: { username: "", lastClaim: null },
        telegram: { username: "", lastClaim: null },
        discord: { username: "", lastClaim: null },
        totalRewardsEarned: 0
      };
    }
    
    // 계정 데이터 파싱 (실제 데이터 구조에 맞게 조정 필요)
    const data = accountInfo.data;
    
    // 이 부분은 실제 계정 데이터 구조에 맞게 수정 필요
    // 아래는 예시 구현
    const owner = new PublicKey(data.slice(8, 40)); // 32바이트 소유자 주소, 첫 8바이트는 discriminator
    
    // 타임스탬프 데이터 (i64) 위치와 크기는 실제 데이터 구조에 맞게 조정 필요
    const lastTwitterClaimTimestamp = 0; // 파싱 필요
    const lastTelegramClaimTimestamp = 0; // 파싱 필요
    const lastDiscordClaimTimestamp = 0; // 파싱 필요
    const totalRewardsEarned = 0; // 파싱 필요
    
    // 각 플랫폼의 사용자명 파싱 (문자열 필드, 가변 길이)
    // 실제 구현에서는 데이터 레이아웃에 맞게 파싱 필요
    const twitterUsername = ""; // 파싱 필요
    const telegramUsername = ""; // 파싱 필요
    const discordUsername = ""; // 파싱 필요
    
    return {
      initialized: true,
      twitter: {
        username: twitterUsername,
        lastClaim: lastTwitterClaimTimestamp ? new Date(lastTwitterClaimTimestamp * 1000) : null
      },
      telegram: {
        username: telegramUsername,
        lastClaim: lastTelegramClaimTimestamp ? new Date(lastTelegramClaimTimestamp * 1000) : null
      },
      discord: {
        username: discordUsername,
        lastClaim: lastDiscordClaimTimestamp ? new Date(lastDiscordClaimTimestamp * 1000) : null
      },
      totalRewardsEarned
    };
  } catch (error) {
    console.error("소셜 활동 상태 조회 오류:", error);
    throw error;
  }
}

/**
 * 사용자가 특정 소셜 활동 보상을 청구할 수 있는지 확인합니다.
 * 
 * @param {PublicKey} programId - 스테이킹 프로그램 ID
 * @param {PublicKey} walletPublicKey - 사용자 지갑 주소
 * @param {number} activityType - 활동 타입 (0=Twitter, 1=Telegram, 2=Discord)
 * @param {Connection} connection - Solana 연결 객체
 * @returns {Promise<{canClaim: boolean, reason: string|null, cooldownRemaining: number}>}
 */
async function canClaimSocialReward(programId, walletPublicKey, activityType, connection) {
  try {
    // 사용자 소셜 활동 상태 조회
    const socialStatus = await getSocialActivityStatus(programId, walletPublicKey, connection);
    if (!socialStatus.initialized) {
      return { canClaim: false, reason: "소셜 활동 정보가 초기화되지 않았습니다", cooldownRemaining: 0 };
    }
    
    // 소셜 검증기 계정에서 쿨다운 설정과 일일 최대 보상 정보 가져오기
    // 이 예시에서는 임의의 값을 사용
    const cooldownPeriod = 24 * 60 * 60; // 24시간 (초 단위)
    const maxRewardsPerDay = 3; // 하루 최대 3회 보상
    
    // 활동 타입에 따른 마지막 청구 시간 확인
    let lastClaim;
    let username;
    switch (activityType) {
      case SOCIAL_ACTIVITY_TYPES.TWITTER:
        lastClaim = socialStatus.twitter.lastClaim;
        username = socialStatus.twitter.username;
        break;
      case SOCIAL_ACTIVITY_TYPES.TELEGRAM:
        lastClaim = socialStatus.telegram.lastClaim;
        username = socialStatus.telegram.username;
        break;
      case SOCIAL_ACTIVITY_TYPES.DISCORD:
        lastClaim = socialStatus.discord.lastClaim;
        username = socialStatus.discord.username;
        break;
      default:
        return { canClaim: false, reason: "유효하지 않은 활동 타입입니다", cooldownRemaining: 0 };
    }
    
    // 사용자명이 설정되지 않은 경우
    if (!username) {
      return { canClaim: false, reason: "해당 플랫폼의 사용자명이 설정되지 않았습니다", cooldownRemaining: 0 };
    }
    
    // 쿨다운 확인
    const now = Math.floor(Date.now() / 1000);
    if (lastClaim) {
      const timeSinceLastClaim = now - lastClaim.getTime() / 1000;
      if (timeSinceLastClaim < cooldownPeriod) {
        const remaining = cooldownPeriod - timeSinceLastClaim;
        return { canClaim: false, reason: "쿨다운 기간이 아직 남아있습니다", cooldownRemaining: remaining };
      }
    }
    
    // 일일 최대 보상 횟수 확인 로직
    // 현재 시간의 일일 시작 시간 계산 (UTC 00:00)
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayStartTimestamp = Math.floor(dayStart.getTime() / 1000);
    
    // 오늘 발생한 모든 활동 조회
    let claimsToday = 0;
    
    // Twitter 체크
    if (socialStatus.twitter.lastClaim && 
        socialStatus.twitter.lastClaim.getTime() / 1000 > dayStartTimestamp) {
      claimsToday++;
    }
    
    // Telegram 체크  
    if (socialStatus.telegram.lastClaim && 
        socialStatus.telegram.lastClaim.getTime() / 1000 > dayStartTimestamp) {
      claimsToday++;
    }
    
    // Discord 체크
    if (socialStatus.discord.lastClaim && 
        socialStatus.discord.lastClaim.getTime() / 1000 > dayStartTimestamp) {
      claimsToday++;
    }
    
    // 최대 횟수 초과 확인
    if (claimsToday >= maxRewardsPerDay) {
      return { 
        canClaim: false, 
        reason: `일일 최대 보상 횟수(${maxRewardsPerDay}회)를 초과했습니다`, 
        cooldownRemaining: 0,
        claimsToday,
        maxRewardsPerDay 
      };
    }
    
    return { 
      canClaim: true, 
      reason: null, 
      cooldownRemaining: 0,
      claimsToday,
      remainingClaims: maxRewardsPerDay - claimsToday
    };
  } catch (error) {
    console.error("소셜 보상 청구 가능 여부 확인 오류:", error);
    return { canClaim: false, reason: getErrorMessage(error), cooldownRemaining: 0 };
  }
}

/**
 * 소셜 활동 인증을 위한 서명 메시지를 생성합니다.
 * 
 * @param {string} walletAddress - 사용자 지갑 주소
 * @param {number} activityType - 활동 타입
 * @param {string} activityId - 활동 ID (예: 트윗 ID)
 * @param {string} platformUsername - 플랫폼 사용자명
 * @returns {string} - 서명할 메시지
 */
function createSocialVerificationMessage(walletAddress, activityType, activityId, platformUsername) {
  const activityTypes = ["Twitter", "Telegram", "Discord"];
  const activityTypeStr = activityTypes[activityType] || "Unknown";
  
  return `Verify my ${activityTypeStr} activity:
Wallet: ${walletAddress}
ActivityId: ${activityId}
Username: ${platformUsername}
Timestamp: ${Date.now()}`;
}

/**
 * 소셜 활동 초기화에 필요한 사용자 정보를 등록합니다.
 * 
 * @param {string} twitterUsername - 트위터 사용자명
 * @param {string} telegramUsername - 텔레그램 사용자명
 * @param {string} discordUsername - 디스코드 사용자명
 * @returns {Object} - 소셜 활동 초기화 명령어 데이터
 */
function prepareSocialActivityInitData(twitterUsername, telegramUsername, discordUsername) {
  // 실제 구현에서는 initUserSocialActivity 명령어에 대한 명령어 데이터를 구성해야 함
  return {
    twitterUsername: twitterUsername || "",
    telegramUsername: telegramUsername || "",
    discordUsername: discordUsername || ""
  };
}

export {
  getSocialActivityStatus,
  canClaimSocialReward,
  createSocialVerificationMessage,
  prepareSocialActivityInitData,
  SOCIAL_ACTIVITY_TYPES,
  SOCIAL_SEED
};