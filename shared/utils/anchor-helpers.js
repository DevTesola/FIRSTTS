/**
 * Anchor 프로그램 헬퍼 유틸리티
 * Anchor 프로그램과 상호 작용할 때 필요한 유틸리티 함수들
 */

const crypto = require('crypto');

/**
 * Anchor 방식으로 명령어 디스크리미네이터를 계산
 * 
 * @param {string} name - 명령어 이름
 * @returns {Buffer} 8바이트 디스크리미네이터 버퍼
 */
function getInstructionDiscriminator(name) {
  // Anchor는 "global:<명령어 이름>"의 SHA256 해시 첫 8바이트를 디스크리미네이터로 사용
  return Buffer.from(crypto.createHash('sha256').update(`global:${name}`).digest()).slice(0, 8);
}

/**
 * Anchor 방식으로 계정 디스크리미네이터를 계산
 * 
 * @param {string} name - 계정 이름
 * @returns {Buffer} 8바이트 디스크리미네이터 버퍼
 */
function getAccountDiscriminator(name) {
  // Anchor는 "account:<계정 이름>"의 SHA256 해시 첫 8바이트를 디스크리미네이터로 사용
  return Buffer.from(crypto.createHash('sha256').update(`account:${name}`).digest()).slice(0, 8);
}

/**
 * 디스크리미네이터를 16진수 문자열로 변환
 * 
 * @param {Buffer} discriminator - 디스크리미네이터 버퍼
 * @returns {string} 16진수 문자열
 */
function discriminatorToHexString(discriminator) {
  return discriminator.toString('hex');
}

/**
 * 디스크리미네이터를 배열로 변환 (숫자 배열)
 * 
 * @param {Buffer} discriminator - 디스크리미네이터 버퍼
 * @returns {Array<number>} 숫자 배열
 */
function discriminatorToArray(discriminator) {
  return Array.from(discriminator);
}

/**
 * 명령어 이름으로 디스크리미네이터를 여러 형식으로 얻기
 * 
 * @param {string} instructionName - 명령어 이름
 * @returns {Object} 여러 형식의 디스크리미네이터
 */
function getInstructionDiscriminatorFormats(instructionName) {
  const buffer = getInstructionDiscriminator(instructionName);
  
  return {
    buffer,
    array: discriminatorToArray(buffer),
    hex: discriminatorToHexString(buffer),
    base64: buffer.toString('base64')
  };
}

/**
 * BN을 리틀 엔디안 바이트 버퍼로 변환
 * 
 * @param {BN|number} value - 변환할 값 (BN 객체 또는 숫자)
 * @param {number} size - 버퍼 크기 (바이트)
 * @returns {Buffer} 리틀 엔디안 바이트 버퍼
 */
function bnToLeBuffer(value, size = 8) {
  const buffer = Buffer.alloc(size);
  
  // 숫자일 경우 BigInt로 변환
  const bigIntValue = typeof value === 'number' 
    ? BigInt(value) 
    : BigInt(value.toString());
  
  // 값의 크기에 따라 적절한 메서드 사용
  if (size === 8) {
    buffer.writeBigUInt64LE(bigIntValue);
  } else if (size === 4) {
    buffer.writeUInt32LE(Number(bigIntValue));
  } else if (size === 2) {
    buffer.writeUInt16LE(Number(bigIntValue));
  } else if (size === 1) {
    buffer.writeUInt8(Number(bigIntValue));
  } else {
    throw new Error(`Unsupported buffer size: ${size}`);
  }
  
  return buffer;
}

// 알려진 명령어 디스크리미네이터 사전 계산
const INSTRUCTION_DISCRIMINATORS = {
  STAKE_NFT: getInstructionDiscriminator('stake_nft'),
  UNSTAKE_NFT: getInstructionDiscriminator('unstake_nft'),
  EMERGENCY_UNSTAKE_NFT: getInstructionDiscriminator('emergency_unstake_nft'),
  INIT_USER_STAKING_INFO: getInstructionDiscriminator('init_user_staking_info'),
  CLAIM_REWARDS: getInstructionDiscriminator('claim_rewards'),
  UPDATE_POOL_SETTINGS: getInstructionDiscriminator('update_pool_settings'),
  ADD_REWARD_TOKENS: getInstructionDiscriminator('add_reward_tokens')
};

// 알려진 계정 디스크리미네이터 사전 계산
const ACCOUNT_DISCRIMINATORS = {
  POOL_STATE: getAccountDiscriminator('PoolState'),
  STAKE_INFO: getAccountDiscriminator('StakeInfo'),
  USER_STAKING_INFO: getAccountDiscriminator('UserStakingInfo')
};

module.exports = {
  getInstructionDiscriminator,
  getAccountDiscriminator,
  discriminatorToHexString,
  discriminatorToArray,
  getInstructionDiscriminatorFormats,
  bnToLeBuffer,
  INSTRUCTION_DISCRIMINATORS,
  ACCOUNT_DISCRIMINATORS
};