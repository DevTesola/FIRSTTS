/**
 * Buffer parsing utilities for Solana account data
 * Helps with parsing binary data from on-chain accounts in a consistent way
 */

import { PublicKey } from '@solana/web3.js';

/**
 * A utility class to parse Solana account data from buffers
 */
class BufferParser {
  /**
   * Creates a new parser for the given buffer
   * @param {Buffer} buffer - The buffer to parse
   * @param {number} offset - Starting offset for parsing
   */
  constructor(buffer, offset = 0) {
    this.buffer = buffer;
    this.offset = offset;
  }

  /**
   * Validates that the buffer has enough bytes remaining
   * @param {number} size - Number of bytes needed
   * @private
   */
  _checkSize(size) {
    if (this.offset + size > this.buffer.length) {
      throw new Error(`Buffer too small: needed ${size} bytes at offset ${this.offset}, buffer length ${this.buffer.length}`);
    }
  }

  /**
   * Checks if a discriminator matches the current buffer position
   * @param {Buffer} discriminator - The 8-byte discriminator to check
   * @returns {boolean} True if discriminator matches
   */
  checkDiscriminator(discriminator) {
    if (!this.buffer || this.buffer.length < 8) return false;
    return this.buffer.slice(0, 8).equals(discriminator);
  }

  /**
   * Skips past the discriminator (8 bytes)
   * @returns {BufferParser} This parser for chaining
   */
  skipDiscriminator() {
    this.offset += 8;
    return this;
  }

  /**
   * Advances the offset by a specified number of bytes
   * @param {number} bytes - Number of bytes to skip
   * @returns {BufferParser} This parser for chaining
   */
  skip(bytes) {
    this.offset += bytes;
    return this;
  }

  /**
   * Parse a u8 value
   * @returns {number} The parsed value
   */
  parseU8() {
    this._checkSize(1);
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Parse a u16 value (little endian)
   * @returns {number} The parsed value
   */
  parseU16() {
    this._checkSize(2);
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  /**
   * Parse a u32 value (little endian)
   * @returns {number} The parsed value
   */
  parseU32() {
    this._checkSize(4);
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  /**
   * Parse a u64 value (little endian)
   * @returns {bigint} The parsed value as BigInt
   */
  parseU64() {
    this._checkSize(8);
    // Read bytes directly as JS doesn't have a direct u64 read method
    const low = this.buffer.readUInt32LE(this.offset);
    const high = this.buffer.readUInt32LE(this.offset + 4);
    this.offset += 8;
    // Combine into a BigInt
    return BigInt(low) + (BigInt(high) << 32n);
  }

  /**
   * Parse a u64 value as Number (use when you know the value fits in a Number)
   * @returns {number} The parsed value
   */
  parseU64AsNumber() {
    const value = this.parseU64();
    // Warning: may lose precision for very large numbers!
    return Number(value);
  }

  /**
   * Parse an i8 value
   * @returns {number} The parsed value
   */
  parseI8() {
    this._checkSize(1);
    const value = this.buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Parse an i16 value (little endian)
   * @returns {number} The parsed value
   */
  parseI16() {
    this._checkSize(2);
    const value = this.buffer.readInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  /**
   * Parse an i32 value (little endian)
   * @returns {number} The parsed value
   */
  parseI32() {
    this._checkSize(4);
    const value = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  /**
   * Parse an i64 value (little endian)
   * @returns {bigint} The parsed value as BigInt
   */
  parseI64() {
    this._checkSize(8);
    const buf = this.buffer.slice(this.offset, this.offset + 8);
    this.offset += 8;
    
    // Convert to two's complement
    let negative = false;
    if ((buf[7] & 0x80) !== 0) {
      negative = true;
      // Perform two's complement
      for (let i = 0; i < 8; i++) {
        buf[i] = ~buf[i] & 0xff;
      }
      // Add one
      let carry = 1;
      for (let i = 0; i < 8; i++) {
        const val = buf[i] + carry;
        buf[i] = val & 0xff;
        carry = val >> 8;
      }
    }
    
    // Read as a regular u64
    const low = buf.readUInt32LE(0);
    const high = buf.readUInt32LE(4);
    const value = BigInt(low) + (BigInt(high) << 32n);
    
    return negative ? -value : value;
  }

  /**
   * Parse an i64 value as Number (use when you know the value fits in a Number)
   * @returns {number} The parsed value
   */
  parseI64AsNumber() {
    const value = this.parseI64();
    // Warning: may lose precision for very large numbers!
    return Number(value);
  }

  /**
   * Parse a boolean value
   * @returns {boolean} The parsed value
   */
  parseBool() {
    const value = this.parseU8();
    return value !== 0;
  }

  /**
   * Parse a Solana PublicKey (32 bytes)
   * @returns {PublicKey} The parsed public key
   */
  parsePublicKey() {
    this._checkSize(32);
    const key = new PublicKey(this.buffer.slice(this.offset, this.offset + 32));
    this.offset += 32;
    return key;
  }

  /**
   * Parse an array of bytes
   * @param {number} length - The length of the array
   * @returns {Buffer} The parsed bytes
   */
  parseBytes(length) {
    this._checkSize(length);
    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  /**
   * Parse a string with a prefixed length or fixed length
   * @param {number} [fixedLength] - Optional fixed length for the string
   * @returns {string} The parsed string
   */
  parseString(fixedLength) {
    if (fixedLength !== undefined) {
      // Fixed length string
      this._checkSize(fixedLength);
      let end = this.offset;
      // Find the null terminator if any
      for (let i = 0; i < fixedLength; i++) {
        if (this.buffer[this.offset + i] === 0) {
          end = this.offset + i;
          break;
        }
      }
      const str = this.buffer.slice(this.offset, end).toString('utf8');
      this.offset += fixedLength;
      return str;
    } else {
      // Length-prefixed string
      const length = this.parseU32();
      this._checkSize(length);
      const str = this.buffer.slice(this.offset, this.offset + length).toString('utf8');
      this.offset += length;
      return str;
    }
  }

  /**
   * Parse a timestamp as milliseconds since epoch
   * This assumes the timestamp is stored as seconds in a u64
   * @returns {Date} The parsed Date object
   */
  parseTimestamp() {
    const timestampSeconds = this.parseU64AsNumber();
    return new Date(timestampSeconds * 1000);
  }

  /**
   * Creates a new parser starting after the discriminator
   * @param {Buffer} buffer - The buffer containing account data
   * @param {Buffer} expectedDiscriminator - The expected discriminator to validate
   * @param {string} [accountTypeName='Account'] - Optional account type name for better error messages
   * @returns {BufferParser} A new parser positioned after the discriminator
   * @throws If discriminator doesn't match
   */
  static fromAccountData(buffer, expectedDiscriminator, accountTypeName = 'Account') {
    // Use validation helper to verify buffer integrity
    validateAccountData(buffer, expectedDiscriminator, accountTypeName);
    
    // Return a new parser positioned after the discriminator
    return new BufferParser(buffer, 8);
  }
}

/**
 * Helper functions for the most common account data layouts
 */

/**
 * Parse UserStakingInfo account data
 * @param {Buffer} data - The account data buffer
 * @param {Buffer} discriminator - The expected discriminator
 * @returns {Object} Parsed user staking info
 */
function parseUserStakingInfo(data, discriminator) {
  try {
    // 상세 디버깅 로깅 추가
    console.log('UserStakingInfo 파싱 시작', {
      dataLength: data?.length,
      discriminatorProvided: !!discriminator
    });

    // Validate account data - match IDL structure exactly
    // Size: 8 (discriminator) + 32 (owner) + 1 (staked_count) + 4 (vec length) + variable array + 8 (collection_bonus)
    const minSize = 53; // 최소 필요 크기

    // 데이터 검증 강화 - 빈 데이터, null, 또는 작은 버퍼 처리
    if (!data) {
      throw new Error('UserStakingInfo 데이터가 null 또는 undefined입니다');
    }

    if (!Buffer.isBuffer(data)) {
      throw new Error('UserStakingInfo 데이터가 Buffer 타입이 아닙니다');
    }

    if (data.length < minSize) {
      console.warn(`UserStakingInfo 데이터가 최소 크기(${minSize})보다 작습니다: ${data.length}바이트`);
      // 더 자세한 디버그 정보
      if (data.length >= 8) {
        const actualDisc = data.slice(0, 8);
        console.warn('실제 디스크리미네이터:', [...actualDisc], `(${Buffer.from(actualDisc).toString('hex')})`);
      }
    }

    // 실제 디스크리미네이터와 예상 디스크리미네이터 로깅
    if (data.length >= 8) {
      const actualDisc = data.slice(0, 8);
      console.log('UserStakingInfo 디스크리미네이터 비교:', {
        expected: discriminator ? [...discriminator] : 'none provided',
        actual: [...actualDisc],
        expectedHex: discriminator ? Buffer.from(discriminator).toString('hex') : 'none',
        actualHex: Buffer.from(actualDisc).toString('hex'),
        matches: discriminator ? actualDisc.equals(discriminator) : false
      });
    }

    // 유효성 검사 (실패 시 자세한 오류 메시지 제공)
    validateAccountData(data, discriminator, 'UserStakingInfo', minSize);

    // 계정 데이터 파싱 시작
    const parser = BufferParser.fromAccountData(data, discriminator);

    // Parse fields according to IDL structure
    const owner = parser.parsePublicKey();
    const stakedCount = parser.parseU8();

    // 디버깅 정보
    console.log(`UserStakingInfo 파싱 중: 소유자=${owner.toString()}, 스테이킹 수=${stakedCount}`);

    // Parse staked mints vector
    const numMints = parser.parseU32(); // Rust Vec prefix: length as u32
    console.log(`UserStakingInfo: stakedMints 벡터 길이=${numMints}`);

    const stakedMints = [];
    for (let i = 0; i < numMints; i++) {
      try {
        const mint = parser.parsePublicKey();
        stakedMints.push(mint);
      } catch (e) {
        console.error(`스테이킹된 민트 #${i} 파싱 중 오류:`, e);
        break; // 오류 발생 시 반복 중단
      }
    }

    // Parse collection bonus (basis points)
    // This might not exist in older versions, so handle both cases
    let collectionBonus = 0;
    if (parser.offset < data.length) {
      try {
        collectionBonus = parser.parseU64AsNumber();
        console.log(`UserStakingInfo: 컬렉션 보너스=${collectionBonus}`);
      } catch (e) {
        console.warn("컬렉션 보너스 필드를 찾을 수 없거나 파싱 오류 발생, 기본값 0 사용:", e.message);
      }
    } else {
      console.log("UserStakingInfo: 컬렉션 보너스 필드가 없습니다. 기본값 0 사용.");
    }

    // 파싱 성공 로그
    console.log('UserStakingInfo 파싱 완료');

    return {
      owner,
      stakedCount,
      stakedMints,
      collectionBonus
    };
  } catch (error) {
    // 상세 오류 로깅
    console.error('UserStakingInfo 파싱 오류:', error);

    // 개발자를 위한 추가 정보
    console.error('UserStakingInfo 파싱 실패 세부 정보:', {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      dataProvided: !!data,
      dataLength: data?.length,
      discriminatorProvided: !!discriminator
    });

    // 더 많은 정보로 오류 객체 향상
    const enhancedError = new Error(`Failed to parse user staking info: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.accountType = 'UserStakingInfo';
    enhancedError.dataLength = data?.length;
    throw enhancedError;
  }
}

/**
 * Parse StakeInfo account data
 * @param {Buffer} data - The account data buffer
 * @param {Buffer} discriminator - The expected discriminator
 * @returns {Object} Parsed stake info
 */
function parseStakeInfo(data, discriminator) {
  try {
    // Validate account data - Match IDL structure exactly
    // Size: 8 (discriminator) + 32 (owner) + 32 (mint) + 8 (staked_at) + 8 (release_date)
    // + 1 (is_staked) + 1 (tier) + 8 (last_claim_time) + 8 (staking_period)
    // + 1 (auto_compound) + 8 (accumulated_compound)
    // + 8 (current_time_multiplier) + 8 (last_multiplier_update) + 1 (milestones_achieved) + 8 (next_milestone_days)
    validateAccountData(data, discriminator, 'StakeInfo', 130);

    const parser = BufferParser.fromAccountData(data, discriminator);

    // Parse fields according to IDL structure - core fields
    const owner = parser.parsePublicKey();
    const mint = parser.parsePublicKey();
    const stakedAt = parser.parseI64AsNumber();
    const releaseDate = parser.parseI64AsNumber();
    const isStaked = parser.parseBool();
    const tier = parser.parseU8();
    const lastClaimTime = parser.parseI64AsNumber();
    const stakingPeriod = parser.parseU64AsNumber();
    const autoCompound = parser.parseBool();
    const accumulatedCompound = parser.parseU64AsNumber();

    // Additional fields for dynamic reward booster (may not exist in older versions)
    let currentTimeMultiplier = 0;
    let lastMultiplierUpdate = 0;
    let milestonesAchieved = 0;
    let nextMilestoneDays = 30;

    if (parser.offset < data.length) {
      try {
        currentTimeMultiplier = parser.parseU64AsNumber();
        lastMultiplierUpdate = parser.parseI64AsNumber();
        milestonesAchieved = parser.parseU8();
        nextMilestoneDays = parser.parseU64AsNumber();
      } catch (e) {
        console.log("Dynamic reward booster fields not found or error parsing them, using defaults");
      }
    }

    return {
      owner,
      mint,
      stakedAt: new Date(stakedAt * 1000), // Convert to JS Date
      releaseDate: new Date(releaseDate * 1000), // Convert to JS Date
      isStaked,
      tier,
      lastClaimTime: new Date(lastClaimTime * 1000), // Convert to JS Date
      stakingPeriod,
      autoCompound,
      accumulatedCompound,
      // Dynamic reward booster fields
      currentTimeMultiplier,
      lastMultiplierUpdate: lastMultiplierUpdate ? new Date(lastMultiplierUpdate * 1000) : null,
      milestonesAchieved,
      nextMilestoneDays
    };
  } catch (error) {
    console.error('Error parsing StakeInfo:', error);
    throw error;
  }
}

/**
 * Parse Vote account data
 * @param {Buffer} data - The account data buffer
 * @param {Buffer} discriminator - The expected discriminator
 * @returns {Object} Parsed vote info
 */
function parseVoteInfo(data, discriminator) {
  try {
    // Validate account data
    validateAccountData(data, discriminator, 'VoteInfo', 81); // 8 + 32 + 32 + 1 + 8 minimum
    
    const parser = BufferParser.fromAccountData(data, discriminator);
    
    return {
      proposal: parser.parsePublicKey(),
      voter: parser.parsePublicKey(),
      side: parser.parseU8(), // 0 = against, 1 = for
      weight: parser.parseU64AsNumber(),
      timestamp: parser.parseTimestamp()
    };
  } catch (error) {
    console.error('Error parsing VoteInfo:', error);
    throw error;
  }
}

/**
 * Parse Meme account data
 * @param {Buffer} data - The account data buffer
 * @param {Buffer} discriminator - The expected discriminator
 * @returns {Object} Parsed meme info
 */
function parseMemeInfo(data, discriminator) {
  try {
    // Validate account data
    validateAccountData(data, discriminator, 'MemeInfo', 200); // Minimum size estimate
    
    const parser = BufferParser.fromAccountData(data, discriminator);
    
    return {
      creator: parser.parsePublicKey(),
      title: parser.parseString(),
      description: parser.parseString(),
      ipfsHash: parser.parseString(46), // IPFS hash is typically 46 chars
      totalVotes: parser.parseU64AsNumber(),
      createdAt: parser.parseTimestamp()
    };
  } catch (error) {
    console.error('Error parsing MemeInfo:', error);
    throw error;
  }
}

/**
 * Parse Meme Vote account data
 * @param {Buffer} data - The account data buffer
 * @param {Buffer} discriminator - The expected discriminator
 * @returns {Object} Parsed meme vote info
 */
function parseMemeVoteInfo(data, discriminator) {
  try {
    // Validate account data
    validateAccountData(data, discriminator, 'MemeVoteInfo', 80); // 8 + 32 + 32 + 8 minimum

    const parser = BufferParser.fromAccountData(data, discriminator);

    return {
      meme: parser.parsePublicKey(),
      voter: parser.parsePublicKey(),
      votingPower: parser.parseU64AsNumber(),
      timestamp: parser.parseTimestamp()
    };
  } catch (error) {
    console.error('Error parsing MemeVoteInfo:', error);
    throw error;
  }
}

/**
 * Parse PoolState account data
 * @param {Buffer} data - The account data buffer
 * @param {Buffer} discriminator - The expected discriminator
 * @returns {Object} Parsed pool state
 */
function parsePoolState(data, discriminator) {
  try {
    // Validate account data - Match IDL structure exactly
    // Size: 8 (discriminator) + 32 (admin) + 8 (reward_rate) + 1 (emergency_fee_percent)
    // + 1 (paused) + 8 (total_staked) + 8 (common_multiplier) + 8 (rare_multiplier)
    // + 8 (epic_multiplier) + 8 (legendary_multiplier) + 8 (long_staking_bonus) + 1 (max_nfts_per_user)
    // + 8 (time_multiplier_increment) + 8 (time_multiplier_period_days) + 8 (max_time_multiplier)
    // + 32 (reward_mint) + 32 (reward_vault) + 8 (rewards_distributed)
    validateAccountData(data, discriminator, 'PoolState', 98);

    const parser = BufferParser.fromAccountData(data, discriminator);

    // Parse base fields according to IDL structure
    const admin = parser.parsePublicKey();
    const rewardRate = parser.parseU64AsNumber();
    const emergencyFeePercent = parser.parseU8();
    const paused = parser.parseBool();
    const totalStaked = parser.parseU64AsNumber();
    const commonMultiplier = parser.parseU64AsNumber();
    const rareMultiplier = parser.parseU64AsNumber();
    const epicMultiplier = parser.parseU64AsNumber();
    const legendaryMultiplier = parser.parseU64AsNumber();
    const longStakingBonus = parser.parseU64AsNumber();
    const maxNftsPerUser = parser.parseU8();

    // Parse dynamic reward booster fields if they exist
    let timeMultiplierIncrement = 500; // Default: 5% increase per period
    let timeMultiplierPeriodDays = 30; // Default: 30-day period
    let maxTimeMultiplier = 5000;      // Default: Maximum 50% boost
    let rewardMint = null;
    let rewardVault = null;
    let rewardsDistributed = 0;

    // Only try to parse additional fields if they exist
    if (parser.offset < data.length) {
      try {
        timeMultiplierIncrement = parser.parseU64AsNumber();
        timeMultiplierPeriodDays = parser.parseU64AsNumber();
        maxTimeMultiplier = parser.parseU64AsNumber();

        // Reward token fields
        rewardMint = parser.parsePublicKey();
        rewardVault = parser.parsePublicKey();
        rewardsDistributed = parser.parseU64AsNumber();
      } catch (e) {
        console.log("Some extended pool fields not found or error parsing them, using defaults", e);
      }
    }

    return {
      admin,
      rewardRate,
      emergencyFeePercent,
      paused,
      totalStaked,
      commonMultiplier,
      rareMultiplier,
      epicMultiplier,
      legendaryMultiplier,
      longStakingBonus,
      maxNftsPerUser,
      // Dynamic reward booster fields
      timeMultiplierIncrement,
      timeMultiplierPeriodDays,
      maxTimeMultiplier,
      // Reward token fields
      rewardMint,
      rewardVault,
      rewardsDistributed
    };
  } catch (error) {
    console.error('Error parsing PoolState:', error);
    throw error;
  }
}

/**
 * Validates account data based on account type
 * @param {Buffer} data - Account data buffer
 * @param {Buffer} expectedDiscriminator - Expected discriminator for this account type
 * @param {string} accountTypeName - Human-readable account type name for error messages
 * @param {number} [minSize=0] - Minimum valid size for this account type
 * @returns {boolean} - True if valid, throws error if invalid
 */
function validateAccountData(data, expectedDiscriminator, accountTypeName, minSize = 0) {
  // 향상된 오류 처리 및 디버그 정보 추가
  try {
    if (!data) {
      throw new Error(`${accountTypeName || 'Account'} data is null or undefined`);
    }

    if (!Buffer.isBuffer(data)) {
      throw new Error(`${accountTypeName || 'Account'} data is not a Buffer`);
    }

    if (data.length < 8) {
      throw new Error(`${accountTypeName || 'Account'} data too small (${data.length} bytes) to contain a discriminator`);
    }

    if (data.length < minSize) {
      throw new Error(`${accountTypeName || 'Account'} data too small (${data.length} bytes), expected at least ${minSize} bytes`);
    }

    if (!expectedDiscriminator || expectedDiscriminator.length !== 8) {
      throw new Error(`Invalid discriminator for ${accountTypeName || 'account'}, length: ${expectedDiscriminator?.length || 0}`);
    }

    const actualDiscriminator = data.slice(0, 8);

    // 디스크리미네이터 로깅 (디버깅용)
    const expDiscHex = Buffer.from(expectedDiscriminator).toString('hex');
    const actDiscHex = Buffer.from(actualDiscriminator).toString('hex');
    console.log(`[계정검증] ${accountTypeName} 디스크리미네이터 비교:`, {
      expected: expectedDiscriminator,
      actual: [...actualDiscriminator],
      expectedHex: expDiscHex,
      actualHex: actDiscHex
    });

    if (!actualDiscriminator.equals(expectedDiscriminator)) {
      // 더 상세한 오류 메시지
      throw new Error(
        `Invalid ${accountTypeName || 'account'} data: discriminator mismatch\n` +
        `Expected: ${Buffer.from(expectedDiscriminator).toString('hex')}\n` +
        `Actual: ${Buffer.from(actualDiscriminator).toString('hex')}`
      );
    }

    return true;
  } catch (error) {
    // 더 상세한 오류 메시지 제공
    console.error(`[계정검증오류] ${accountTypeName} 계정 데이터 검증 실패:`, error.message);

    // 실패 전에 디스크리미네이터 로깅 시도 (최대한 정보 제공)
    if (data && data.length >= 8) {
      const actualDisc = data.slice(0, 8);
      console.error(`[계정검증오류] ${accountTypeName} 계정 실제 디스크리미네이터:`,
        [...actualDisc],
        `(hex: ${Buffer.from(actualDisc).toString('hex')})`
      );
    }

    // 원본 오류를 다시 발생시킴
    throw error;
  }
}

// For CommonJS compatibility
export {
  BufferParser,
  parseUserStakingInfo,
  parseStakeInfo,
  parsePoolState,
  parseVoteInfo,
  parseMemeInfo,
  parseMemeVoteInfo,
  validateAccountData
};