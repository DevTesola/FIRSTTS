/**
 * 스테이킹된 NFT 디버깅 API (향상된 버전)
 * 온체인 데이터와 데이터베이스 데이터를 비교하여 문제점 파악
 * 정확한 PDA 계산 및 다양한 시드 값 시험
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder } from '@project-serum/anchor';
import { findStakeInfoPDA, findUserStakingInfoPDA } from '../../../shared/utils/pda';
import { PROGRAM_ID } from '../../../shared/constants/program-ids';
import { resolveNftId } from '../../../utils/staking-helpers/nft-id-resolver';
import { getSupabaseAdmin } from '../../../utils/supabaseClient';
const supabase = getSupabaseAdmin();

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// 다양한 시드 값으로 PDA를 계산하는 함수 (트러블슈팅용)
function calculatePDAWithDifferentSeeds(mintAddress, programId) {
  const seedOptions = [
    'stake',
    'stake_info',
    'staking',
    'stakeinfo',
    'stake-info',
    'nft_stake',
    'nft-stake'
  ];

  const results = [];
  
  const mintPubkey = new PublicKey(mintAddress);
  
  for (const seed of seedOptions) {
    try {
      const [pda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed), mintPubkey.toBuffer()],
        programId
      );
      
      results.push({
        seed,
        seed_bytes: Buffer.from(seed).toString('hex'),
        pda: pda.toString(),
        bump
      });
    } catch (err) {
      results.push({
        seed,
        error: err.message
      });
    }
  }
  
  return results;
}

export default async function handler(req, res) {
  try {
    const { wallet, mint } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: '지갑 주소가 필요합니다' });
    }
    
    console.log(`[DEBUG-STAKEDMINTS] 지갑 ${wallet}의 온체인 스테이킹 정보 심층 분석`);
    if (mint) {
      console.log(`[DEBUG-STAKEDMINTS] 민트 주소 ${mint}의 세부 정보 분석`);
    }
    
    // 진단 정보 객체
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      wallet: wallet,
      request_parameters: req.query,
      onchain_data: {},
      database_data: {},
      seed_analysis: {},
      environment: {
        rpc_endpoint: SOLANA_RPC_ENDPOINT,
        program_id: PROGRAM_ID
      }
    };
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    const walletPubkey = new PublicKey(wallet);
    
    // 사용자 스테이킹 정보 계정 조회
    const [userStakingPDA] = findUserStakingInfoPDA(walletPubkey);
    console.log(`사용자 스테이킹 PDA: ${userStakingPDA.toString()}`);
    diagnosticInfo.onchain_data.user_staking_pda = userStakingPDA.toString();
    
    const userStakingAccount = await connection.getAccountInfo(userStakingPDA);
    
    if (!userStakingAccount) {
      diagnosticInfo.onchain_data.user_staking_account_exists = false;
      diagnosticInfo.error = "사용자 스테이킹 계정이 존재하지 않습니다";
      return res.status(200).json(diagnosticInfo);
    }
    
    console.log(`스테이킹 계정 존재함: ${userStakingAccount.data.length} 바이트`);
    diagnosticInfo.onchain_data.user_staking_account_exists = true;
    diagnosticInfo.onchain_data.user_staking_account_size = userStakingAccount.data.length;
    
    // IDL 기반으로 계정 데이터 디코딩
    const idl = require('../../../idl/nft_staking.json');
    const coder = new BorshAccountsCoder(idl);
    
    try {
      // 사용자 스테이킹 정보 디코딩
      const userStakingInfo = coder.decode('userStakingInfo', userStakingAccount.data);
      console.log(`스테이킹 카운트: ${userStakingInfo.stakedCount}`);
      console.log(`스테이킹된 NFT 갯수: ${userStakingInfo.stakedMints.length}`);
      
      diagnosticInfo.onchain_data.staking_count = userStakingInfo.stakedCount;
      diagnosticInfo.onchain_data.collection_bonus = userStakingInfo.collectionBonus;
      
      // 스테이킹된 NFT 목록 추출
      const stakedNFTs = [];
      
      // 모든 민트 주소 확인 (필터링 없이)
      userStakingInfo.stakedMints.forEach((mint, index) => {
        const mintStr = mint.toString();
        console.log(`[${index}] 민트 주소: ${mintStr}`);
        console.log(`   - 기본 주소와 같은지: ${mint.equals(PublicKey.default)}`);
        console.log(`   - 모두 1인지: ${mintStr === '11111111111111111111111111111111'}`);
        
        // NFT ID 해결
        const resolvedId = resolveNftId(mintStr);
        
        // 모든 민트 주소 추가 (나중에 확인을 위해)
        stakedNFTs.push({
          index,
          mint_address: mintStr,
          is_default: mint.equals(PublicKey.default),
          is_all_ones: mintStr === '11111111111111111111111111111111',
          resolved_id: resolvedId,
          is_valid: !mint.equals(PublicKey.default) && mintStr !== '11111111111111111111111111111111'
        });
      });
      
      // 진단 정보에 스테이킹된 NFT 추가
      diagnosticInfo.onchain_data.all_staked_nfts = stakedNFTs;
      diagnosticInfo.onchain_data.valid_staked_nfts = stakedNFTs.filter(nft => nft.is_valid);
      
      // 유효한 민트 주소 목록
      const validMints = stakedNFTs
        .filter(nft => nft.is_valid)
        .map(nft => nft.mint_address);
        
      diagnosticInfo.onchain_data.valid_mint_count = validMints.length;
      diagnosticInfo.onchain_data.total_mint_count = stakedNFTs.length;
      
      // 특정 민트 주소가 제공된 경우 해당 민트에 대한 자세한 분석
      if (mint) {
        // 민트 주소 객체 생성
        const mintPubkey = new PublicKey(mint);
        diagnosticInfo.mint_address = mint;
        
        // 민트 주소가 스테이킹된 NFT 목록에 있는지 확인
        const stakingEntry = stakedNFTs.find(nft => nft.mint_address === mint);
        diagnosticInfo.onchain_data.mint_in_staked_list = !!stakingEntry;
        
        if (stakingEntry) {
          diagnosticInfo.onchain_data.mint_staking_info = stakingEntry;
        }
        
        // 다양한 시드로 PDA 계산 시도
        const seedAnalysis = calculatePDAWithDifferentSeeds(mint, programId);
        diagnosticInfo.seed_analysis = seedAnalysis;
        
        // 올바른 시드로 계산한 PDA
        const [stakePDA] = findStakeInfoPDA(mintPubkey);
        diagnosticInfo.onchain_data.correct_stake_pda = stakePDA.toString();
        
        // 스테이크 계정 조회
        const stakeAccount = await connection.getAccountInfo(stakePDA);
        diagnosticInfo.onchain_data.stake_account_exists = !!stakeAccount;
        
        if (stakeAccount) {
          try {
            // 스테이크 정보 디코딩
            const stakeInfo = coder.decode('stakeInfo', stakeAccount.data);
            
            // 스테이크 정보에서 유용한 필드 추출
            diagnosticInfo.onchain_data.stake_info = {
              is_unstaked: stakeInfo.isUnstaked === 1,
              owner: stakeInfo.owner?.toString(),
              nft_mint: stakeInfo.nftMint?.toString(),
              staking_start_time: stakeInfo.stakingStartTime?.toString(),
              release_time: stakeInfo.releaseTime?.toString(),
              reward_rate: stakeInfo.rewardRatePerDay?.toString(),
              tier_multiplier: stakeInfo.tierMultiplier
            };
            
            // 사람이 읽을 수 있는 형식의 날짜 추가
            if (stakeInfo.stakingStartTime) {
              const startDate = new Date(stakeInfo.stakingStartTime.toNumber() * 1000);
              diagnosticInfo.onchain_data.stake_info.start_date_human = startDate.toISOString();
            }
            
            if (stakeInfo.releaseTime) {
              const releaseDate = new Date(stakeInfo.releaseTime.toNumber() * 1000);
              diagnosticInfo.onchain_data.stake_info.release_date_human = releaseDate.toISOString();
            }
          } catch (decodeErr) {
            diagnosticInfo.onchain_data.stake_decode_error = decodeErr.message;
          }
        }
        
        // 데이터베이스에서 민트 정보 검색
        try {
          // nft_staking 테이블에서 검색
          const { data: stakingData, error: stakingError } = await supabase
            .from('nft_staking')
            .select('*')
            .eq('mint_address', mint);
          
          if (stakingError) {
            diagnosticInfo.database_data.staking_error = stakingError.message;
          } else {
            const activeStakes = stakingData?.filter(record => record.status === 'staked') || [];
            diagnosticInfo.database_data.staking_records = stakingData || [];
            diagnosticInfo.database_data.active_staking_records = activeStakes;
            diagnosticInfo.database_data.staking_record_count = stakingData?.length || 0;
            diagnosticInfo.database_data.active_staking_count = activeStakes.length;
            
            // 데이터베이스의 NFT ID 정보 추출
            if (stakingData && stakingData.length > 0) {
              const dbNftIds = stakingData.map(record => ({
                id: record.id,
                nft_id: record.nft_id,
                staked_nft_id: record.staked_nft_id,
                status: record.status
              }));
              diagnosticInfo.database_data.db_nft_ids = dbNftIds;
            }
          }
          
          // minted_nfts 테이블에서 검색
          const { data: mintedData, error: mintedError } = await supabase
            .from('minted_nfts')
            .select('*')
            .eq('mint_address', mint);
          
          if (mintedError) {
            diagnosticInfo.database_data.minted_error = mintedError.message;
          } else {
            diagnosticInfo.database_data.minted_records = mintedData || [];
            diagnosticInfo.database_data.minted_record_count = mintedData?.length || 0;
            
            // 데이터베이스의 민트 인덱스 정보 추출
            if (mintedData && mintedData.length > 0) {
              diagnosticInfo.database_data.mint_index = mintedData[0].mint_index;
              diagnosticInfo.database_data.nft_name = mintedData[0].name;
            }
          }
        } catch (dbError) {
          diagnosticInfo.database_data.error = dbError.message;
        }
      }
      
      // 프로그램 계정 세부정보 가져오기
      const programAccount = await connection.getAccountInfo(new PublicKey(PROGRAM_ID));
      diagnosticInfo.program_info = programAccount ? {
        executable: programAccount.executable,
        owner: programAccount.owner.toString(),
        data_length: programAccount.data.length
      } : null;
      
      // 문제 목록 확인
      const issues = [];
      
      // 문제 1: 유효하지 않은 민트 주소가 있는지 확인
      const invalidMints = stakedNFTs.filter(nft => !nft.is_valid);
      if (invalidMints.length > 0) {
        issues.push({
          type: 'invalid_mints',
          description: '유효하지 않은 민트 주소가 발견되었습니다',
          count: invalidMints.length,
          mints: invalidMints
        });
      }
      
      // 문제 2: 온체인 stakedCount와 실제 유효한 민트 개수 비교
      if (userStakingInfo.stakedCount !== validMints.length) {
        issues.push({
          type: 'count_mismatch',
          description: '온체인 stakedCount와 유효한 민트 개수가 일치하지 않습니다',
          onchain_count: userStakingInfo.stakedCount,
          valid_mints_count: validMints.length
        });
      }
      
      // 진단 결과에 문제 목록 추가
      diagnosticInfo.issues = issues;
      diagnosticInfo.has_issues = issues.length > 0;
      
      // 종합 결과
      return res.status(200).json(diagnosticInfo);
    } catch (decodeError) {
      console.error(`계정 디코딩 오류:`, decodeError);
      diagnosticInfo.error = '계정 디코딩 오류: ' + decodeError.message;
      return res.status(200).json(diagnosticInfo);
    }
  } catch (error) {
    console.error(`디버깅 API 오류:`, error);
    return res.status(500).json({
      error: '서버 오류',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}