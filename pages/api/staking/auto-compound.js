/**
 * Auto-Compound API Endpoint
 * 
 * Handles auto-compound functionality including:
 * - Setting compound frequency
 * - Processing auto-compound operations
 * - Checking compound streak status
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getNodeEndpoint } from '../../../utils/cluster';
import { PROGRAM_ID, INSTRUCTION_DISCRIMINATORS } from '../../../utils/staking-helpers/constants';

// Error handling middleware
const withErrorHandling = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('Auto-compound API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message || 'Unknown error'
    });
  }
};

/**
 * Auto-compound API handler
 */
async function handler(req, res) {
  // GET: Get auto-compound status for NFT
  // POST: Prepare auto-compound transaction
  // PUT: Set compound frequency
  
  switch (req.method) {
    case 'GET':
      return await getAutoCompoundStatus(req, res);
    case 'POST':
      return await prepareAutoCompoundTransaction(req, res);
    case 'PUT':
      return await setCompoundFrequency(req, res);
    default:
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
  }
}

/**
 * Get auto-compound status for an NFT
 */
async function getAutoCompoundStatus(req, res) {
  const { mintAddress } = req.query;
  
  if (!mintAddress) {
    return res.status(400).json({
      success: false,
      message: 'Mint address is required'
    });
  }
  
  // Connect to the Solana network
  const connection = new Connection(getNodeEndpoint(), 'confirmed');
  
  try {
    // Find the stake account for this NFT
    const stakeAccount = await getStakeAccountInfo(connection, new PublicKey(mintAddress));
    
    if (!stakeAccount) {
      return res.status(404).json({
        success: false,
        message: 'NFT is not staked or stake account not found'
      });
    }
    
    // Return auto-compound information
    return res.status(200).json({
      success: true,
      data: {
        mintAddress,
        autoCompound: stakeAccount.autoCompound,
        compoundFrequency: stakeAccount.compoundFrequency,
        compoundFrequencyLabel: stakeAccount.compoundFrequencyLabel,
        compoundStreak: stakeAccount.compoundStreak,
        compoundStreakMultiplier: stakeAccount.compoundStreakMultiplier,
        lastCompoundTime: stakeAccount.lastCompoundTime,
        accumulatedCompound: stakeAccount.accumulatedCompound,
        // Calculate next compound time
        nextCompoundTime: calculateNextCompoundTime(
          stakeAccount.lastCompoundTime,
          stakeAccount.compoundFrequency
        )
      }
    });
  } catch (error) {
    console.error('Error retrieving auto-compound status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving auto-compound status',
      error: error.message
    });
  }
}

/**
 * Prepare a transaction for auto-compounding a staked NFT
 */
async function prepareAutoCompoundTransaction(req, res) {
  const { wallet, mintAddress } = req.body;
  
  if (!wallet || !mintAddress) {
    return res.status(400).json({
      success: false,
      message: 'Wallet and mint address are required'
    });
  }
  
  // Connect to the Solana network
  const connection = new Connection(getNodeEndpoint(), 'confirmed');
  
  try {
    // Find the stake account for this NFT
    const stakeAccount = await getStakeAccountInfo(connection, new PublicKey(mintAddress));
    
    if (!stakeAccount) {
      return res.status(404).json({
        success: false,
        message: 'NFT is not staked or stake account not found'
      });
    }
    
    // Check if auto-compound is enabled
    if (!stakeAccount.autoCompound) {
      return res.status(400).json({
        success: false,
        message: 'Auto-compound is not enabled for this NFT'
      });
    }
    
    // Check if enough time has passed since last compound
    const now = Math.floor(Date.now() / 1000);
    const nextCompoundTime = calculateNextCompoundTime(
      stakeAccount.lastCompoundTime,
      stakeAccount.compoundFrequency
    );
    
    if (now < nextCompoundTime) {
      return res.status(400).json({
        success: false,
        message: 'Too early to compound, please wait until the next compound time',
        data: {
          currentTime: now,
          nextCompoundTime,
          timeRemaining: nextCompoundTime - now,
          formattedTimeRemaining: formatTimeRemaining(nextCompoundTime - now)
        }
      });
    }
    
    // Create and serialize transaction for auto-compound
    const transaction = await createAutoCompoundTransaction(
      connection,
      new PublicKey(wallet),
      new PublicKey(mintAddress)
    );
    
    // Generate a unique claim ID
    const compoundId = generateUniqueId();
    
    // Return the serialized transaction
    return res.status(200).json({
      success: true,
      message: 'Auto-compound transaction prepared successfully',
      transactionBase64: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      compoundDetails: {
        compoundId,
        mintAddress,
        wallet,
        lastCompoundTime: stakeAccount.lastCompoundTime,
        compoundStreak: stakeAccount.compoundStreak,
        prepared_at: now
      }
    });
  } catch (error) {
    console.error('Error preparing auto-compound transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Error preparing auto-compound transaction',
      error: error.message
    });
  }
}

/**
 * Set the compound frequency for an NFT
 */
async function setCompoundFrequency(req, res) {
  const { wallet, mintAddress, frequency } = req.body;
  
  if (!wallet || !mintAddress || frequency === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Wallet, mint address, and frequency are required'
    });
  }
  
  // Validate frequency
  if (![0, 1, 2, 255].includes(Number(frequency))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid frequency value. Must be 0 (daily), 1 (weekly), 2 (monthly), or 255 (manual)'
    });
  }
  
  // Connect to the Solana network
  const connection = new Connection(getNodeEndpoint(), 'confirmed');
  
  try {
    // Find the stake account for this NFT
    const stakeAccount = await getStakeAccountInfo(connection, new PublicKey(mintAddress));
    
    if (!stakeAccount) {
      return res.status(404).json({
        success: false,
        message: 'NFT is not staked or stake account not found'
      });
    }
    
    // Create and serialize transaction for setting compound frequency
    const transaction = await createSetFrequencyTransaction(
      connection,
      new PublicKey(wallet),
      new PublicKey(mintAddress),
      Number(frequency)
    );
    
    // Generate a unique compound ID
    const compoundId = generateUniqueId();
    
    // Return the serialized transaction
    return res.status(200).json({
      success: true,
      message: 'Set frequency transaction prepared successfully',
      transactionBase64: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      compoundDetails: {
        compoundId,
        mintAddress,
        wallet,
        oldFrequency: stakeAccount.compoundFrequency,
        newFrequency: Number(frequency),
        prepared_at: Math.floor(Date.now() / 1000)
      }
    });
  } catch (error) {
    console.error('Error preparing set frequency transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Error preparing set frequency transaction',
      error: error.message
    });
  }
}

/**
 * Get stake account info for a specific NFT
 */
async function getStakeAccountInfo(connection, mintPublicKey) {
  try {
    // Find the PDA for the stake info account
    const [stakePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake'), mintPublicKey.toBuffer()],
      new PublicKey(PROGRAM_ID)
    );
    
    // Get the account info
    const accountInfo = await connection.getAccountInfo(stakePDA);
    
    if (!accountInfo || !accountInfo.data) {
      return null; // Not staked
    }
    
    // Parse stake account data
    return parseStakeAccountData(accountInfo.data);
  } catch (error) {
    console.error('Error fetching stake account info:', error);
    return null;
  }
}

/**
 * Create a transaction for auto-compounding
 */
async function createAutoCompoundTransaction(connection, walletPublicKey, mintPublicKey) {
  // Find the PDA for the stake info account
  const [stakePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake'), mintPublicKey.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  
  // Find the PDA for the pool state account
  const [poolStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool')],
    new PublicKey(PROGRAM_ID)
  );
  
  // Create a new transaction
  const transaction = new Transaction();
  
  // Create process auto compound instruction
  const processAutoCompoundInstruction = {
    programId: new PublicKey(PROGRAM_ID),
    keys: [
      { pubkey: walletPublicKey, isSigner: true, isWritable: true },
      { pubkey: mintPublicKey, isSigner: false, isWritable: false },
      { pubkey: stakePDA, isSigner: false, isWritable: true },
      { pubkey: poolStatePDA, isSigner: false, isWritable: false }
    ],
    data: INSTRUCTION_DISCRIMINATORS.PROCESS_AUTO_COMPOUND
  };
  
  // Add the instruction to the transaction
  transaction.add(processAutoCompoundInstruction);
  
  // Get the most recent blockhash
  const blockhash = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash.blockhash;
  transaction.feePayer = walletPublicKey;
  
  return transaction;
}

/**
 * Create a transaction for setting compound frequency
 */
async function createSetFrequencyTransaction(connection, walletPublicKey, mintPublicKey, frequency) {
  // Find the PDA for the stake info account
  const [stakePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake'), mintPublicKey.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  
  // Create a new transaction
  const transaction = new Transaction();
  
  // Create instruction data
  const instructionData = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.SET_COMPOUND_FREQUENCY,
    Buffer.from([frequency]) // Encode the frequency as a single byte
  ]);
  
  // Create the set compound frequency instruction
  const setFrequencyInstruction = {
    programId: new PublicKey(PROGRAM_ID),
    keys: [
      { pubkey: walletPublicKey, isSigner: true, isWritable: true },
      { pubkey: mintPublicKey, isSigner: false, isWritable: false },
      { pubkey: stakePDA, isSigner: false, isWritable: true }
    ],
    data: instructionData
  };
  
  // Add the instruction to the transaction
  transaction.add(setFrequencyInstruction);
  
  // Get the most recent blockhash
  const blockhash = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash.blockhash;
  transaction.feePayer = walletPublicKey;
  
  return transaction;
}

/**
 * Parse stake account data from buffer
 */
function parseStakeAccountData(data) {
  try {
    // Skip the 8-byte discriminator
    let offset = 8;
    
    // Basic data parsing - this should be expanded based on actual data structure
    const owner = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const mintAddress = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Extract timestamps (i64 values)
    const stakedAt = data.readBigInt64LE(offset);
    offset += 8;
    
    const releaseDate = data.readBigInt64LE(offset);
    offset += 8;
    
    // Extract boolean isStaked
    const isStaked = data[offset] === 1;
    offset += 1;
    
    // Extract u8 tier
    const tier = data[offset];
    offset += 1;
    
    // Extract lastClaimTime (i64)
    const lastClaimTime = data.readBigInt64LE(offset);
    offset += 8;
    
    // Extract staking period (u64)
    const stakingPeriod = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract auto compound flag
    const autoCompound = data[offset] === 1;
    offset += 1;
    
    // Extract accumulated compound (u64)
    const accumulatedCompound = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract time multiplier fields
    const currentTimeMultiplier = data.readBigUInt64LE(offset);
    offset += 8;
    
    const lastMultiplierUpdate = data.readBigInt64LE(offset);
    offset += 8;
    
    // Extract milestone bitmap (u8)
    const milestonesAchieved = data[offset];
    offset += 1;
    
    // Extract next milestone days (u64)
    const nextMilestoneDays = data.readBigUInt64LE(offset);
    offset += 8;
    
    // Extract compound frequency (u8) 
    const compoundFrequency = data[offset];
    offset += 1;
    
    // Extract compound streak (u16)
    const compoundStreak = data.readUInt16LE(offset);
    offset += 2;
    
    // Extract compound streak multiplier (u64)
    const compoundStreakMultiplier = data.readBigUInt64LE(offset);
    
    // Convert compoundFrequency to readable format
    let compoundFrequencyLabel;
    switch (compoundFrequency) {
      case 0:
        compoundFrequencyLabel = 'Daily';
        break;
      case 1:
        compoundFrequencyLabel = 'Weekly';
        break;
      case 2:
        compoundFrequencyLabel = 'Monthly';
        break;
      default:
        compoundFrequencyLabel = 'Manual';
        break;
    }
    
    return {
      owner: owner.toString(),
      mintAddress: mintAddress.toString(),
      stakedAt: Number(stakedAt),
      releaseDate: Number(releaseDate),
      isStaked,
      tier,
      lastClaimTime: Number(lastClaimTime),
      stakingPeriod: Number(stakingPeriod),
      autoCompound,
      accumulatedCompound: Number(accumulatedCompound),
      currentTimeMultiplier: Number(currentTimeMultiplier),
      lastMultiplierUpdate: Number(lastMultiplierUpdate),
      milestonesAchieved,
      nextMilestoneDays: Number(nextMilestoneDays),
      compoundFrequency,
      compoundFrequencyLabel,
      compoundStreak,
      compoundStreakMultiplier: Number(compoundStreakMultiplier),
      lastCompoundTime: Number(lastClaimTime) // Using lastClaimTime as lastCompoundTime
    };
  } catch (error) {
    console.error('Error parsing stake account data:', error);
    throw error;
  }
}

/**
 * Calculate the next compound time based on frequency
 */
function calculateNextCompoundTime(lastCompoundTime, frequency) {
  // Convert frequency to seconds
  let interval;
  switch (frequency) {
    case 0: // Daily
      interval = 24 * 60 * 60; // 24 hours in seconds
      break;
    case 1: // Weekly
      interval = 7 * 24 * 60 * 60; // 7 days in seconds
      break;
    case 2: // Monthly
      interval = 30 * 24 * 60 * 60; // 30 days in seconds (approximation)
      break;
    default: // Manual - use a short interval for testing
      return lastCompoundTime + 60; // 1 minute (for testing manual compound)
  }
  
  return lastCompoundTime + interval;
}

/**
 * Format time remaining in a human-readable format
 */
function formatTimeRemaining(seconds) {
  if (seconds <= 0) {
    return 'Ready now';
  }
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  let result = '';
  
  if (days > 0) {
    result += `${days} day${days !== 1 ? 's' : ''}, `;
  }
  
  if (hours > 0 || days > 0) {
    result += `${hours} hour${hours !== 1 ? 's' : ''}, `;
  }
  
  result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  
  return result;
}

/**
 * Generate a unique ID for compound operations
 */
function generateUniqueId() {
  return 'compound_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Export the API endpoint with error handling
export default withErrorHandling(handler);