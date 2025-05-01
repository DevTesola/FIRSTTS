// pages/api/prepareStaking.js - 최종 개선 버전
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { Metaplex } from '@metaplex-foundation/js';
// 보상 계산기 모듈 import
import { calculateEstimatedRewards, standardizeTier } from './reward-calculator';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ADDRESS || 'StakeHzWTJ7mxTTk3XnYbMCRCr7v9a5MvzTEFVwA1Ce5G';
const STAKING_VAULT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_VAULT_ADDRESS || 'VauLTYvPNJv55P7joHYzFV66bRXVDrEi6sbfVUvFmNQ';
// 스테이킹 트랜잭션 최소 금액 - 0.001 SOL in lamports
const STAKE_TX_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingPeriod } = req.body;
    
    // 입력 검증
    if (!wallet || !mintAddress || !stakingPeriod) {
      return res.status(400).json({ error: 'Wallet address, mint address, and staking period are required' });
    }
    
    // 지갑 주소 형식 검증
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    // 민트 주소 형식 검증
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid mint address format' });
    }
    
    // 스테이킹 기간 검증
    const stakingPeriodNum = parseInt(stakingPeriod, 10);
    if (isNaN(stakingPeriodNum) || stakingPeriodNum <= 0 || stakingPeriodNum > 365) {
      return res.status(400).json({ error: 'Staking period must be between 1 and 365 days' });
    }
    
    console.log('Staking request received:', { wallet, mintAddress, stakingPeriod: stakingPeriodNum });
    
    // NFT가 이미 스테이킹되어 있는지 확인
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing stake:', existingError);
      return res.status(500).json({ error: 'Failed to check staking status: ' + existingError.message });
    }
    
    if (existingStake) {
      console.log('NFT already staked:', existingStake);
      return res.status(400).json({ 
        error: `This NFT is already staked until ${new Date(existingStake.release_date).toLocaleDateString()}`, 
        existingStake 
      });
    }
    
    // Solana 연결
    console.log('Connecting to Solana RPC:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // NFT 소유권 확인 - 토큰 계정 메서드 먼저 사용 (더 신뢰할 수 있음)
    console.log('Verifying NFT ownership...');
    
    // 토큰 계정으로 먼저 소유권 확인 시도
    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length === 0) {
        console.log('NFT ownership check failed: No token accounts found');
        return res.status(403).json({ error: 'You do not own this NFT' });
      }
      
      console.log('NFT ownership verified through token accounts');
    } catch (tokenCheckError) {
      console.error('Error checking token accounts:', tokenCheckError);
      
      // 토큰 계정 확인이 실패하면 Metaplex 확인으로 대체
      try {
        const metaplex = new Metaplex(connection);
        const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubkey });
        
        // 디버깅용 전체 NFT 구조 로깅
        console.log('NFT data structure:', JSON.stringify(nft, null, 2));
        
        // NFT 존재 확인
        if (!nft) {
          return res.status(404).json({ error: 'NFT not found' });
        }
        
        // 다양한 경로로 소유권 확인
        const ownerAddress = nft.token?.ownerAddress?.toString() || 
                            nft.ownership?.owner?.toString() ||
                            nft.ownerAddress?.toString() ||
                            nft.updateAuthority?.toString();
        
        console.log('Detected owner address:', ownerAddress);
        
        if (!ownerAddress || ownerAddress !== wallet) {
          console.log('NFT ownership mismatch:', { owner: ownerAddress, requester: wallet });
          return res.status(403).json({ error: 'You do not own this NFT' });
        }
        
        console.log('NFT ownership verified via Metaplex:', { owner: ownerAddress, nft: nft.name });
      } catch (metaplexError) {
        console.error('All ownership checks failed:', metaplexError);
        return res.status(500).json({ error: 'Failed to verify NFT ownership: ' + metaplexError.message });
      }
    }
    
    // NFT 등급 조회 (리워드 계산에 필요)
    let nftTier = "COMMON"; // 기본 등급
    let nftName = "";
    let rawTierValue = null; // 원본 등급 값 저장용
    
    try {
      // 데이터베이스에서 NFT 등급 조회
      console.log('Fetching NFT metadata for mint:', mintAddress);
      const { data: nftData } = await supabase
        .from('minted_nfts')
        .select('metadata, name')
        .eq('mint_address', mintAddress)
        .maybeSingle();
      
      if (nftData) {
        nftName = nftData.name || `SOLARA NFT #${Date.now().toString().slice(-4)}`;
        
        if (nftData.metadata) {
          let metadata;
          
          try {
            metadata = typeof nftData.metadata === 'string' 
              ? JSON.parse(nftData.metadata) 
              : nftData.metadata;
              
            console.log('NFT 메타데이터:', JSON.stringify(metadata, null, 2)); // 전체 메타데이터 로깅
            
            // 다양한 형식의 등급 속성 검색
            let tierAttr = metadata.attributes?.find(attr => 
              attr.trait_type?.toLowerCase() === "tier"
            );
            
            console.log('티어 속성 (첫 번째 검색):', tierAttr);
            
            // 값이 없으면 추가 검색
            if (!tierAttr || !tierAttr.value) {
              // 다른 가능한 형식 시도
              tierAttr = metadata.attributes?.find(attr => 
                (attr.trait_type?.toLowerCase() || '').includes("tier") || 
                (attr.trait_type?.toLowerCase() || '').includes("rarity")
              );
              
              console.log('티어 속성 (두 번째 검색):', tierAttr);
            }
            
            if (tierAttr && tierAttr.value) {
              rawTierValue = tierAttr.value; // 원본 값 저장
              // standardizeTier 함수를 사용하여 등급 값 정규화
              nftTier = standardizeTier(tierAttr.value);
              console.log('찾은 NFT 등급:', nftTier, '원본 값:', tierAttr.value);
            } else {
              console.log('NFT 등급 속성을 찾을 수 없음, 기본값 사용:', nftTier);
            }
          } catch (parseError) {
            console.error('메타데이터 파싱 오류:', parseError);
          }
        }
      }
    } catch (tierError) {
      console.error('NFT 등급 조회 오류:', tierError);
      // 기본 등급으로 계속 진행
    }
    
    // 필요한 경우 스테이킹 볼트 생성
    let stakingVaultPubkey;
    try {
      stakingVaultPubkey = new PublicKey(STAKING_VAULT_ADDRESS);
    } catch (err) {
      console.error('Invalid vault address, using fallback:', err);
      // 대체 주소 사용 - 이상적으로는 프로그램의 PDA
      stakingVaultPubkey = new PublicKey(STAKING_PROGRAM_ADDRESS);
    }
    
    console.log('Creating staking transaction...');
    
    // 최근 블록해시 조회
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 스테이킹 트랜잭션 생성
    // 실제 환경에서는 실제 스테이킹 프로그램 명령어로 대체
    // 현재는 작은 SOL 전송으로 스테이킹 액션을 시뮬레이션
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: stakingVaultPubkey,
        lamports: STAKE_TX_AMOUNT, // 스테이킹 액션을 기록하기 위한 작은 금액
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
    
    console.log('Transaction created successfully', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    // 등급 로그 추가
    console.log('계산에 사용할 최종 NFT 등급:', nftTier, '원본 값:', rawTierValue);
    
    // 업데이트된 보상 계산기 사용
    const rewardCalculation = calculateEstimatedRewards(nftTier, stakingPeriodNum);
    
    // 프론트엔드용 스테이킹 메타데이터 생성
    const stakingMetadata = {
      walletAddress: wallet,
      mintAddress: mintAddress,
      nftName: nftName,
      stakingPeriod: stakingPeriodNum,
      requestTimestamp: Date.now(),
      // 계산된 리워드 정보
      nftTier: nftTier,
      rawTierValue: rawTierValue, // 원본 등급 값도 함께 전달
      baseRate: rewardCalculation.baseRate,
      longTermBonus: rewardCalculation.longTermBonus,
      totalEstimatedRewards: rewardCalculation.totalRewards,
      averageDailyReward: rewardCalculation.averageDailyReward,
      // 트랜잭션 만료 관련
      transactionExpiry: lastValidBlockHeight + 150 // 약 150블록 만료 기간
    };
    
    // 서명을 위해 트랜잭션 반환
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64'),
      stakingMetadata,
      rewardDetails: {
        nftTier: nftTier,
        rawTierValue: rawTierValue,
        baseRate: rewardCalculation.baseRate,
        longTermBonus: rewardCalculation.longTermBonus,
        totalRewards: rewardCalculation.totalRewards,
        // 초기 일별 보상이 더 높다는 것을 보여주기 위해 일부 일별 보상 포함
        sampleDailyRewards: {
          day1: rewardCalculation.dailyRewards[0],
          day7: rewardCalculation.dailyRewards[6],
          day15: rewardCalculation.dailyRewards.length > 14 ? rewardCalculation.dailyRewards[14] : null,
          day30: rewardCalculation.dailyRewards.length > 29 ? rewardCalculation.dailyRewards[29] : null
        }
      },
      expiresAt: new Date(Date.now() + 120000).toISOString() // 프론트엔드용 2분 만료
    });
  } catch (error) {
    console.error('Error in prepareStaking API:', error);
    return res.status(500).json({ 
      error: 'Failed to prepare staking transaction: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}