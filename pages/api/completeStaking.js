// pages/api/completeStaking.js - Improved Version
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

// API 핸들러 function 내부
try {
    const { wallet, mintAddress, txSignature, stakingPeriod, tier } = req.body;
    
    // 입력 검증
    if (!wallet || !mintAddress || !txSignature || !stakingPeriod) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('Complete staking request received:', { wallet, mintAddress, txSignature, stakingPeriod });
    
    // 트랜잭션 검증 - 더 엄격한 확인
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 1. 트랜잭션 상태 확인
    let txStatus;
    try {
      txStatus = await connection.getSignatureStatus(txSignature, { searchTransactionHistory: true });
      
      console.log('Transaction status:', JSON.stringify(txStatus, null, 2));
      
      if (!txStatus || !txStatus.value || txStatus.value.err) {
        console.error('Transaction verification failed:', txStatus);
        return res.status(400).json({ 
          error: 'Transaction verification failed', 
          details: txStatus?.value?.err || 'Invalid transaction'
        });
      }
      
      if (txStatus.value.confirmationStatus !== 'confirmed' && 
          txStatus.value.confirmationStatus !== 'finalized') {
        return res.status(400).json({ 
          error: 'Transaction not confirmed yet', 
          status: txStatus.value.confirmationStatus 
        });
      }
      
      console.log('Transaction verified on blockchain:', txSignature);
    } catch (txError) {
      console.error('Error verifying transaction:', txError);
      return res.status(500).json({ error: 'Failed to verify transaction: ' + txError.message });
    }
    
    // 2. 소유권 다시 확인 - 완전히 별도의 확인
    try {
      // 토큰 계정으로 확인
      const walletPubkey = new PublicKey(wallet);
      const mintPubkey = new PublicKey(mintAddress);
      
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length === 0) {
        console.error('Ownership verification failed:', wallet, 'does not own', mintAddress);
        // 여기서 중요: 데이터베이스에 기록이 있는지 확인하고 있다면 삭제
        const { data: existingRecord, error: checkError } = await supabase
          .from('nft_staking')
          .select('id')
          .eq('wallet_address', wallet)
          .eq('mint_address', mintAddress)
          .eq('tx_signature', txSignature)
          .maybeSingle();
        
        if (existingRecord && existingRecord.id) {
          // 기존 기록 삭제
          await supabase
            .from('nft_staking')
            .delete()
            .eq('id', existingRecord.id);
          
          console.log('Deleted invalid staking record:', existingRecord.id);
        }
        
        return res.status(403).json({ error: 'You do not own this NFT' });
      }
      
      console.log('NFT ownership verified for wallet:', wallet);
    } catch (ownershipError) {
      console.error('Error verifying ownership:', ownershipError);
      return res.status(500).json({ error: 'Failed to verify NFT ownership: ' + ownershipError.message });
    }
    
    // 3. 리워드 계산 및 스테이킹 데이터 준비
    const stakingPeriodNum = parseInt(stakingPeriod, 10);
    const nftTier = tier || 'Common'; // 기본값 설정
    const dailyRewardRate = calculateRewardRate(nftTier);
    const totalRewards = dailyRewardRate * stakingPeriodNum;
    
    // 릴리스 날짜 계산 (현재 + 스테이킹 기간)
    const now = new Date();
    const releaseDate = new Date(now);
    releaseDate.setDate(releaseDate.getDate() + stakingPeriodNum);
    
    console.log('Creating staking record with:', { 
      wallet, 
      mintAddress, 
      stakingPeriod: stakingPeriodNum,
      totalRewards,
      releaseDate: releaseDate.toISOString()
    });
    
    // 4. 기존 스테이킹 확인 (중복 방지)
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingStake) {
      return res.status(400).json({ 
        error: `This NFT is already staked until ${new Date(existingStake.release_date).toLocaleDateString()}`,
        existingStake
      });
    }
    
    // 5. 데이터베이스에 스테이킹 정보 저장 (3번 시도)
    let stakingRecord = null;
    let stakingError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await supabase
          .from('nft_staking')
          .insert({
            wallet_address: wallet,
            mint_address: mintAddress,
            staking_period: stakingPeriodNum,
            staked_at: now.toISOString(),
            release_date: releaseDate.toISOString(),
            total_rewards: totalRewards,
            daily_reward_rate: dailyRewardRate,
            tx_signature: txSignature,
            status: 'staked',
            nft_tier: nftTier // nft_name 대신 nft_tier 사용
          })
          .select()
          .single();
        
        stakingRecord = result.data;
        stakingError = result.error;
        
        if (!stakingError) {
          console.log('Staking record created successfully:', stakingRecord.id);
          break; // 성공하면 반복 종료
        }
        
        console.error(`Database error during staking (attempt ${attempt}/3):`, stakingError);
        await new Promise(resolve => setTimeout(resolve, 500)); // 재시도 전 0.5초 대기
      } catch (dbError) {
        console.error(`Unhandled database error (attempt ${attempt}/3):`, dbError);
        stakingError = dbError;
      }
    }
    
    if (stakingError) {
      return res.status(500).json({ 
        error: 'Failed to create staking record: ' + stakingError.message,
        details: process.env.NODE_ENV === 'development' ? stakingError : undefined
      });
    }
    // Helper function to calculate reward rate based on NFT tier
function calculateRewardRate(tier) {
    switch(tier.toLowerCase()) {
      case 'legendary':
        return 2.0;  // 2 TESOLA per day
      case 'rare':
        return 1.5;  // 1.5 TESOLA per day
      case 'uncommon':
        return 1.0;  // 1 TESOLA per day
      case 'common':
      default:
        return 0.5;  // 0.5 TESOLA per day
    }
  }
    return res.status(200).json({
      success: true,
      stakingRecord,
      message: `NFT successfully staked for ${stakingPeriodNum} days. You will earn ${totalRewards} tokens.`
    });
  } catch (error) {
    console.error('Error in completeStaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to complete staking process: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  try {
    const { wallet, mintAddress, txSignature, stakingPeriod } = req.body;
    
    console.log('Complete staking request received:', { wallet, mintAddress, txSignature, stakingPeriod });
    
    if (!wallet || !mintAddress || !txSignature || !stakingPeriod) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, transaction signature, and staking period are required' 
      });
    }
    
    // Validate wallet address format
    try {
      new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // Validate mint address format
    try {
      new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid NFT mint address format' });
    }
    
    // Verify the transaction was confirmed
    let txInfo;
    try {
      const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
      txInfo = await connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!txInfo) {
        console.log('Transaction not found:', txSignature);
        return res.status(400).json({ 
          error: 'Transaction was not found on the blockchain' 
        });
      }
      
      if (txInfo.meta.err) {
        console.log('Transaction failed:', txInfo.meta.err);
        return res.status(400).json({ 
          error: 'Transaction failed on the blockchain',
          details: JSON.stringify(txInfo.meta.err)
        });
      }
      
      // Additional check to make sure transaction sender is the wallet
      const txSender = txInfo.transaction.message.accountKeys[0].toString();
      if (txSender !== wallet) {
        return res.status(403).json({
          error: 'Transaction sender does not match provided wallet address',
          expected: wallet,
          found: txSender
        });
      }
      
      console.log('Transaction verified on blockchain:', txSignature);
    } catch (txError) {
      console.error('Error verifying transaction:', txError);
      return res.status(500).json({ 
        error: 'Failed to verify transaction',
        details: txError.message 
      });
    }
    
    // Verify NFT ownership for the wallet
    try {
      const connection = new Connection(SOLANA_RPC_ENDPOINT);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(wallet),
        { mint: new PublicKey(mintAddress) }
      );
      
      if (tokenAccounts.value.length === 0) {
        return res.status(403).json({
          error: 'NFT not owned by this wallet',
          details: 'The provided mint address is not owned by the wallet'
        });
      }
      
      // Verify token amount = 1 (NFT)
      const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
      if (!tokenAmount.uiAmount || tokenAmount.uiAmount !== 1) {
        return res.status(400).json({
          error: 'Invalid token amount',
          details: 'Token does not appear to be an NFT (amount should be 1)'
        });
      }
      
      console.log('NFT ownership verified for wallet:', wallet);
    } catch (ownershipError) {
      console.error('Error verifying NFT ownership:', ownershipError);
      // Don't fail on ownership check errors - this is a secondary validation
      console.log('Continuing despite ownership verification error');
    }
    
    // Check for existing staking records to prevent duplicates
    try {
      const { data: existingStake, error: existingError } = await supabase
        .from('nft_staking')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('mint_address', mintAddress)
        .eq('status', 'staked')
        .maybeSingle();
      
      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is expected
        console.error('Error checking existing stake:', existingError);
        throw new Error(`Database query error: ${existingError.message}`);
      }
      
      if (existingStake) {
        console.log('Duplicate staking attempt detected:', { 
          stakingId: existingStake.id,
          existingTx: existingStake.tx_signature,
          newTx: txSignature
        });
        
        // If the same transaction signature, return success with existing record
        if (existingStake.tx_signature === txSignature) {
          return res.status(200).json({
            success: true,
            message: 'NFT already staked with this transaction',
            stakingInfo: {
              ...existingStake,
              progress_percentage: calculateProgress(existingStake),
              earned_so_far: calculateEarnedRewards(existingStake)
            }
          });
        }
        
        return res.status(400).json({ 
          error: 'This NFT is already staked',
          stakingInfo: existingStake 
        });
      }
    } catch (checkError) {
      console.error('Error checking for duplicates:', checkError);
      return res.status(500).json({ error: checkError.message });
    }
    
    // Get NFT tier and metadata
    let nftTier = "Common"; // Default tier
    let nftName = "";
    
    try {
      // Look up the NFT in the database to get its tier
      const { data: nftData } = await supabase
        .from('minted_nfts')
        .select('metadata, name')
        .eq('mint_address', mintAddress)
        .maybeSingle();
      
      if (nftData && nftData.metadata) {
        const metadata = typeof nftData.metadata === 'string' 
          ? JSON.parse(nftData.metadata) 
          : nftData.metadata;
        
        const tierAttr = metadata.attributes?.find(attr => 
          attr.trait_type === "Tier" || attr.trait_type === "tier"
        );
        
        if (tierAttr && tierAttr.value) {
          nftTier = tierAttr.value;
          console.log('Found NFT tier:', nftTier);
        }
        
        nftName = nftData.name || metadata.name || `SOLARA NFT`;
      }
    } catch (tierError) {
      console.error('Error fetching NFT tier:', tierError);
      // Continue with default tier
    }
    
    // Reward rates per day by tier
    const dailyRewardsByTier = {
      "Legendary": 2.0,  // 2 TESOLA per day
      "Rare": 1.5,       // 1.5 TESOLA per day
      "Uncommon": 1.0,   // 1 TESOLA per day
      "Common": 0.5      // 0.5 TESOLA per day
    };
    
    // Calculate daily reward rate
    const dailyRate = dailyRewardsByTier[nftTier] || dailyRewardsByTier.Common;
    
    // Calculate total rewards
    const totalRewards = dailyRate * parseInt(stakingPeriod, 10);
    
    // Calculate release date
    const stakingStartDate = new Date();
    const releaseDate = new Date(stakingStartDate);
    releaseDate.setDate(releaseDate.getDate() + parseInt(stakingPeriod, 10));
    
    console.log('Creating staking record with:', {
      wallet,
      mintAddress,
      stakingPeriod,
      totalRewards,
      releaseDate: releaseDate.toISOString()
    });
    
    // Create staking record in database with retry mechanism
    const MAX_RETRIES = 3;
    let stakingData = null;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES && !stakingData) {
      try {
        const { data, error } = await supabase
          .from('nft_staking')
          .insert([
            {
              wallet_address: wallet,
              mint_address: mintAddress,
              nft_name: nftName,
              staking_period: parseInt(stakingPeriod, 10),
              staked_at: stakingStartDate.toISOString(),
              release_date: releaseDate.toISOString(),
              total_rewards: totalRewards,
              daily_reward_rate: dailyRate,
              tx_signature: txSignature,
              status: 'staked',
              nft_tier: nftTier
            }
          ])
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        stakingData = data;
        console.log('Staking record created successfully:', stakingData.id);
      } catch (dbError) {
        retryCount++;
        console.error(`Database error during staking (attempt ${retryCount}/${MAX_RETRIES}):`, dbError);
        
        if (retryCount >= MAX_RETRIES) {
          return res.status(500).json({ 
            error: 'Database error during staking operation after multiple attempts',
            details: dbError.message
          });
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Add calculated fields for UI
    const stakingInfo = {
      ...stakingData,
      progress_percentage: 0, // Just started
      earned_so_far: 0        // Just started
    };
    
    // Return successful response
    return res.status(200).json({
      success: true,
      message: 'NFT staked successfully',
      stakingInfo
    });
  } catch (error) {
    console.error('Error in completeStaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to complete staking process',
      details: error.message 
    });
  }
}

// Helper function to calculate staking progress percentage
function calculateProgress(stakingRecord) {
  if (!stakingRecord) return 0;
  
  const stakingStartDate = new Date(stakingRecord.staked_at);
  const releaseDate = new Date(stakingRecord.release_date);
  const currentDate = new Date();
  
  // Calculate total staking duration in milliseconds
  const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
  
  // Calculate elapsed duration (capped at total duration)
  const elapsedDuration = Math.min(
    currentDate.getTime() - stakingStartDate.getTime(),
    totalStakingDuration
  );
  
  // Calculate progress percentage
  return (elapsedDuration / totalStakingDuration) * 100;
}

// Helper function to calculate earned rewards so far
function calculateEarnedRewards(stakingRecord) {
  if (!stakingRecord) return 0;
  
  const progressPercentage = calculateProgress(stakingRecord);
  const earnedRewards = (stakingRecord.total_rewards * progressPercentage) / 100;
  
  // Format to 2 decimal places
  return parseFloat(earnedRewards.toFixed(2));
}