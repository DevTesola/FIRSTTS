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
 * @returns {Object} Parsed stake info
 */
function parseUserStakingInfo(data, discriminator) {
  try {
    // Validate account data
    validateAccountData(data, discriminator, 'UserStakingInfo', 49); // 8 + 32 + 1 + 8 minimum
    
    const parser = BufferParser.fromAccountData(data, discriminator);
    
    return {
      owner: parser.parsePublicKey(),
      stakedCount: parser.parseU8(),
      // This is just the start - add other fields according to your account layout
      rewardsEarned: parser.parseU64AsNumber(),
      totalStakedDuration: parser.parseU64AsNumber()
    };
  } catch (error) {
    console.error('Error parsing UserStakingInfo:', error);
    throw error;
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
    // Validate account data
    validateAccountData(data, discriminator, 'StakeInfo', 106); // 8 + 32 + 32 + 8 + 8 + 1 + 8 + 8 + 1 minimum
    
    const parser = BufferParser.fromAccountData(data, discriminator);
    
    return {
      owner: parser.parsePublicKey(),
      mint: parser.parsePublicKey(),
      startTime: parser.parseTimestamp(),
      endTime: parser.parseTimestamp(),
      nftTier: parser.parseU8(),
      totalRewards: parser.parseU64AsNumber(),
      claimedRewards: parser.parseU64AsNumber(),
      autoCompound: parser.parseBool()
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
 * Validates account data based on account type
 * @param {Buffer} data - Account data buffer
 * @param {Buffer} expectedDiscriminator - Expected discriminator for this account type
 * @param {string} accountTypeName - Human-readable account type name for error messages
 * @param {number} [minSize=0] - Minimum valid size for this account type
 * @returns {boolean} - True if valid, throws error if invalid
 */
function validateAccountData(data, expectedDiscriminator, accountTypeName, minSize = 0) {
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
    throw new Error(`Invalid discriminator for ${accountTypeName || 'account'}`);
  }
  
  const actualDiscriminator = data.slice(0, 8);
  
  if (!actualDiscriminator.equals(expectedDiscriminator)) {
    throw new Error(`Invalid ${accountTypeName || 'account'} data: discriminator mismatch`);
  }
  
  return true;
}

// For CommonJS compatibility
export {
  BufferParser,
  parseUserStakingInfo,
  parseStakeInfo,
  parseVoteInfo,
  parseMemeInfo,
  parseMemeVoteInfo,
  validateAccountData
};