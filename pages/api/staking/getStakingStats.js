/**
 * /api/staking/getStakingStats.js - Staking Statistics API (Primary Endpoint)
 * 
 * IMPORTANT: This is the main canonical endpoint for staking statistics.
 * The legacy endpoint at /api/getStakingStats.js forwards requests here.
 * All new code should use this endpoint directly.
 * 
 * This API retrieves user's staking status, active staking list, and reward information:
 * - Fetches active staking entries
 * - Calculates progress and rewards for each staking entry
 * - Maps real NFT images and metadata
 * - Returns integrated statistics
 * 
 * Key Update on NFT ID Resolution (2025-05-14):
 * - Updated to use database-first approach for NFT ID resolution
 * - Supabase database is queried to get the original minted NFT ID
 * - Only falls back to hash-based IDs if database lookup fails
 * - Ensures NFT IDs match between minting and staking processes
 * - Added error handling for cases where NFT ID cannot be resolved
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getSupabase } from '../../../shared/utils/supabase';
import { createApiResponse, getErrorMessage } from '../../../shared/utils/error-handler';
import { SOLANA_RPC_ENDPOINT } from '../../../shared/constants/network';
import { getNFTData } from '../../../shared/utils/nft';
import { PROGRAM_ID } from '../../../shared/constants/program-ids';
import { findPoolStatePDA, findUserStakingInfoPDA } from '../../../shared/utils/pda';
import { resolveNftId } from '../../../utils/staking-helpers/nft-id-resolver';
import bs58 from 'bs58'; // base58 인코딩/디코딩 라이브러리

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json(
      createApiResponse(false, 'Method Not Allowed', null, 'Only GET requests are allowed')
    );
  }

  try {
    const { wallet, nocache } = req.query;
    
    // 필수 입력값 검증
    if (!wallet) {
      return res.status(400).json(
        createApiResponse(false, '지갑 주소가 필요합니다', null, 'Wallet address is required')
      );
    }
    
    // 캐시 방지 파라미터
    const cacheStr = nocache || Date.now();
    
    // 비동기 처리를 위한 변수 초기화
    let projectedRewards = 0;
    let earnedToDate = 0;
    
    // Supabase 클라이언트 초기화
    const supabase = getSupabase();
    
    // 활성 스테이킹 레코드 조회 - 온체인 스테이킹 데이터 우선
    console.log(`지갑 주소 ${wallet}의 온체인 스테이킹 정보 조회 중...`);

    // 1. 데이터베이스에서 스테이킹 레코드 조회
    let { data: stakingData, error: stakingError } = await supabase
      .from('nft_staking')
      .select('*, nft_tier')
      .eq('wallet_address', wallet)
      .eq('status', 'staked')
      .order('staked_at', { ascending: false });

    // 2. 온체인 데이터와 동기화 - UserStakingInfo PDA 조회
    let onChainStakingInfo = null;
    try {
      // Solana 연결 설정
      const connection = new Connection(SOLANA_RPC_ENDPOINT);
      const walletPubkey = new PublicKey(wallet);
      
      // UserStakingInfo PDA 계산
      const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);
      console.log(`UserStakingInfo PDA: ${userStakingInfoPDA.toString()}`);
      
      // 온체인 계정 정보 조회
      const userStakingAccount = await connection.getAccountInfo(userStakingInfoPDA);
      
      // 계정이 존재하면 스테이킹 정보 있음
      if (userStakingAccount && userStakingAccount.data.length > 0) {
        console.log(`온체인 스테이킹 계정이 존재합니다. 크기: ${userStakingAccount.data.length} 바이트`);
        onChainStakingInfo = userStakingAccount;
      } else {
        console.log(`온체인 스테이킹 계정이 존재하지 않습니다.`);
      }
    } catch (onChainError) {
      console.warn(`온체인 스테이킹 정보 조회 중 오류: ${onChainError.message}`);
    }
    
    if (stakingError) {
      console.error('스테이킹 데이터 조회 오류:', stakingError);
      return res.status(500).json(
        createApiResponse(false, '스테이킹 데이터 조회에 실패했습니다', null, getErrorMessage(stakingError))
      );
    }
    
    // NFT 데이터 조회를 위한 민트 주소 추출
    let mintAddresses = [];
    
    // 데이터베이스 스테이킹 데이터와 온체인 데이터 통합
    if (onChainStakingInfo && (!stakingData || stakingData.length === 0)) {
      console.log(`데이터베이스에 스테이킹 정보가 없지만 온체인 데이터가 존재합니다. 온체인 데이터 동기화 시도...`);
      
      try {
        // 온체인 스테이킹 정보가 있지만 DB에 없는 경우, 온체인 기반으로 PDA 조회
        const connection = new Connection(SOLANA_RPC_ENDPOINT);
        const walletPubkey = new PublicKey(wallet);
        
        // 1. 먼저 풀 상태 PDA 조회
        const [poolStatePDA] = findPoolStatePDA();
        const poolStateInfo = await connection.getAccountInfo(poolStatePDA);
        
        if (poolStateInfo && poolStateInfo.data.length > 0) {
          console.log(`풀 상태 계정이 존재합니다.`);
          
          // 2. StakeInfo 계정을 찾기 위해 프로그램 계정 조회
          // DISCRIMINATOR 값을 직접 사용하여 검색
          const stakeInfoDiscriminator = Buffer.from([66, 62, 68, 70, 108, 179, 183, 235]); // STAKE_INFO discriminator

          // base58 인코딩으로 변환
          const stakeInfoDiscriminatorBase58 = bs58.encode(stakeInfoDiscriminator);
          console.log(`스테이크 계정 discriminator base58: ${stakeInfoDiscriminatorBase58}`);

          // 특정 시드와 일치하는 모든 계정 필터링
          const programAccounts = await connection.getProgramAccounts(
            new PublicKey(PROGRAM_ID),
            {
              filters: [
                {
                  memcmp: {
                    offset: 0, // 계정 데이터 시작 부분의 discriminator 확인
                    bytes: stakeInfoDiscriminatorBase58 // 정확한 base58 인코딩 값 사용
                  }
                }
              ]
            }
          );
          
          console.log(`프로그램 계정 ${programAccounts.length}개 발견`);
          
          // 3. 필터링된 계정 중 사용자의 지갑을 소유자로 가진 계정 검색
          const userStakeAccounts = [];

          for (const account of programAccounts) {
            try {
              // 계정 데이터 추출
              const data = account.account.data;
              console.log(`계정 데이터 길이: ${data.length} 바이트`);

              // 검증: 8바이트 discriminator 확인
              const discriminator = data.slice(0, 8);
              console.log(`계정 discriminator: ${Buffer.from(discriminator).toString('hex')}`);

              // 계정 데이터에서 소유자 필드 추출 (첫 8바이트 이후 32바이트)
              const ownerPubkeyBytes = data.slice(8, 8 + 32);
              const ownerPubkey = new PublicKey(ownerPubkeyBytes);

              console.log(`계정 소유자: ${ownerPubkey.toString()}`);
              console.log(`비교 대상 지갑: ${walletPubkey.toString()}`);

              // 소유자 비교
              if (ownerPubkey.equals(walletPubkey)) {
                console.log(`일치하는 계정 발견!`);
                userStakeAccounts.push(account);
              }
            } catch (e) {
              console.error('계정 처리 오류:', e.message);
            }
          }
          
          console.log(`사용자의 스테이크 계정 ${userStakeAccounts.length}개 발견`);
          
          // 4. 발견된 스테이크 계정에서 NFT 민트 주소 추출
          for (const account of userStakeAccounts) {
            try {
              // 개선된 계정 데이터 파싱
              const data = account.account.data;

              // StakeInfo 계정 구조 분석:
              // 0-8: discriminator (8 bytes)
              // 8-40: owner (32 bytes)
              // 40-72: mintAddress (32 bytes)

              // 계정 데이터에서 NFT 민트 주소 필드 추출 (owner 다음 필드)
              const mintPubkeyBytes = data.slice(40, 40 + 32);
              const mintPubkey = new PublicKey(mintPubkeyBytes);
              console.log(`온체인에서 스테이킹된 NFT 민트 발견: ${mintPubkey.toString()}`);

              // 임시 스테이킹 데이터 생성
              if (!stakingData) stakingData = [];

              // 기존 스테이킹 레코드에 이미 있는지 확인
              const existingStake = stakingData.find(item =>
                item.mint_address && item.mint_address === mintPubkey.toString()
              );
              
              // 중복이 아닌 경우에만 추가
              if (!existingStake) {
                console.log(`새로운 온체인 스테이킹 레코드 추가: ${mintPubkey.toString()}`);
                
                // 계정 데이터에서 추가 정보 추출
                // StakeInfo 계정 구조 계속:
                // 72-80: stakedAt (i64 - 8 bytes)
                // 80-88: releaseDate (i64 - 8 bytes)
                // 88-89: isStaked (bool - 1 byte)

                // 타임스탬프 추출 (BigInt로 읽음)
                const stakedAt = data.readBigInt64LE(72);
                const releaseDate = data.readBigInt64LE(80);
                const isStaked = data[88] === 1;

                console.log(`계정 타임스탬프 - 스테이킹: ${Number(stakedAt)}, 해제: ${Number(releaseDate)}, 스테이킹 상태: ${isStaked}`);

                // 스테이킹 기간 계산 (일)
                const stakingPeriod = Math.round((Number(releaseDate) - Number(stakedAt)) / (24 * 60 * 60));
                console.log(`계산된 스테이킹 기간: ${stakingPeriod}일`);

                // 타임스탬프 검증 및 조정
                let validatedStakedAt, validatedReleaseDate;

                try {
                  // 타임스탬프가 유효한지 확인하고 필요시 조정
                  // Unix 타임스탬프는 초 단위지만 JavaScript Date는 밀리초 단위 사용
                  const stakedAtNum = Number(stakedAt);
                  const releaseDateNum = Number(releaseDate);

                  // 자세한 검증 로그
                  console.log(`계정 타임스탬프 검증 - stakedAtNum: ${stakedAtNum}, releaseDateNum: ${releaseDateNum}`);
                  console.log(`현재 시간(초): ${Date.now() / 1000}, 비교 상한값: ${Date.now() / 1000 * 10}`);

                  // Solana 타임스탬프는 초 단위이므로 밀리초 단위로 변환 필요
                  // 유효성 검증 - 범위 확인 (0 < 타임스탬프 < 현재 시간의 10배)
                  if (stakedAtNum > 0 && stakedAtNum < Date.now() / 1000 * 10) {
                    try {
                      validatedStakedAt = new Date(stakedAtNum * 1000);
                      console.log(`유효한 스테이킹 타임스탬프: ${stakedAtNum} -> ${validatedStakedAt.toISOString()}`);
                    } catch (dateError) {
                      console.error(`날짜 변환 오류 (stakedAt): ${dateError.message}`);
                      // 오류 복구: 현재 시간에서 1일 전으로 설정
                      validatedStakedAt = new Date();
                      validatedStakedAt.setDate(validatedStakedAt.getDate() - 1);
                    }
                  } else {
                    console.log(`비정상 타임스탬프 감지, 현재 시간으로 대체: ${stakedAtNum}`);
                    validatedStakedAt = new Date();
                    validatedStakedAt.setDate(validatedStakedAt.getDate() - 1); // 1일 전으로 설정
                  }

                  // 릴리즈 날짜도 동일한 방식으로 검증
                  if (releaseDateNum > 0 && releaseDateNum > Date.now() / 1000) {
                    try {
                      validatedReleaseDate = new Date(releaseDateNum * 1000);
                      console.log(`유효한 릴리즈 타임스탬프: ${releaseDateNum} -> ${validatedReleaseDate.toISOString()}`);
                    } catch (dateError) {
                      console.error(`날짜 변환 오류 (releaseDate): ${dateError.message}`);
                      // 오류 복구: 스테이킹 시간 + 30일로 설정
                      validatedReleaseDate = new Date(validatedStakedAt.getTime());
                      validatedReleaseDate.setDate(validatedReleaseDate.getDate() + 30);
                    }
                  } else {
                    console.log(`비정상 릴리즈 타임스탬프 감지, 현재+30일로 대체: ${releaseDateNum}`);
                    validatedReleaseDate = new Date(validatedStakedAt.getTime());
                    validatedReleaseDate.setDate(validatedReleaseDate.getDate() + 30); // 30일 후로 설정
                  }

                  console.log(`검증된 타임스탬프 - 스테이킹: ${validatedStakedAt.toISOString()}, 릴리즈: ${validatedReleaseDate.toISOString()}`);

                } catch (timeError) {
                  console.error(`타임스탬프 변환 오류: ${timeError.message}`);
                  // 오류 발생 시 강제로 현재 시간 기반으로 설정
                  validatedStakedAt = new Date();
                  validatedStakedAt.setDate(validatedStakedAt.getDate() - 1); // 1일 전
                  validatedReleaseDate = new Date();
                  validatedReleaseDate.setDate(validatedReleaseDate.getDate() + 30); // 30일 후
                }

                // 데이터베이스 동기화를 위한 향상된 객체 생성
                const newStake = {
                  id: `onchain_${mintPubkey.toString().substring(0, 8)}`,
                  wallet_address: wallet,
                  mint_address: mintPubkey.toString(),
                  status: isStaked ? 'staked' : 'unstaked',
                  staked_at: validatedStakedAt.toISOString(), // 검증된 시간 사용
                  release_date: validatedReleaseDate.toISOString(), // 검증된 시간 사용
                  staking_period: stakingPeriod,
                  nft_tier: 'COMMON', // 기본 등급 (나중에 메타데이터에서 업데이트)
                  daily_reward_rate: Math.max(25, Math.round(stakingPeriod)), // 기본 보상률 (최소 25)
                  total_rewards: Math.max(25, Math.round(stakingPeriod)) * stakingPeriod, // 일일 보상 * 기간
                  earned_so_far: Math.round(Math.max(25, Math.round(stakingPeriod)) *
                    ((Date.now()/1000) - validatedStakedAt.getTime()/1000) / (24 * 60 * 60)), // 경과 일수만큼
                  source: 'onchain', // 출처 표시
                };
                
                stakingData.push(newStake);
                
                // 데이터베이스에 임시 스테이킹 레코드 추가 시도
                try {
                  // transaction_signature 필드가 없는 경우 처리
                  try {
                    // 먼저 테이블 스키마에 tx_signature 필드가 있는지 확인
                    const hasTxSignatureField = await supabase
                      .from('nft_staking')
                      .select('tx_signature')
                      .limit(1)
                      .maybeSingle();

                    // 필드가 있으면 tx_signature 포함
                    if (!hasTxSignatureField.error) {
                      const { error: insertError } = await supabase
                        .from('nft_staking')
                        .upsert([{
                          wallet_address: wallet,
                          mint_address: mintPubkey.toString(),
                          status: 'staked',
                          staked_at: validatedStakedAt.toISOString(),
                          release_date: validatedReleaseDate.toISOString(),
                          staking_period: 30,
                          nft_tier: 'COMMON',
                          daily_reward_rate: 25,
                          total_rewards: 750,
                          tx_signature: 'onchain_sync_' + Date.now().toString()
                        }]);
                    } else {
                      // 필드가 없으면 tx_signature 제외
                      const { error: insertError } = await supabase
                        .from('nft_staking')
                        .upsert([{
                          wallet_address: wallet,
                          mint_address: mintPubkey.toString(),
                          status: 'staked',
                          staked_at: validatedStakedAt.toISOString(),
                          release_date: validatedReleaseDate.toISOString(),
                          staking_period: 30,
                          nft_tier: 'COMMON',
                          daily_reward_rate: 25,
                          total_rewards: 750
                        }]);
                    }
                  } catch (schemaError) {
                    // 스키마 확인 중 오류 발생 시 tx_signature 없이 시도
                    console.warn(`스키마 확인 오류. tx_signature 없이 시도: ${schemaError.message}`);
                    const { error: insertError } = await supabase
                      .from('nft_staking')
                      .upsert([{
                        wallet_address: wallet,
                        mint_address: mintPubkey.toString(),
                        status: 'staked',
                        staked_at: validatedStakedAt.toISOString(),
                        release_date: validatedReleaseDate.toISOString(),
                        staking_period: 30,
                        nft_tier: 'COMMON',
                        daily_reward_rate: 25,
                        total_rewards: 750
                      }]);
                  }
                    
                  // 삽입 결과는 내부 try-catch 블록 내에서 처리됨
                  console.log(`온체인 스테이킹 데이터를 DB에 성공적으로 삽입 시도: ${mintPubkey.toString()}`);
                
                } catch (dbError) {
                  console.warn(`스테이킹 레코드 DB 삽입 중 예외:`, dbError);
                }
              } else {
                console.log(`이미 데이터베이스에 레코드가 있는 민트: ${mintPubkey.toString()}. 스킵.`);
              }
              
              // 민트 주소 추가
              mintAddresses.push(mintPubkey.toString());
            } catch (e) {
              console.warn(`계정 데이터 파싱 오류: ${e.message}`);
            }
          }
        }
      } catch (syncError) {
        console.error(`온체인 데이터 동기화 오류: ${syncError.message}`);
      }
    } else {
      // 정상적인 경우 - 데이터베이스에서 민트 주소 추출
      mintAddresses = stakingData ? stakingData.map(stake => stake.mint_address).filter(Boolean) : [];
    }
    
    console.log(`${mintAddresses.length}개의 민트 주소를 조회합니다`);
    
    // 민트 주소별 NFT 데이터 매핑
    let nftDataByMint = {};
    
    if (mintAddresses.length > 0) {
      try {
        // 먼저 테이블 스키마에 metadata 필드가 있는지 확인
        const hasMetadataField = await supabase
          .from('minted_nfts')
          .select('metadata')
          .limit(1)
          .maybeSingle()
          .then(res => !res.error)
          .catch(() => false);

        console.log(`minted_nfts 테이블에 metadata 필드가 있는지 확인: ${hasMetadataField}`);

        // 스키마에 따라 필드 선택 조정
        let query;
        if (hasMetadataField) {
          // metadata 필드가 있으면 모든 필드 포함
          query = supabase
            .from('minted_nfts')
            .select('*, metadata')
            .in('mint_address', mintAddresses);
        } else {
          // metadata 필드가 없으면 제외
          query = supabase
            .from('minted_nfts')
            .select('*')
            .in('mint_address', mintAddresses);
        }

        // 데이터 조회 실행
        const { data: nftData, error: nftError } = await query;

        if (!nftError && nftData) {
          console.log(`${nftData.length}개의 NFT 정보를 minted_nfts 테이블에서 찾았습니다`);

          // 디버깅 정보 로깅
          nftData.forEach(nft => {
            console.log(`NFT ${nft.mint_index || nft.id} 상세 정보:`, {
              has_image_url: !!nft.image_url,
              image_url_type: nft.image_url ? (nft.image_url.startsWith('ipfs://') ? 'ipfs' :
                                             (nft.image_url.startsWith('/') ? 'local' : 'other')) : 'none',
              has_metadata: !!nft.metadata,
              metadata_img: nft.metadata?.image ? 'yes' : 'no'
            });
          });

          // 민트 주소별 조회 매핑 생성
          nftDataByMint = nftData.reduce((acc, nft) => {
            if (nft.mint_address) {
              acc[nft.mint_address] = nft;
            }
            return acc;
          }, {});
        } else if (nftError) {
          console.error('NFT 데이터 조회 오류:', nftError);

          // metadata 컬럼 없이 다시 시도
          if (nftError.code === '42703' && nftError.message?.includes('metadata')) {
            console.log('metadata 컬럼 오류로 인해 metadata 제외하고 다시 시도');

            const { data: fallbackData, error: fallbackError } = await supabase
              .from('minted_nfts')
              .select('id, mint_address, name, image_url, mint_index, image, ipfs_hash')
              .in('mint_address', mintAddresses);

            if (!fallbackError && fallbackData) {
              console.log(`대체 쿼리로 ${fallbackData.length}개의 NFT 정보를 찾았습니다`);

              // 민트 주소별 조회 매핑 생성
              nftDataByMint = fallbackData.reduce((acc, nft) => {
                if (nft.mint_address) {
                  // metadata 필드가 없으므로 빈 객체 추가
                  nft.metadata = {};
                  acc[nft.mint_address] = nft;
                }
                return acc;
              }, {});
            } else {
              console.error('대체 쿼리 오류:', fallbackError);
            }
          }
        }
      } catch (schemaError) {
        console.error('스키마 확인 중 오류 발생:', schemaError);

        // 오류가 발생해도 기본 필드로 시도
        try {
          console.log('기본 필드만으로 NFT 데이터 조회 시도');
          const { data: simpleData, error: simpleError } = await supabase
            .from('minted_nfts')
            .select('id, mint_address, name, image_url, mint_index')
            .in('mint_address', mintAddresses);

          if (!simpleError && simpleData) {
            console.log(`단순 쿼리로 ${simpleData.length}개의 NFT 정보를 찾았습니다`);

            // 민트 주소별 조회 매핑 생성
            nftDataByMint = simpleData.reduce((acc, nft) => {
              if (nft.mint_address) {
                // metadata 필드가 없으므로 빈 객체 추가
                nft.metadata = {};
                acc[nft.mint_address] = nft;
              }
              return acc;
            }, {});
          }
        } catch (fallbackError) {
          console.error('단순 쿼리 시도 중 오류 발생:', fallbackError);
        }
      }
    }
    
    // 스테이킹 데이터 처리 및 계산
    const currentDate = new Date();
    
    // 스테이킹 데이터 처리를 위한 비동기 함수
    const processStakingData = async (stakingData) => {
      console.log(`스테이킹 데이터 처리 시작: ${stakingData.length}개 항목`);
      
      // 비동기 처리를 위한 Promise.all 사용
      const processedStakes = await Promise.all(stakingData.map(async (stake) => {
        const stakingStartDate = new Date(stake.staked_at);
        const releaseDate = new Date(stake.release_date);
        
        // 총 스테이킹 기간 계산 (밀리초)
        const totalStakingDuration = releaseDate.getTime() - stakingStartDate.getTime();
        
        // 경과 기간 계산 (총 기간으로 제한)
        const elapsedDuration = Math.min(
          currentDate.getTime() - stakingStartDate.getTime(),
          totalStakingDuration
        );
        
        // 진행률 계산
        const progressPercentage = (elapsedDuration / totalStakingDuration) * 100;
        
        // 현재까지 획득한 보상 계산
        const earnedSoFar = (stake.total_rewards * progressPercentage) / 100;
        
        // 총계에 추가 (비동기 처리에서는 이 방법으로 합산하지 않고 나중에 따로 처리)
        // 이 값들은 함수 범위 바깥의 변수 참조이므로 개별 스테이크 처리 후 따로 계산
        
        // 남은 일수 계산
        const daysRemaining = Math.max(0, Math.ceil((releaseDate - currentDate) / (1000 * 60 * 60 * 24)));
        
        // 스테이킹 기간 완료 여부
        const isUnlocked = currentDate >= releaseDate;
        
        // 경과 일수 계산
        const daysElapsed = Math.min(
          Math.ceil(elapsedDuration / (1000 * 60 * 60 * 24)),
          stake.staking_period
        );
        
        // 실제 NFT 데이터 확인
        const actualNft = nftDataByMint[stake.mint_address];
        
        // 온체인 데이터 기반으로 NFT ID 결정 방식으로 변경
        // 데이터베이스 조회를 통해 실제 민팅된 NFT ID를 가져옴
        // 비동기 함수 호출에 await 추가
        const resolvedNftId = await resolveNftId(stake.mint_address);
        
        // 데이터베이스에서 찾은 실제 NFT ID 사용
        const nftId = resolvedNftId;
        
        console.log(`Processing stake for mint: ${stake.mint_address} -> resolved NFT ID: ${resolvedNftId}`);
        console.log(`온체인 민트 주소 기반 NFT ID 해결: ${stake.mint_address} -> ${resolvedNftId}`);
      
      // 이미지 URL 관련 변수 초기화
      let nftImageUrl = null;
      let ipfsHash = null;
      let ipfsUrl = null;
      let gatewayUrl = null;
      let previewImage = null;
      
      // 실제 NFT 데이터가 있는 경우
      if (actualNft) {
        console.log(`민트 주소 ${stake.mint_address}의 실제 NFT 데이터를 찾았습니다`);
        
        // 이미지 URL 설정 (image_url 필드)
        if (actualNft.image_url) {
          nftImageUrl = actualNft.image_url;
          console.log(`데이터베이스의 실제 image_url 사용: ${nftImageUrl}`);
          
          // IPFS URL 처리
          if (nftImageUrl.startsWith('ipfs://')) {
            ipfsUrl = nftImageUrl;
            
            // IPFS 해시 추출
            const hashParts = ipfsUrl.replace('ipfs://', '').split('/');
            ipfsHash = hashParts[0];
            
            // 파일 경로 추출
            const filePath = '/' + (hashParts.slice(1).join('/') || '');
            
            // 게이트웨이 URL 생성
            gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}${filePath}`;
            console.log(`게이트웨이 URL 생성: ${gatewayUrl}, IPFS URL: ${ipfsUrl}`);
          }
          // 이미 게이트웨이 URL인 경우
          else if (nftImageUrl.includes('/ipfs/')) {
            gatewayUrl = nftImageUrl;
            
            // IPFS URL 역으로 생성
            const parts = gatewayUrl.split('/ipfs/');
            if (parts.length > 1) {
              ipfsHash = parts[1].split('/')[0];
              ipfsUrl = `ipfs://${parts[1]}`;
            }
          }
        }
        // 메타데이터에서 이미지 URL 추출
        else if (actualNft.metadata?.image) {
          nftImageUrl = actualNft.metadata.image;
          console.log(`메타데이터의 이미지 URL 사용: ${nftImageUrl}`);
          
          if (nftImageUrl.startsWith('ipfs://')) {
            ipfsUrl = nftImageUrl;
            ipfsHash = ipfsUrl.replace('ipfs://', '').split('/')[0];
            
            // 파일 경로 추출 및 게이트웨이 URL 생성
            const filePath = ipfsUrl.replace(`ipfs://${ipfsHash}`, '') || '/';
            gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}${filePath}`;
          }
        }
        // NFT 인덱스로 이미지 경로 생성
        else if (actualNft.mint_index) {
          const formattedId = String(actualNft.mint_index).padStart(4, '0');
          nftImageUrl = `/nft-images/${formattedId}.png`;
          console.log(`mint_index에서 생성된 이미지 경로 사용: ${nftImageUrl}`);
        }
      }
      
      // 항상 일관된 IPFS URL 생성
      const COLLECTION_IPFS_HASH = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
      ipfsHash = COLLECTION_IPFS_HASH;
      
      // resolvedNftId(이미 위에서 결정)로 일관된 URL 생성
      ipfsUrl = `ipfs://${ipfsHash}/${resolvedNftId}.png`;
      gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsHash}/${resolvedNftId}.png?_forcereload=true&_t=${Date.now()}`;
      
      console.log(`온체인 기반 URL 생성: ${ipfsUrl}`);
      console.log(`게이트웨이 URL: ${gatewayUrl}`);
      
      // 항상 일관된 URL 사용을 위해 기존 URL 무시하고 새로 생성한 URL 사용
      nftImageUrl = ipfsUrl;
      
      // 실제 NFT 데이터가 있는 경우 디버깅 정보 출력
      if (actualNft) {
        console.log(`참고: 데이터베이스 원본 정보 - ID: ${actualNft.id}, 민트 인덱스: ${actualNft.mint_index}`);
        if (actualNft.image_url) {
          console.log(`참고: 원래 이미지 URL: ${actualNft.image_url} (온체인 해결로 대체됨)`);
        }
      }
      
      // 로컬 이미지를 실제 IPFS URL로 변환 (플레이스홀더가 아닌 실제 URL 생성)
      const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
      
      // 항상 resolvedNftId 사용 (이미 위에서 결정론적으로 계산됨)
      // string ID에서 숫자만 추출
      const numericId = parseInt(String(resolvedNftId).replace(/\D/g, '') || '1');
      
      console.log(`숫자 ID 기반 포맷팅: ${resolvedNftId} (숫자 추출 결과: ${numericId})`);
      previewImage = `/nft-previews/${previewImages[Math.abs(numericId % previewImages.length)]}`;
      console.log(`선택된 프리뷰 이미지: ${previewImage}`);

      // 항상 일관된 온체인 기반 ID 사용 확인
      
      // 실제 NFT 데이터가 있으면 이름 및 기타 세부 정보 포함
      // resolvedNftId 사용하여 일관성 보장
      const nftName = actualNft?.name || stake.nft_name || `SOLARA #${resolvedNftId}`;
      const nftTier = actualNft?.metadata?.attributes?.find(attr => 
        attr.trait_type?.toLowerCase() === 'tier' || attr.trait_type?.toLowerCase() === 'rarity'
      )?.value || stake.nft_tier || 'Common';
      
      // 계산된 필드가 추가된 스테이킹 정보 반환
      // 최종 반환 전에 null 확인 - null이면 Image load failed 처리
      if (!resolvedNftId) {
        console.error(`[getStakingStats] 오류: NFT ID를 찾을 수 없음 (mint=${stake.mint_address})`);
        return {
          ...stake,
          // 이미지 오류 상태 표시
          image_error: true,
          _debug_source: "id_resolution_failed",
          progress_percentage: parseFloat(progressPercentage.toFixed(2)),
          earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
          days_remaining: daysRemaining,
          days_elapsed: daysElapsed,
          is_unlocked: isUnlocked,
          current_apy: calculateCurrentAPY(stake),
        };
      }
      
      // 정상적으로 ID 찾은 경우
      // 온체인 스테이크 계정에서 티어 정보 확인
      let tierMultiplier = 1; // 기본값
      
      try {
        // 스테이크 PDA 계산 후 계정 정보 확인
        if (stake.mint_address) {
          const mintPubkey = new PublicKey(stake.mint_address);
          
          // 스테이크 PDA 계산
          const [stakePDA] = findStakeInfoPDA(mintPubkey);
          console.log(`Tier 확인을 위한 스테이크 PDA: ${stakePDA.toString()} (민트: ${stake.mint_address})`);
          
          // 스테이크 계정 조회
          const connection = new Connection(SOLANA_RPC_ENDPOINT);
          const stakeAccount = await connection.getAccountInfo(stakePDA);
          
          if (stakeAccount) {
            console.log(`Tier 조회: 스테이크 계정 발견: ${stakeAccount.data.length} 바이트`);
            
            try {
              // Anchor discriminator 건너뛰기 (8바이트)
              const ACCOUNT_DISCRIMINATOR_SIZE = 8;
              const stakeData = stakeAccount.data.slice(ACCOUNT_DISCRIMINATOR_SIZE);
              
              // 계정 구조 참고: tier 값은 바이트 81에 위치 (owner 32, mint 32, stakedAt 8, releaseDate 8, isStaked 1)
              const tierByte = stakeData[81]; // u8은 1바이트
              console.log(`온체인 tier 값: ${tierByte} (민트: ${stake.mint_address})`);
              
              // tier_multiplier 계산 (확인된 매핑 사용)
              // 온체인 tier 값: 0 = Common, 1 = Rare, 2 = Epic, 3 = Legendary
              switch(tierByte) {
                case 1: tierMultiplier = 2; break; // Rare
                case 2: tierMultiplier = 4; break; // Epic
                case 3: tierMultiplier = 8; break; // Legendary
                default: tierMultiplier = 1; // Common
              }
              
              console.log(`온체인 tier 값 ${tierByte}에서 multiplier ${tierMultiplier}로 계산 (민트: ${stake.mint_address})`);
            } catch (parseErr) {
              console.warn(`스테이크 계정 파싱 오류: ${parseErr.message}`);
              // 기본값 1 유지
            }
          }
        }
      } catch (err) {
        console.warn(`온체인 tier 조회 실패: ${err.message}`);
        // 기본값 1 유지
      }
      
      return {
        ...stake,
        // 기존 ID 덮어쓰기 - 온체인에서 결정론적으로 생성된 ID 우선
        id: parseInt(resolvedNftId),
        nft_id: resolvedNftId,
        staked_nft_id: resolvedNftId,
        
        // 온체인에서 가져온 tier_multiplier 추가 - 클라이언트에서 티어 계산에 사용
        tier_multiplier: tierMultiplier,
        
        progress_percentage: parseFloat(progressPercentage.toFixed(2)),
        earned_so_far: parseFloat(earnedSoFar.toFixed(2)),
        days_remaining: daysRemaining,
        days_elapsed: daysElapsed,
        is_unlocked: isUnlocked,
        current_apy: calculateCurrentAPY(stake),
        
        // 실제 NFT 데이터에서 가져온 NFT 세부 정보
        nft_name: nftName,
        nft_tier: nftTier,
        
        // 이미지 필드 통합 처리 - 일관된 URL 사용
        ipfs_hash: ipfsHash,
        // 항상 resolvedNftId 기반 이미지 URL 사용
        image: `ipfs://${ipfsHash}/${resolvedNftId}.png`,
        image_url: `ipfs://${ipfsHash}/${resolvedNftId}.png`,
        nft_image: `https://tesola.mypinata.cloud/ipfs/${ipfsHash}/${resolvedNftId}.png?_forcereload=true&_t=${Date.now()}`,
        
        // 디버깅 정보
        _debug_image_source: "resolved_id_based", // 온체인 ID 기반 소스로 변경
        _original_db_id: stake.id, // 디버깅용으로 원래 DB ID 유지
        
        // 실제 NFT 데이터 사용 여부 플래그
        using_actual_nft_data: !!actualNft,
        
        // 추가 API 소비자를 위한 메타데이터
        metadata: actualNft?.metadata || {
          name: nftName,
          attributes: [
            { trait_type: "Tier", value: nftTier }
          ],
          image: `ipfs://${ipfsHash}/${resolvedNftId}.png`
        }
      };
    }));
      
    // 이 부분에서 집계하는 코드는 외부 함수에서 processedStakes 반환 후 계산하도록 수정
    // 현재 위치에서의 계산은 제거 (함수 반환 후 상위 스코프에서 계산)
    
    return processedStakes;
  };
  
  // 온체인 데이터에서 찾은 민트 주소 목록 변수 추출 (디버깅용)
  // 이미 위에서 정의된 mintAddresses가 온체인 데이터에서 가져온 민트 주소 목록임
  console.log(`온체인에서 검증된 민트 주소 목록 (${mintAddresses.length}개):`, mintAddresses);
  
  // 데이터베이스 스테이킹 데이터가 온체인 데이터와 일치하는지 확인
  if (stakingData && stakingData.length > 0) {
    // 데이터베이스에 있는 레코드 중 온체인 데이터에 없는 레코드 필터링
    // 온체인과 불일치하는 스테이킹 레코드를 찾음
    const invalidRecords = stakingData.filter(record => 
      !mintAddresses.includes(record.mint_address)
    );
    
    if (invalidRecords.length > 0) {
      console.log(`데이터베이스에 온체인과 일치하지 않는 ${invalidRecords.length}개의 레코드가 있습니다`);
      invalidRecords.forEach(record => {
        console.log(`불일치 레코드: ID=${record.id}, 민트=${record.mint_address}, 상태=${record.status}`);
      });
      
      // 온체인 데이터와 일치하는 레코드만 필터링
      const validRecords = stakingData.filter(record => 
        mintAddresses.includes(record.mint_address)
      );
      
      console.log(`불일치 레코드 제거 후 ${validRecords.length}개의 유효한 스테이킹 레코드를 사용합니다`);
      
      // 필터링된 레코드만 사용
      stakingData = validRecords;
    }
  }
  
  // 비동기 처리를 위한 호출 - processStakingData 함수 사용
  const activeStakes = stakingData && stakingData.length > 0 ? 
    await processStakingData(stakingData) : [];
    
  // 집계 값 다시 계산 - activeStakes의 모든 항목에서 집계
  // 이 부분은 processStakingData 함수 내부에서도 계산되지만, 
  // 여기서 다시 계산하여 확실하게 처리
  projectedRewards = 0;
  earnedToDate = 0;
  
  activeStakes.forEach(stake => {
    projectedRewards += parseFloat(stake.total_rewards || 0);
    earnedToDate += parseFloat(stake.earned_so_far || 0);
  });
    
  // 소수점 값 포맷팅
  projectedRewards = parseFloat(projectedRewards.toFixed(2));
  earnedToDate = parseFloat(earnedToDate.toFixed(2));
    
  // 실제 스테이킹 데이터만 반환 - 모의 데이터 비활성화
  if (activeStakes.length === 0) {
    console.log('스테이킹된 NFT가 없습니다');

    return res.status(200).json(
      createApiResponse(true, '스테이킹된 NFT가 없습니다', {
        activeStakes: [],
        stats: {
          totalStaked: 0,
          projectedRewards: 0,
          earnedToDate: 0
        },
        fetchTime: new Date().toISOString()
      })
    );
  }
    
  // 데이터 샘플 로깅
  if (activeStakes && activeStakes.length > 0) {
    console.log('getStakingStats API - 일관된 NFT ID 기반 정보:', {
      resolved_nft_id: activeStakes[0].nft_id,
      mint_address: activeStakes[0].mint_address,
      ipfs_image: activeStakes[0].image,
      gateway_url: activeStakes[0].nft_image
    });
      
    console.log('getStakingStats API - 온체인 데이터 기반 해결됨:', {
      mint_address: activeStakes[0].mint_address,
      resolved_id: activeStakes[0].nft_id,
      original_db_id: activeStakes[0]._original_db_id,
      image_source: activeStakes[0]._debug_image_source
    });
  }
    
  // 처리된 데이터 반환
  return res.status(200).json(
    createApiResponse(true, '스테이킹 통계를 성공적으로 조회했습니다', {
      activeStakes,
      stats: {
        totalStaked: activeStakes.length,
        projectedRewards,
        earnedToDate
      },
      debug: {
        resolved_nft_ids: activeStakes.map(s => s.nft_id),
        mint_addresses: activeStakes.map(s => s.mint_address),
        using_consistent_hash_ids: true,
        id_resolution_method: "deterministic_hash",
        image_url_format: "ipfs://${hash}/${resolvedNftId}.png",
        source: "enhanced_onchain_getStakingStats"
      },
      fetchTime: new Date().toISOString()
    })
  );
    
  } catch (error) {
    console.error('getStakingStats API 오류:', error);
    return res.status(500).json(
      createApiResponse(false, '내부 서버 오류가 발생했습니다', null, getErrorMessage(error))
    );
  }
}

/**
 * 스테이킹의 현재 APY(연간 수익률) 계산
 * @param {Object} stake - 스테이킹 데이터 객체
 * @returns {number} 연간 수익률
 */
function calculateCurrentAPY(stake) {
  const dailyRate = stake.daily_reward_rate || 25; // 설정되지 않은 경우 기본값 25
  
  // NaN 방지 - total_rewards가 0이면 0 반환
  if (!stake.total_rewards) return 0;
  
  // 기본 APY 계산 (일일 보상 * 365 / 총 보상) * 100
  const baseAPY = (dailyRate * 365 / stake.total_rewards) * 100;
  
  // 장기 스테이킹 보너스
  let stakingBonus = 0;
  if (stake.staking_period >= 365) stakingBonus = 100; // +100%
  else if (stake.staking_period >= 180) stakingBonus = 70; // +70%
  else if (stake.staking_period >= 90) stakingBonus = 40; // +40%
  else if (stake.staking_period >= 30) stakingBonus = 20; // +20%
  
  // NaN, Infinity 방지 - 결과가 숫자가 아니면 0 반환
  const result = parseFloat((baseAPY * (1 + stakingBonus / 100)).toFixed(2));
  return isNaN(result) || !isFinite(result) ? 0 : result;
}