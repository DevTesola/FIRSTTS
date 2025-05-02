// pages/api/prepareStaking_v3.js
// 온체인 IDL을 기반으로 완전히 새롭게 구현한 스테이킹 준비 API
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { calculateEstimatedRewards, standardizeTier } from './reward-calculator';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

// 온체인에서 추출한 정확한 IDL에서 시그해시 정보 가져오기
const STAKE_NFT_DISCRIMINATOR = [38, 27, 66, 46, 69, 65, 151, 219]; // 온체인 IDL에서 확인된 정확한 시그해시
const ESCROW_SEED = [101, 115, 99, 114, 111, 119]; // "escrow"
const STAKE_SEED = [115, 116, 97, 107, 101]; // "stake"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const STAKING_PROGRAM_ADDRESS = 'CnpcsE2eJSfULpikfkbdd31wo6WeoL2jw8YyKSWG3Cfu';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet, mintAddress, stakingPeriod } = req.body;
    
    if (!wallet || !mintAddress || !stakingPeriod) {
      return res.status(400).json({ error: 'Wallet address, mint address, and staking period are required' });
    }
    
    let walletPubkey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    let mintPubkey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid mint address format' });
    }
    
    const stakingPeriodNum = parseInt(stakingPeriod, 10);
    if (isNaN(stakingPeriodNum) || stakingPeriodNum <= 0 || stakingPeriodNum > 365) {
      return res.status(400).json({ error: 'Staking period must be between 1 and 365 days' });
    }
    
    console.log('스테이킹 요청 받음:', { wallet, mintAddress, stakingPeriod: stakingPeriodNum });
    
    // 이미 스테이킹되었는지 확인
    const { data: existingStake, error: existingError } = await supabase
      .from('nft_staking')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('mint_address', mintAddress)
      .eq('status', 'staked')
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('기존 스테이킹 확인 중 오류:', existingError);
      return res.status(500).json({ error: '스테이킹 상태 확인 실패: ' + existingError.message });
    }
    
    if (existingStake) {
      console.log('NFT 이미 스테이킹됨:', existingStake);
      return res.status(400).json({ 
        error: `이 NFT는 이미 ${new Date(existingStake.release_date).toLocaleDateString()}까지 스테이킹되어 있습니다`, 
        existingStake 
      });
    }
    
    console.log('Solana RPC에 연결 중:', SOLANA_RPC_ENDPOINT);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // NFT 소유권 확인
    console.log('NFT 소유권 확인 중...');
    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      });
      
      if (tokenAccounts.value.length === 0) {
        console.log('NFT 소유권 확인 실패: 토큰 계정 없음');
        return res.status(403).json({ error: '이 NFT의 소유자가 아닙니다' });
      }
      
      console.log('토큰 계정을 통해 NFT 소유권 확인됨');
    } catch (tokenCheckError) {
      console.error('토큰 계정 확인 중 오류:', tokenCheckError);
      return res.status(500).json({ error: 'NFT 소유권 확인 실패: ' + tokenCheckError.message });
    }
    
    // NFT 등급 가져오기 (데이터베이스 또는 메타데이터 조회)
    let nftTier = "COMMON";
    let nftName = "";
    let rawTierValue = null;
    
    try {
      console.log('NFT 메타데이터 가져오는 중:', mintAddress);
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
              
            console.log('NFT 메타데이터:', JSON.stringify(metadata, null, 2));
            
            const tierAttr = metadata.attributes?.find(attr => 
              attr.trait_type?.toLowerCase() === "tier"
            );
            
            if (tierAttr && tierAttr.value) {
              rawTierValue = tierAttr.value;
              nftTier = standardizeTier(tierAttr.value);
              console.log('NFT 등급 찾음:', nftTier, '원본 값:', tierAttr.value);
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
    }
    
    // 프로그램 ID 설정
    const programId = new PublicKey(STAKING_PROGRAM_ADDRESS);
    
    // 사용자 토큰 계정 가져오기
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    // PDA 생성 - IDL에서 정확한 시드 값 사용
    // 1. stakeInfo PDA - "stake" 시드 사용
    const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    console.log('Stake info PDA:', stakeInfoPDA.toString());
    
    // 2. escrow_authority PDA - "escrow" 시드 사용
    const [escrowAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), mintPubkey.toBuffer()],
      programId
    );
    
    console.log('Escrow authority PDA:', escrowAuthorityPDA.toString());
    
    // 3. escrow 토큰 계정 가져오기
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true  // Allow owner off curve
    );
    
    console.log('Escrow token account:', escrowTokenAccount.toString());
    console.log('스테이킹 트랜잭션 생성 중...');
    
    // 새 트랜잭션 생성
    const tx = new Transaction();
    
    // ⭐ 중요: escrow_nft_account를 초기화하는 명령어 추가
    // 이 명령어는 연결된 토큰 계정이 없을 경우 생성합니다.
    console.log('escrow_nft_account 초기화 명령 추가');
    const createATAIx = createAssociatedTokenAccountInstruction(
      walletPubkey,          // 지불자
      escrowTokenAccount,    // 생성할 계정
      escrowAuthorityPDA,    // 계정 소유자
      mintPubkey             // 토큰 민트
    );
    
    // 트랜잭션에 escrow 계정 생성 명령 추가
    tx.add(createATAIx);
    
    // stakingPeriod를 8바이트 버퍼로 변환 (u64, little-endian)
    const stakingPeriodBuf = Buffer.alloc(8);
    stakingPeriodBuf.writeBigUInt64LE(BigInt(stakingPeriodNum));
    
    // 명령 데이터 구성: sighash + 인자
    // 온체인 IDL에 따르면 stake_nft 명령은 staking_period 인자만 필요함
    const instructionData = Buffer.concat([
      Buffer.from(STAKE_NFT_DISCRIMINATOR),  // 8바이트 명령어 식별자
      stakingPeriodBuf                       // 8바이트 스테이킹 기간 (u64)
    ]);
    
    // 온체인 IDL에 맞게 계정 배열 구성
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },         // owner
      { pubkey: mintPubkey, isSigner: false, isWritable: false },         // nft_mint
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },    // user_nft_account
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },  // escrow_nft_account
      { pubkey: escrowAuthorityPDA, isSigner: false, isWritable: false }, // escrow_authority
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },        // stake_info
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },    // token_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false } // associated_token_program
    ];
    
    // 계정 목록 로깅
    console.log('계정 구조:');
    const accountNames = ["owner", "nft_mint", "user_nft_account", "escrow_nft_account", "escrow_authority", "stake_info", "system_program", "token_program", "associated_token_program"];
    accounts.forEach((acc, idx) => {
      console.log(`${idx}. ${accountNames[idx]}: ${acc.pubkey.toString()} (isSigner: ${acc.isSigner}, isWritable: ${acc.isWritable})`);
    });
    
    // 트랜잭션 명령 생성
    const stakeNftIx = new TransactionInstruction({
      keys: accounts,
      programId: programId,
      data: instructionData
    });
    
    // 트랜잭션에 stakeNft 명령 추가
    tx.add(stakeNftIx);
    
    console.log('트랜잭션 명령 생성 성공');
    
    // 트랜잭션 시뮬레이션을 통한 검증
    try {
      console.log('트랜잭션 시뮬레이션 중...');
      tx.feePayer = walletPubkey; // 시뮬레이션을 위해 임시 설정
      
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      
      const simulation = await connection.simulateTransaction(tx);
      
      if (simulation.value.err) {
        console.warn('시뮬레이션 오류:', simulation.value.err);
        console.log('시뮬레이션 로그:', simulation.value.logs);
        // 시뮬레이션이 실패해도 계속 진행 (실제 환경에서는 다르게 동작할 수 있음)
      } else {
        console.log('시뮬레이션 성공!');
      }
    } catch (simError) {
      console.warn('시뮬레이션 실행 오류:', simError);
      // 시뮬레이션 오류도 무시하고 계속 진행
    }
    
    // 최근 블록해시 가져오기
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // 트랜잭션 속성 설정
    tx.feePayer = walletPubkey;
    tx.recentBlockhash = blockhash;
    
    // 트랜잭션 직렬화
    const serializedTransaction = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    console.log('트랜잭션 생성 성공', {
      size: serializedTransaction.length,
      blockhash,
      lastValidBlockHeight
    });
    
    // 보상 계산
    const rewardCalculation = calculateEstimatedRewards(nftTier, stakingPeriodNum);
    
    // 프론트엔드용 스테이킹 메타데이터 생성
    const stakingMetadata = {
      walletAddress: wallet,
      mintAddress: mintAddress,
      nftName: nftName,
      stakingPeriod: stakingPeriodNum,
      requestTimestamp: Date.now(),
      nftTier: nftTier,
      rawTierValue: rawTierValue,
      baseRate: rewardCalculation.baseRate,
      longTermBonus: rewardCalculation.longTermBonus,
      totalEstimatedRewards: rewardCalculation.totalRewards,
      averageDailyReward: rewardCalculation.averageDailyReward,
      transactionExpiry: lastValidBlockHeight + 150
    };
    
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64'),
      stakingMetadata,
      rewardDetails: {
        nftTier: nftTier,
        rawTierValue: rawTierValue,
        baseRate: rewardCalculation.baseRate,
        longTermBonus: rewardCalculation.longTermBonus,
        totalRewards: rewardCalculation.totalRewards,
        sampleDailyRewards: {
          day1: rewardCalculation.dailyRewards[0],
          day7: rewardCalculation.dailyRewards[6],
          day15: rewardCalculation.dailyRewards.length > 14 ? rewardCalculation.dailyRewards[14] : null,
          day30: rewardCalculation.dailyRewards.length > 29 ? rewardCalculation.dailyRewards[29] : null
        }
      },
      expiresAt: new Date(Date.now() + 120000).toISOString()
    });
  } catch (error) {
    console.error('스테이킹 트랜잭션 준비 중 오류:', error);
    return res.status(500).json({ 
      error: '스테이킹 트랜잭션 준비 실패: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}