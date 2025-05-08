// pages/api/admin/sync-staking.js
// 스테이킹 데이터 동기화 API
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, STAKE_SEED, USER_STAKING_SEED, DISCRIMINATORS } from '../../../utils/staking-helpers/constants';
import { createClient } from '@supabase/supabase-js';
import { BN } from 'bn.js';
import * as borsh from 'borsh';

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana RPC 엔드포인트
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// NFT 컬렉션 민트 주소 (컬렉션 식별용)
const COLLECTION_MINT = process.env.NEXT_PUBLIC_COLLECTION_MINT;

// IPFS Gateway URL
const IPFS_GATEWAY = 'https://tesola.mypinata.cloud/ipfs/';

// IPFS CID - JSON 메타데이터용
const METADATA_IPFS_HASH = process.env.NEXT_PUBLIC_RESOURCE_CID || 'bafybeifr7lmcpstyii42klei2yh6f3agxsk65sb2m5qjbrdfsn3ahpposu';

// 이미지 전용 IPFS CID
const IMAGES_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';

// 스테이킹 계정 레이아웃 (단순화된 버전)
class StakeInfo {
  constructor(properties) {
    Object.assign(this, properties);
  }

  static schema = new Map([
    [
      StakeInfo,
      {
        kind: 'struct',
        fields: [
          ['discriminator', [8]], // 계정 타입 식별자
          ['isInitialized', 'u8'], // 초기화 여부
          ['nftMint', [32]], // NFT 민트 주소
          ['owner', [32]], // 소유자 주소
          ['stakedAt', 'u64'], // 스테이킹 시작 시간
          ['lastUpdateTime', 'u64'], // 마지막 업데이트 시간
          ['releaseTime', 'u64'], // 릴리즈 시간
          ['rewardRatePerDay', 'u64'], // 일일 보상 비율
          ['accumulatedReward', 'u64'], // 누적 보상
          ['tierMultiplier', 'u8'], // 등급 배수
          ['isUnstaked', 'u8'], // 언스테이킹 여부
        ],
      },
    ],
  ]);
}

// Borsh를 사용한 계정 데이터 디코딩 함수
function decodeStakeInfo(data) {
  try {
    // 각 계정 데이터는 최소한 다음과 같은 구조를 가져야 합니다
    if (!data || data.length < 50) {
      console.error('계정 데이터가 너무 짧습니다:', data?.length);
      return null;
    }
    
    // 계정 타입 식별자 확인 (STAKE_INFO_DISCRIMINATOR)
    const discriminator = DISCRIMINATORS.STAKE_INFO || Buffer.from([91, 4, 83, 117, 169, 120, 168, 119]);
    const accountDiscriminator = data.slice(0, 8);
    
    // 식별자가 일치하지 않으면 다른 타입의 계정
    if (!accountDiscriminator.equals(discriminator)) {
      return null;
    }
    
    // 디코딩 시도
    try {
      return borsh.deserialize(StakeInfo.schema, StakeInfo, data);
    } catch (borshError) {
      console.error('스테이킹 계정 데이터 디코딩 실패:', borshError);
      
      // 기본적인 정보만이라도 수동으로 추출
      if (data.length >= 40 + 32) { // discriminator(8) + isInitialized(1) + nftMint(32)
        const isInitialized = data[8];
        const nftMint = data.slice(9, 41);
        const owner = data.length >= 73 ? data.slice(41, 73) : Buffer.alloc(32);
        const isUnstaked = data.length > 73 ? data[data.length - 1] : 0;
        
        return {
          discriminator: accountDiscriminator,
          isInitialized,
          nftMint,
          owner,
          stakedAt: new BN(0),
          lastUpdateTime: new BN(0),
          releaseTime: new BN(0),
          rewardRatePerDay: new BN(0),
          accumulatedReward: new BN(0),
          tierMultiplier: 1,
          isUnstaked
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('스테이킹 계정 데이터 디코딩 예외:', error);
    return null;
  }
}

// PublicKey 형식으로 변환
function toPublicKey(address) {
  try {
    return new PublicKey(address);
  } catch (err) {
    throw new Error(`Invalid public key: ${address}`);
  }
}

// 이미지 URL 생성
function createImageUrl(id) {
  // ID가 숫자가 아니면 변환
  const numericId = parseInt(id.toString().replace(/\D/g, ''));
  // 4자리 숫자로 포맷팅
  const formattedId = String(numericId).padStart(4, '0');
  
  // 두 가지 형태의 URL 생성
  const ipfsUrl = `ipfs://${IMAGES_IPFS_HASH}/${formattedId}.png`;
  const gatewayUrl = `${IPFS_GATEWAY}${IMAGES_IPFS_HASH}/${formattedId}.png`;
  
  // 원본 IPFS URL과 게이트웨이 URL 모두 반환
  return {
    ipfs_url: ipfsUrl,     // ipfs:// 프로토콜 URL
    gateway_url: gatewayUrl, // 직접 액세스 가능한 게이트웨이 URL
    nft_image: gatewayUrl,   // 기존 호환성을 위한 필드
    ipfs_hash: IMAGES_IPFS_HASH  // IPFS CID 저장
  };
}

// Solana 타임스탬프(초)를 JavaScript Date 객체로 변환
function solanaTimestampToDate(timestamp) {
  // 숫자가 너무 크거나 유효하지 않은 경우 현재 시간 반환
  if (!timestamp || isNaN(timestamp) || timestamp > Number.MAX_SAFE_INTEGER) {
    console.warn('유효하지 않은 타임스탬프:', timestamp);
    return new Date();
  }
  return new Date(timestamp * 1000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 관리자 인증
    const { admin_key } = req.headers;
    if (admin_key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, wallet, mintAddress } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const programId = new PublicKey(PROGRAM_ID);
    
    // 지갑 주소로 스테이킹된 모든 NFT 동기화하는 헬퍼 함수
    const syncWalletNFTs = async (walletAddress) => {
      try {
        // 지갑 주소 확인
        const walletPubkey = toPublicKey(walletAddress);
        
        // 블록체인에서 지갑의 스테이킹 정보 가져오기
        const { stakes } = await getWalletStakingInfoFromChain(walletPubkey);
        
        if (stakes.length === 0) {
          return {
            success: true,
            message: '이 지갑에서 스테이킹된 NFT를 찾을 수 없습니다.',
            count: 0,
            results: []
          };
        }
        
        // 모든 NFT 동기화
        const results = [];
        for (const stake of stakes) {
          try {
            const mintPubkey = new PublicKey(stake.nftMint);
            const onchainData = await getStakeInfoFromChain(mintPubkey);
            
            if (onchainData && !onchainData.error && !onchainData.isUnstaked) {
              // 온체인 데이터를 데이터베이스에 동기화
              const result = await upsertStakingRecord(onchainData);
              results.push({
                mint: stake.nftMint,
                status: 'synchronized',
                result
              });
            } else {
              results.push({
                mint: stake.nftMint,
                status: 'skipped',
                reason: onchainData?.error || 'NFT is unstaked or invalid'
              });
            }
          } catch (err) {
            console.error(`NFT ${stake.nftMint} 동기화 실패:`, err);
            results.push({
              mint: stake.nftMint,
              status: 'error',
              error: err.message
            });
          }
        }
        
        return {
          success: true,
          message: `${results.filter(r => r.status === 'synchronized').length}개의 NFT가 동기화되었습니다.`,
          count: results.filter(r => r.status === 'synchronized').length,
          total: stakes.length,
          results
        };
      } catch (err) {
        console.error('지갑 NFT 동기화 실패:', err);
        throw err;
      }
    };
    
    // 자주 사용하는 함수: 민트 주소에서 스테이킹 계정 조회
    const getStakeInfoFromChain = async (mintPubkey) => {
      const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(STAKE_SEED), mintPubkey.toBuffer()],
        programId
      );

      const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
      
      if (!stakeInfoAccount) {
        return null;
      }

      try {
        // 계정 데이터 디코딩
        const stakeInfo = decodeStakeInfo(stakeInfoAccount.data);
        
        if (!stakeInfo) {
          return {
            exists: true,
            error: 'Failed to decode account data'
          };
        }

        // PublicKey 변환
        const nftMint = new PublicKey(stakeInfo.nftMint);
        const owner = new PublicKey(stakeInfo.owner);

        return {
          exists: true,
          pda: stakeInfoPDA.toString(),
          nftMint: nftMint.toString(),
          owner: owner.toString(),
          stakedAt: solanaTimestampToDate(Number(stakeInfo.stakedAt)),
          lastUpdateTime: solanaTimestampToDate(Number(stakeInfo.lastUpdateTime)),
          releaseTime: solanaTimestampToDate(Number(stakeInfo.releaseTime)),
          rewardRatePerDay: Number(stakeInfo.rewardRatePerDay),
          accumulatedReward: Number(stakeInfo.accumulatedReward),
          tierMultiplier: stakeInfo.tierMultiplier,
          isUnstaked: stakeInfo.isUnstaked === 1
        };
      } catch (error) {
        console.error('스테이킹 계정 정보 처리 실패:', error);
        return {
          exists: true,
          error: error.message
        };
      }
    };

    // 데이터베이스에 스테이킹 정보 추가 또는 업데이트
    const upsertStakingRecord = async (onchainData) => {
      // NFT ID 추출 또는 생성
      let nftId = null;
      
      // mint_nfts 테이블에서 실제 NFT 데이터 조회
      const { data: nftData, error: nftError } = await supabase
        .from('minted_nfts')
        .select('*')
        .eq('mint_address', onchainData.nftMint)
        .single();

      if (nftError && nftError.code !== 'PGRST116') { // PGRST116: 결과가 없음
        console.error('NFT 데이터 조회 실패:', nftError);
      }

      // NFT 데이터가 있으면 이를 사용, 없으면 ID 생성
      if (nftData) {
        nftId = nftData.mint_index || nftData.id;
      } else {
        // 민트 주소에서 해시 기반 ID 생성
        const mintAddress = onchainData.nftMint;
        let hash = 0;
        for (let i = 0; i < mintAddress.length; i++) {
          hash = ((hash << 5) - hash) + mintAddress.charCodeAt(i);
          hash = hash & hash; // 32비트 정수로 변환
        }
        nftId = Math.abs(hash) % 999 + 1;
      }

      // 스테이킹 기간 계산 (일)
      const stakedAt = new Date(onchainData.stakedAt);
      const releaseTime = new Date(onchainData.releaseTime);
      const stakingPeriod = Math.ceil((releaseTime - stakedAt) / (1000 * 60 * 60 * 24));
      
      // 등급 결정 (티어 배수에 따라)
      let nftTier = 'Common';
      if (onchainData.tierMultiplier >= 8) {
        nftTier = 'LEGENDARY';
      } else if (onchainData.tierMultiplier >= 4) {
        nftTier = 'EPIC';
      } else if (onchainData.tierMultiplier >= 2) {
        nftTier = 'RARE';
      }

      // 이미지 URL 생성 - 여러 형식 반환
      const imageUrlData = createImageUrl(nftId.toString());

      // 날짜 형식이 문자열인지 확인하고 변환
      const formatDate = (date) => {
        if (date instanceof Date) {
          return date.toISOString();
        }
        return date;
      };

      // 스테이킹 레코드 생성 또는 업데이트
      const stakingRecord = {
        mint_address: onchainData.nftMint,
        wallet_address: onchainData.owner,
        nft_id: nftId.toString(),
        nft_name: `SOLARA #${nftId}`,
        nft_tier: nftTier,
        staked_at: formatDate(onchainData.stakedAt),
        release_date: formatDate(onchainData.releaseTime),
        last_update: formatDate(onchainData.lastUpdateTime),
        staking_period: stakingPeriod,
        daily_reward_rate: onchainData.rewardRatePerDay,
        total_rewards: onchainData.rewardRatePerDay * stakingPeriod,
        status: onchainData.isUnstaked ? 'unstaked' : 'staked',
        image: imageUrlData.ipfs_url,         // ipfs:// 프로토콜 URL
        image_url: imageUrlData.ipfs_url,     // ipfs:// 프로토콜 URL (중복 저장)
        nft_image: imageUrlData.gateway_url,  // 게이트웨이 직접 URL
        ipfs_hash: imageUrlData.ipfs_hash     // 이미지 CID
      };

      // 스테이킹 테이블에 레코드 생성 또는 업데이트
      const { data, error } = await supabase
        .from('nft_staking')
        .upsert([stakingRecord], { onConflict: 'mint_address' })
        .select();

      if (error) {
        console.error('스테이킹 레코드 업데이트 실패:', error);
        throw error;
      }

      return { success: true, data };
    };

    // 지갑 주소로 온체인 스테이킹 정보 조회
    const getWalletStakingInfoFromChain = async (walletPubkey) => {
      // 유저 스테이킹 계정 PDA 계산
      const [userStakingInfoPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(USER_STAKING_SEED), walletPubkey.toBuffer()],
        programId
      );

      const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
      
      if (!userStakingInfoAccount) {
        return { stakes: [] };
      }

      // 사용자의 스테이킹된 NFT 민트 주소 목록 확인
      // (실제 코드는 바이너리 데이터 파싱이 필요하므로 여기서는 간단히 구현)
      
      // 모든 프로그램 계정을 가져와서 메모리에서 필터링
      const programAccounts = await connection.getProgramAccounts(programId);
      
      // 메모리에서 필터링 (계정 데이터의 구조에 따라)
      const filteredAccounts = [];
      for (const account of programAccounts) {
        try {
          const stakeInfo = decodeStakeInfo(account.account.data);
          if (stakeInfo && !stakeInfo.isUnstaked) {
            const owner = new PublicKey(stakeInfo.owner);
            if (owner.equals(walletPubkey)) {
              filteredAccounts.push(account);
            }
          }
        } catch (error) {
          console.log('계정 필터링 중 오류:', error);
        }
      }
      
      // 필터링된 계정 사용
      const allAccounts = filteredAccounts;

      // 스테이킹 계정 정보 추출
      const stakes = [];
      for (const account of allAccounts) {
        try {
          const stakeInfo = decodeStakeInfo(account.account.data);
          if (stakeInfo && !stakeInfo.isUnstaked) {
            // owner가 현재 지갑과 일치하는지 확인
            const owner = new PublicKey(stakeInfo.owner);
            if (owner.equals(walletPubkey)) {
              const nftMint = new PublicKey(stakeInfo.nftMint);
              stakes.push({
                pda: account.pubkey.toString(),
                nftMint: nftMint.toString(),
                owner: owner.toString(),
                stakedAt: solanaTimestampToDate(Number(stakeInfo.stakedAt)),
                lastUpdateTime: solanaTimestampToDate(Number(stakeInfo.lastUpdateTime)),
                releaseTime: solanaTimestampToDate(Number(stakeInfo.releaseTime)),
                rewardRatePerDay: Number(stakeInfo.rewardRatePerDay),
                accumulatedReward: Number(stakeInfo.accumulatedReward),
                tierMultiplier: stakeInfo.tierMultiplier,
                isUnstaked: stakeInfo.isUnstaked === 1
              });
            }
          }
        } catch (err) {
          console.error('스테이킹 계정 파싱 오류:', err);
        }
      }

      return { stakes };
    };

    // 액션 처리
    switch (action) {
      case 'test_auth': {
        return res.status(200).json({ success: true, message: '인증 성공' });
      }
      
      case 'check_discrepancies': {
        // 블록체인과 데이터베이스 사이의 불일치 확인
        const discrepancies = [];
        
        // 1. 데이터베이스에서 스테이킹된 NFT 목록 가져오기
        const { data: dbStakedNfts, error: dbError } = await supabase
          .from('nft_staking')
          .select('*')
          .eq('status', 'staked');
        
        if (dbError) {
          console.error('데이터베이스 스테이킹 정보 조회 실패:', dbError);
          return res.status(500).json({ error: 'Failed to fetch staking data from database' });
        }

        // 2. 각 NFT에 대해 블록체인 검증
        const missingOnChain = [];
        
        for (const dbNft of dbStakedNfts) {
          try {
            const mintPubkey = new PublicKey(dbNft.mint_address);
            const onchainData = await getStakeInfoFromChain(mintPubkey);
            
            // 블록체인에 없거나 이미 언스테이킹됨
            if (!onchainData || onchainData.isUnstaked) {
              missingOnChain.push(dbNft);
              discrepancies.push({
                ...dbNft,
                issue: 'missing_on_chain'
              });
            }
            
            // 이미지 URL 누락 체크
            if (!dbNft.image_url || !dbNft.image) {
              discrepancies.push({
                ...dbNft,
                issue: 'missing_image_url'
              });
            }
          } catch (err) {
            console.error(`NFT ${dbNft.mint_address} 온체인 검증 실패:`, err);
          }
        }

        // 3. 블록체인에서 모든 스테이킹된 NFT 가져오기 (제한된 수만)
        // 모든 프로그램 계정을 가져오기
        const programAccounts = await connection.getProgramAccounts(programId);
        
        // 메모리에서 필터링
        const allAccounts = programAccounts.filter(account => {
          try {
            const stakeInfo = decodeStakeInfo(account.account.data);
            return stakeInfo && stakeInfo.isInitialized === 1;
          } catch (error) {
            return false;
          }
        });

        // 계정이 너무 많으면 제한
        const ACCOUNT_LIMIT = 100;
        const limitedAccounts = allAccounts.slice(0, ACCOUNT_LIMIT);
        
        // 4. 데이터베이스에 누락된 항목 체크
        const missingInDatabase = [];
        
        for (const account of limitedAccounts) {
          try {
            // 전체 계정 데이터 가져오기
            const accountInfo = await connection.getAccountInfo(account.pubkey);
            const stakeInfo = decodeStakeInfo(accountInfo.data);
            
            if (stakeInfo && !stakeInfo.isUnstaked) {
              const nftMint = new PublicKey(stakeInfo.nftMint);
              const mintAddress = nftMint.toString();
              
              // 데이터베이스에서 이 NFT 검색
              const { data: dbRecord, error: dbLookupError } = await supabase
                .from('nft_staking')
                .select('*')
                .eq('mint_address', mintAddress)
                .eq('status', 'staked')
                .single();
              
              if (dbLookupError || !dbRecord) {
                // 온체인 데이터만 있음 - 데이터베이스에 누락됨
                const owner = new PublicKey(stakeInfo.owner);
                missingInDatabase.push({
                  mint_address: mintAddress,
                  wallet_address: owner.toString(),
                  staked_at: solanaTimestampToDate(stakeInfo.stakedAt.toNumber()),
                  release_date: solanaTimestampToDate(stakeInfo.releaseTime.toNumber())
                });
                
                discrepancies.push({
                  mint_address: mintAddress,
                  wallet_address: owner.toString(),
                  issue: 'missing_in_db'
                });
              }
            }
          } catch (err) {
            console.error('계정 검증 실패:', err);
          }
        }

        // 이미지 URL이 누락된 항목 체크
        const imageUrlMissing = dbStakedNfts.filter(nft => !nft.image_url || !nft.image);

        return res.status(200).json({
          success: true,
          totalChecked: limitedAccounts.length,
          missingInDatabase,
          missingOnChain,
          imageUrlMissing,
          discrepancies
        });
      }

      case 'sync_nft': {
        // 단일 NFT 동기화
        if (!mintAddress) {
          return res.status(400).json({ error: 'Mint address is required' });
        }

        // 민트 주소 확인
        let mintPubkey;
        try {
          mintPubkey = toPublicKey(mintAddress);
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }

        // 블록체인에서 스테이킹 정보 가져오기
        const onchainData = await getStakeInfoFromChain(mintPubkey);
        
        if (!onchainData || onchainData.error) {
          // 블록체인에서 데이터를 찾을 수 없음
          // 데이터베이스 레코드 삭제 또는 상태 업데이트
          const { data, error } = await supabase
            .from('nft_staking')
            .update({ status: 'unstaked' })
            .eq('mint_address', mintAddress)
            .select();
          
          if (error) {
            console.error('스테이킹 레코드 업데이트 실패:', error);
            return res.status(500).json({ 
              error: 'Failed to update database', 
              details: error.message 
            });
          }
          
          return res.status(200).json({
            success: true,
            message: 'NFT is not staked on-chain, marked as unstaked in database',
            data
          });
        }
        
        // 온체인 데이터가 unstaked인 경우 DB도 업데이트
        if (onchainData.isUnstaked) {
          const { data, error } = await supabase
            .from('nft_staking')
            .update({ status: 'unstaked' })
            .eq('mint_address', mintAddress)
            .select();
          
          if (error) {
            console.error('스테이킹 레코드 업데이트 실패:', error);
            return res.status(500).json({ 
              error: 'Failed to update database', 
              details: error.message 
            });
          }
          
          return res.status(200).json({
            success: true,
            message: 'NFT is unstaked on-chain, marked as unstaked in database',
            data
          });
        }
        
        // 온체인 데이터를 데이터베이스에 동기화
        try {
          const result = await upsertStakingRecord(onchainData);
          
          return res.status(200).json({
            success: true,
            message: 'NFT staking data synchronized successfully',
            onchainData,
            dbResult: result
          });
        } catch (err) {
          console.error('스테이킹 데이터 동기화 실패:', err);
          return res.status(500).json({ 
            error: 'Failed to synchronize staking data', 
            details: err.message 
          });
        }
      }

      case 'sync_wallet': {
        // 지갑의 모든 스테이킹 NFT 동기화
        if (!wallet) {
          return res.status(400).json({ error: 'Wallet address is required' });
        }

        try {
          // 헬퍼 함수를 사용하여 지갑의 모든 NFT 동기화
          const syncResult = await syncWalletNFTs(wallet);
          
          return res.status(200).json({
            success: true,
            message: syncResult.message,
            count: syncResult.count,
            total: syncResult.total || 0,
            results: syncResult.results
          });
        } catch (err) {
          return res.status(400).json({ 
            error: '지갑 동기화 실패',
            details: err.message
          });
        }
      }

      case 'sync_all': {
        // 모든 스테이킹 데이터 동기화 (제한된 수만)
        // 이 작업은 매우 리소스 집약적이므로 제한된 수에 대해서만 수행
        
        // 모든 프로그램 계정을 가져오기
        const programAccounts = await connection.getProgramAccounts(programId);
        
        // 메모리에서 필터링
        const allAccounts = programAccounts.filter(account => {
          try {
            const stakeInfo = decodeStakeInfo(account.account.data);
            return stakeInfo && stakeInfo.isInitialized === 1 && !stakeInfo.isUnstaked;
          } catch (error) {
            return false;
          }
        });
        
        // 계정이 너무 많으면 제한
        const ACCOUNT_LIMIT = 50;
        const limitedAccounts = allAccounts.slice(0, ACCOUNT_LIMIT);
        
        console.log(`${allAccounts.length} 개의 계정 중 ${limitedAccounts.length} 개 동기화 중...`);
        
        // 각 계정 처리
        const results = [];
        for (const account of limitedAccounts) {
          try {
            const stakeInfo = decodeStakeInfo(account.account.data);
            
            // 스테이킹된 NFT만 처리
            if (stakeInfo && !stakeInfo.isUnstaked) {
              const nftMint = new PublicKey(stakeInfo.nftMint);
              const owner = new PublicKey(stakeInfo.owner);
              
              const onchainData = {
                nftMint: nftMint.toString(),
                owner: owner.toString(),
                stakedAt: solanaTimestampToDate(Number(stakeInfo.stakedAt)),
                lastUpdateTime: solanaTimestampToDate(Number(stakeInfo.lastUpdateTime)),
                releaseTime: solanaTimestampToDate(Number(stakeInfo.releaseTime)),
                rewardRatePerDay: Number(stakeInfo.rewardRatePerDay),
                accumulatedReward: Number(stakeInfo.accumulatedReward),
                tierMultiplier: stakeInfo.tierMultiplier,
                isUnstaked: stakeInfo.isUnstaked === 1
              };
              
              // 온체인 데이터를 데이터베이스에 동기화
              const result = await upsertStakingRecord(onchainData);
              results.push({
                mint: nftMint.toString(),
                status: 'synchronized',
                result
              });
            }
          } catch (err) {
            console.error(`계정 ${account.pubkey.toString()} 처리 실패:`, err);
            results.push({
              account: account.pubkey.toString(),
              status: 'error',
              error: err.message
            });
          }
        }
        
        return res.status(200).json({
          success: true,
          message: `Synchronized ${results.filter(r => r.status === 'synchronized').length} NFTs`,
          total: allAccounts.length,
          processed: limitedAccounts.length,
          results
        });
      }

      case 'update_nft_metadata': {
        // NFT 메타데이터 업데이트 또는 생성
        if (!mintAddress) {
          return res.status(400).json({ error: 'Mint address is required' });
        }

        // 1. 스테이킹 정보 가져오기
        const { data: stakingData, error: stakingError } = await supabase
          .from('nft_staking')
          .select('*')
          .eq('mint_address', mintAddress)
          .single();
        
        if (stakingError) {
          return res.status(404).json({ 
            error: 'Staking record not found', 
            details: stakingError.message 
          });
        }

        // 2. minted_nfts 테이블에서 NFT 데이터 가져오기
        const { data: nftData, error: nftError } = await supabase
          .from('minted_nfts')
          .select('*')
          .eq('mint_address', mintAddress)
          .single();
        
        // NFT ID 추출 또는 생성
        let nftId;
        let needsNewMetadata = false;
        
        if (nftError) { // NFT 데이터가 없음
          // 스테이킹 데이터에서 ID 가져오기 또는 생성
          nftId = stakingData.nft_id || String(Math.floor(Math.random() * 999) + 1).padStart(4, '0');
          needsNewMetadata = true;
        } else {
          nftId = nftData.mint_index || nftData.id;
        }

        // 3. 이미지 URL 생성 - 여러 형식 반환
        const imageUrlData = createImageUrl(nftId.toString());
        
        // 4. 메타데이터 생성
        const metadata = {
          name: `SOLARA #${nftId}`,
          symbol: "SOLARA",
          description: "SOLARA NFT Collection",
          image: imageUrlData.ipfs_url, // ipfs:// 프로토콜 URL 사용
          attributes: [
            {
              trait_type: "Tier",
              value: stakingData.nft_tier || "Common"
            }
          ]
        };

        // 5. 스테이킹 테이블 업데이트
        const { data: updateResult, error: updateError } = await supabase
          .from('nft_staking')
          .update({
            image: imageUrlData.ipfs_url,         // ipfs:// 프로토콜 URL
            image_url: imageUrlData.ipfs_url,     // ipfs:// 프로토콜 URL (중복 저장)
            nft_image: imageUrlData.gateway_url,  // 게이트웨이 직접 URL
            nft_name: `SOLARA #${nftId}`,
            ipfs_hash: imageUrlData.ipfs_hash,    // 이미지 CID 
            metadata: metadata
          })
          .eq('mint_address', mintAddress)
          .select();
        
        if (updateError) {
          return res.status(500).json({ 
            error: 'Failed to update staking record', 
            details: updateError.message 
          });
        }

        // 6. minted_nfts 테이블 업데이트 또는 생성
        let mintedNftResult;
        
        if (needsNewMetadata) {
          // 새 레코드 생성
          const { data: insertResult, error: insertError } = await supabase
            .from('minted_nfts')
            .insert([{
              mint_address: mintAddress,
              wallet: stakingData.wallet_address,
              mint_index: nftId,
              name: `SOLARA #${nftId}`,
              image_url: imageUrlData.ipfs_url,
              nft_image: imageUrlData.gateway_url,
              ipfs_hash: imageUrlData.ipfs_hash,
              metadata: metadata,
              status: 'completed'
            }])
            .select();
          
          if (insertError) {
            console.error('minted_nfts 레코드 생성 실패:', insertError);
            // 스테이킹 업데이트는 성공했으므로 오류를 반환하지 않고 결과만 반환
          } else {
            mintedNftResult = insertResult;
          }
        } else {
          // 기존 레코드 업데이트
          const { data: updateNftResult, error: updateNftError } = await supabase
            .from('minted_nfts')
            .update({
              image_url: imageUrlData.ipfs_url,
              nft_image: imageUrlData.gateway_url,
              ipfs_hash: imageUrlData.ipfs_hash,
              metadata: metadata
            })
            .eq('mint_address', mintAddress)
            .select();
          
          if (updateNftError) {
            console.error('minted_nfts 레코드 업데이트 실패:', updateNftError);
          } else {
            mintedNftResult = updateNftResult;
          }
        }

        return res.status(200).json({
          success: true,
          message: 'NFT metadata updated successfully',
          nftId: nftId,
          imageUrl: imageUrlData.ipfs_url,
          gatewayUrl: imageUrlData.gateway_url,
          ipfsHash: imageUrlData.ipfs_hash,
          stakingUpdate: updateResult,
          mintedNftUpdate: mintedNftResult || null
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('동기화 API 오류:', error);
    return res.status(500).json({ 
      error: '동기화 작업 실패: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}