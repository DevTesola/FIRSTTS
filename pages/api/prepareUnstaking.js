// pages/api/prepareUnstaking.js - Integrated Version
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { calculateUnstakingPenalty } from '../../utils/reward-calculator';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ADDRESS || 'StakeHzWTJ7mxTTk3XnYbMCRCr7v9a5MvzTEFVwA1Ce5G';
const STAKING_VAULT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS || 'VauLTYvPNJv55P7joHYzFV66bRXVDrEi6sbfVUvFmNQ';
// 언스테이킹 트랜잭션 최소 금액 - 0.001 SOL in lamports
const UNSTAKE_TX_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingId } = req.body;
    
    // 입력 유효성 검사
    if (!wallet || !mintAddress || !stakingId) {
      return res.status(400).json({ 
        error: 'Wallet address, mint address, and staking ID are required',
        success: false 
      });
    }
    
    // 지갑 주소 형식 검증
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        success: false 
      });
    }
    
    // 스테이킹 정보 조회
    console.log(`Fetching staking record ID: ${stakingId}`);
    const { data: stakingRecord, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('id', stakingId)
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .single();
    
    if (stakingError || !stakingRecord) {
      console.error('Error fetching staking record:', stakingError || 'No record found');
      return res.status(404).json({ 
        error: stakingError ? stakingError.message : 'Staking record not found',
        success: false 
      });
    }
    
    console.log('Found staking record:', stakingRecord);
    
    // 향상된 언스테이킹 페널티 계산
    const currentDate = new Date();
    const stakingStartDate = new Date(stakingRecord.staked_at);
    const releaseDate = new Date(stakingRecord.release_date);
    const nftTier = stakingRecord.nft_tier || 'COMMON';
    const stakingPeriod = stakingRecord.staking_period;
    
    // 계산기 사용하여 정확한 페널티 계산
    const penaltyInfo = calculateUnstakingPenalty(
      nftTier,
      stakingStartDate,
      currentDate,
      stakingPeriod
    );
    
    // 언스테이킹 트랜잭션 준비
    console.log('Preparing unstaking transaction...');
    
    // 스테이킹 볼트 설정
    let stakingVaultPubkey;
    try {
      stakingVaultPubkey = new PublicKey(STAKING_VAULT_ADDRESS);
    } catch (err) {
      console.error('Invalid vault address, using fallback:', err);
      stakingVaultPubkey = new PublicKey(STAKING_PROGRAM_ADDRESS);
    }
    
    // Solana 연결
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 최근 블록해시 조회
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 언스테이킹 트랜잭션 생성 (실제 프로덕션에서는 스테이킹 프로그램 명령어로 대체)
    // 현재는 작은 SOL 전송으로 언스테이킹 액션을 시뮬레이션
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: stakingVaultPubkey,
        lamports: UNSTAKE_TX_AMOUNT, // 언스테이킹 액션을 기록하기 위한 작은 금액
      })
    );
    
    // 트랜잭션 속성 설정
    transaction.feePayer = walletPubkey;
    transaction.recentBlockhash = blockhash;
    
    // 트랜잭션 직렬화
    const serializedTransaction = transaction.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    console.log('Unstaking transaction created successfully', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    // 응답 반환
    return res.status(200).json({
      success: true,
      transactionBase64: serializedTransaction.toString('base64'),
      stakingInfo: stakingRecord,
      unstakingDetails: {
        // 페널티 정보
        isPremature: penaltyInfo.isPremature,
        earnedRewards: penaltyInfo.earnedRewards,
        penaltyAmount: penaltyInfo.penaltyAmount,
        penaltyPercentage: penaltyInfo.penaltyPercentage,
        finalReward: penaltyInfo.finalReward,
        // 일반 언스테이킹 데이터
        transactionExpiry: lastValidBlockHeight + 150, // 약 150블록 만료 기간
        canWithdraw: currentDate >= releaseDate,
        daysRemaining: Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)))
      }
    });
  } catch (error) {
    console.error('Error in prepareUnstaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to prepare unstaking transaction: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      success: false
    });
  }
}