import React, { useState, useEffect, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import { PrimaryButton, SecondaryButton } from "../Buttons";
import ResponsiveImageLoader from "../ResponsiveImageLoader";
import { createPlaceholder, processImageUrl } from "../../utils/mediaUtils";
import { getNFTImageUrl, getNFTName, getNFTTier, getTierStyles } from "../../utils/nftImageUtils";
import { resolveStakedNftId, resolveNftId } from "../../utils/staking-helpers/nft-id-resolver";
import { EmergencyUnstakeButton } from "./EmergencyUnstakeButton";
import { EmergencyUnstakeResultModal } from "./EmergencyUnstakeResultModal";
import { debugLog, debugError, isDev } from "../../utils/debugUtils";

/**
 * StakedNFTCard Component - 개선된 UI/UX
 * Displays information about a staked NFT and allows for unstaking
 * 
 * React.memo로 최적화하여 Prevent unnecessary re-rendering
 */
// StakedNFTCard 컴포넌트 정의
const StakedNFTCard = ({ stake, onRefresh }) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [animation, setAnimation] = useState(false);
  const [showEmergencyUnstakeResult, setShowEmergencyUnstakeResult] = useState(false);
  const [emergencyUnstakeResult, setEmergencyUnstakeResult] = useState(null);
  const [emergencyUnstakeSignature, setEmergencyUnstakeSignature] = useState(null);
  const [nftId, setNftId] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // 실제 NFT ID 조회 및 이미지 URL 생성
  useEffect(() => {
    async function fetchRealNftId() {
      try {
        if (!stake || !stake.mint_address) {
          debugError('StakedNFTCard', '민트 주소 없음');
          setImageLoadError(true);
          return;
        }
        
        debugLog('StakedNFTCard', `NFT ID 조회 시작: ${stake.mint_address}`);
        
        // 실제 NFT ID 비동기 조회
        let realNftId;
        if (stake.staked_nft_id) {
          // 스테이킹 정보에 이미 ID가 있는 경우
          realNftId = String(stake.staked_nft_id).padStart(4, '0');
          debugLog('StakedNFTCard', `스테이킹 정보의 ID 사용: ${realNftId}`);
        } else {
          // 데이터베이스에서 ID 조회
          realNftId = await resolveNftId(stake.mint_address);
          debugLog('StakedNFTCard', `DB에서 조회한 ID: ${realNftId || 'Not found'}`);
        }
        
        if (!realNftId) {
          debugError('StakedNFTCard', `NFT ID를 찾을 수 없음: ${stake.mint_address}`);
          
          // 일관된 해시 기반 ID 생성 함수 (fallback용)
          const hashString = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // 32bit 정수로 변환
            }
            return Math.abs(hash);
          };
          
          // 민트 주소를 해시하여 결정론적 NFT ID 생성
          const availableIds = ['0119', '0171', '0327', '0416', '0418', '0579', '0625', '0113'];
          const hashValue = hashString(stake.mint_address);
          const fallbackId = availableIds[hashValue % availableIds.length];
          
          debugLog('StakedNFTCard', `대체 ID 생성: ${stake.mint_address} -> ${fallbackId}`);
          realNftId = fallbackId;
        }
        
        // 찾은 NFT ID 저장
        setNftId(realNftId);
        
        // 이미지 URL 생성 (강화된 로깅 및 오류 복원력)
        const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
        const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
        
        // 캐시 버스팅 개선: 동일한 NFT ID에 대해 일관된 캐시 버스터 생성
        // 이렇게 하면 새로고침 시마다 다른 URL이 아니라 세션 내에서 일관된 URL 사용
        const sessionCacheBuster = Math.floor(Date.now() / 60000); // 1분마다 변경
        
        try {
          // 안정적인 IPFS URL 생성
          const ipfsUrl = `ipfs://${IMAGES_CID}/${realNftId}.png`;
          
          // 게이트웨이 URL 생성 (캐시 버스팅 포함)
          const url = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${realNftId}.png?_cb=${sessionCacheBuster}`;
          
          debugLog('StakedNFTCard', `이미지 URL 생성 - IPFS: ${ipfsUrl}, 게이트웨이: ${url}`);
          setImageUrl(url);
          
          // stake 객체에 추가 정보 저장 (디버깅에 도움)
          stake.ipfsUrl = ipfsUrl;
          stake.gatewayUrl = url;
          stake.resolvedNftId = realNftId;
          
          // stake 객체에 imageUrl 추가 (다른 컴포넌트에서 사용할 수 있도록)
          stake.imageUrl = url;
        } catch (urlError) {
          debugError('StakedNFTCard', '이미지 URL 생성 오류:', urlError);
          setImageLoadError(true);
        }
      } catch (error) {
        debugError('StakedNFTCard', 'NFT ID 조회 중 오류:', error);
        setImageLoadError(true);
      }
    }
    
    fetchRealNftId();
  }, [stake]);
  
  // NFT 티어 정보 상태 관리
  const [realNftTier, setRealNftTier] = useState(null);
  
  // Initialize component and fetch real NFT tier information
  useEffect(() => {
    // Prepare NFT name for rendering
    getNFTName(stake, 'SOLARA');
    
    // Debug NFT tier information
    debugLog('StakedNFTCard', `NFT tier details for ${stake.mint_address}:`, {
      nft_tier: stake.nft_tier,
      standardized_tier: stake.standardized_tier,
      nft_id: stake.nft_id || stake.staked_nft_id,
      metadata_tier: stake.metadata?.attributes?.find(attr => 
        attr.trait_type?.toLowerCase() === 'tier' || 
        attr.trait_type?.toLowerCase() === 'rarity'
      )?.value,
      full_stake: stake
    });
    
    // 온체인 티어 정보를 사용하도록 수정
    const determineTierFromApi = async () => {
      try {
        if (!stake || !stake.mint_address) {
          debugLog('StakedNFTCard', 'Mint address missing, setting default tier Common');
          return setRealNftTier("Common");
        }
        
        // 로그 출력 - 사용 가능한 티어 정보
        debugLog('StakedNFTCard', `Available tier information:`, {
          nft_tier: stake.nft_tier,
          tier_multiplier: stake.tier_multiplier, 
          mint_address: stake.mint_address,
          nft_id: stake.nft_id || stake.staked_nft_id
        });
        
        // 티어 정보 가져오기 - 여러 정보 소스 시도
        
        // 1. 먼저 nftImageUtils의 getNFTTier 사용 (표준화된 방식)
        const utilsTier = getNFTTier(stake);
        if (utilsTier && utilsTier !== 'Common') {
          debugLog('StakedNFTCard', `Using tier from nftImageUtils: ${utilsTier}`);
          return setRealNftTier(utilsTier);
        }
        
        // 2. tier_multiplier 기반 티어 매핑 (온체인 데이터)
        if (stake.tier_multiplier !== undefined) {
          let tier = "Common";
          const multiplier = parseInt(stake.tier_multiplier);
          
          if (multiplier >= 8) tier = "Legendary";
          else if (multiplier >= 4) tier = "Epic";
          else if (multiplier >= 2) tier = "Rare";
          
          debugLog('StakedNFTCard', `Determined tier from multiplier (${multiplier}): ${tier}`);
          return setRealNftTier(tier);
        }
        
        // 3. 메타데이터 속성에서 직접 티어 정보 추출
        if (stake.metadata && stake.metadata.attributes) {
          const tierAttribute = stake.metadata.attributes.find(
            attr => attr.trait_type?.toLowerCase() === 'tier' || 
                    attr.trait_type?.toLowerCase() === 'rarity'
          );
          
          if (tierAttribute && tierAttribute.value) {
            const tier = standardizeTier(tierAttribute.value);
            debugLog('StakedNFTCard', `Found tier in metadata: ${tier}`);
            return setRealNftTier(tier);
          }
        }
        
        // 4. API에서 받은 nft_tier 필드 사용
        if (stake.nft_tier) {
          const tier = standardizeTier(stake.nft_tier);
          debugLog('StakedNFTCard', `Using API tier (${stake.nft_tier}): ${tier}`);
          return setRealNftTier(tier);
        }
        
        // 5. NFT ID를 이용한 실시간 조회 시도
        const nftId = stake.nft_id || stake.staked_nft_id;
        if (nftId) {
          try {
            // 티어 정보를 API에서 실시간 조회 시도
            const response = await fetch(`/api/staking/getNFTDetails?id=${nftId}`);
            if (response.ok) {
              const data = await response.json();
              if (data && data.tier) {
                const tier = standardizeTier(data.tier);
                debugLog('StakedNFTCard', `Retrieved tier from API: ${tier}`);
                return setRealNftTier(tier);
              }
            }
          } catch (error) {
            debugError('StakedNFTCard', 'API tier lookup error:', error);
            // 오류 발생 시 다음 방법으로 계속 진행
          }
        }
        
        // 기본값: Common
        debugLog('StakedNFTCard', 'No tier information found, using default: Common');
        setRealNftTier("Common");
      } catch (error) {
        debugError('StakedNFTCard', 'Error determining tier:', error);
        setRealNftTier("Common");
      }
    };
    
    // 티어 정보 결정 함수 호출
    determineTierFromApi();
  }, [stake]);
  
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate days left
  const calculateDaysLeft = (releaseDate) => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diffTime = release - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Calculate time left for display
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const release = new Date(stake.release_date);
      let difference = release - now;
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ days, hours, minutes });
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [stake.release_date]);
  
  // Pulse animation for earned rewards
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimation(true);
      setTimeout(() => setAnimation(false), 1000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Success message timer
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // 개선된 언스테이킹 처리 함수
  const handleUnstake = async () => {
    if (!connected || !publicKey) {
      setError("지갑이 연결되지 않았습니다");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      debugLog('StakedNFTCard', `언스테이킹 시작: NFT ${stake.nft_id || stake.id}, 민트 주소: ${stake.mint_address}`);
      
      // 언스테이킹 트랜잭션 준비
      debugLog('StakedNFTCard', '언스테이킹 트랜잭션 준비 API 호출...');
      const res = await fetch("/api/prepareUnstaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: stake.mint_address,
          stakingId: stake.id,
          _debug: true // 디버그 정보 요청
        }),
      });
      
      // API 응답 상태 확인 및 로깅
      debugLog('StakedNFTCard', `언스테이킹 준비 API 응답 상태: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        debugError('StakedNFTCard', '언스테이킹 준비 API 오류 응답:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || "언스테이킹 트랜잭션 준비 실패");
        } catch (parseError) {
          throw new Error(`언스테이킹 트랜잭션 준비 실패: ${res.status} ${res.statusText}`);
        }
      }
      
      // 응답 데이터 파싱
      const responseData = await res.json();
      debugLog('StakedNFTCard', '언스테이킹 준비 API 응답 데이터:', responseData);
      
      const { transactionBase64, penalty } = responseData;
      
      // 컨펌 다이얼로그 닫기
      setShowUnstakeConfirm(false);
      
      // RPC 엔드포인트 가져오기
      const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
      debugLog('StakedNFTCard', `언스테이킹 RPC 엔드포인트: ${SOLANA_RPC_ENDPOINT}`);
      
      // 트랜잭션 서명 및 전송
      debugLog('StakedNFTCard', '언스테이킹 트랜잭션 디코딩 및 서명...');
      const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
      const transaction = Transaction.from(Buffer.from(transactionBase64, "base64"));
      
      if (!transaction.feePayer) {
        debugLog('StakedNFTCard', `feePayer 설정: ${publicKey.toString()}`);
        transaction.feePayer = publicKey;
      }
      
      // 트랜잭션 정보 로깅
      debugLog('StakedNFTCard', `트랜잭션 정보: ${transaction.instructions.length}개의 명령어, recentBlockhash: ${transaction.recentBlockhash}`);
      
      // 트랜잭션 서명
      const signedTransaction = await signTransaction(transaction);
      debugLog('StakedNFTCard', '트랜잭션 서명 완료');
      
      // 트랜잭션 전송
      debugLog('StakedNFTCard', '트랜잭션 전송 중...');
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          preflightCommitment: 'confirmed',
          skipPreflight: false // 프리플라이트 활성화하여 오류 감지
        }
      );
      
      debugLog('StakedNFTCard', `트랜잭션 전송 완료. 시그니처: ${signature}`);
      
      // 트랜잭션 컨펌 대기
      debugLog('StakedNFTCard', '트랜잭션 컨펌 대기 중...');
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      
      if (confirmation.value.err) {
        debugError('StakedNFTCard', '트랜잭션 컨펌 오류:', confirmation.value.err);
        throw new Error(`트랜잭션 실패: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      debugLog('StakedNFTCard', '트랜잭션 컨펌 완료:', confirmation);
      
      // 백엔드 언스테이킹 완료 처리
      debugLog('StakedNFTCard', '백엔드 완료 API 호출...');
      const completeRes = await fetch("/api/completeUnstaking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: stake.mint_address,
          txSignature: signature,
          stakingId: stake.id,
          _debug: true // 디버그 정보 요청
        }),
      });
      
      // 완료 API 응답 확인 및 로깅
      debugLog('StakedNFTCard', `완료 API 응답 상태: ${completeRes.status}`);
      
      if (!completeRes.ok) {
        const errorText = await completeRes.text();
        debugError('StakedNFTCard', '완료 API 오류 응답:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || "언스테이킹 완료 처리 실패");
        } catch (parseError) {
          // 트랜잭션은 성공했으니 느슨하게 처리
          debugLog('StakedNFTCard', '완료 API 응답 파싱 오류, 하지만 트랜잭션은 성공함:', parseError);
          setSuccessMessage(`언스테이킹 성공! 온체인 트랜잭션이 컨펌되었습니다. (백엔드 완료 처리에 문제가 있었지만 무시해도 됩니다)`);
          
          // 데이터 갱신
          if (onRefresh) {
            setTimeout(() => {
              onRefresh();
            }, 2000); // 데이터 동기화를 위해 약간의 지연 추가
          }
          
          setLoading(false);
          return;
        }
      }
      
      // 응답 데이터 파싱
      const data = await completeRes.json();
      debugLog('StakedNFTCard', '완료 API 응답 데이터:', data);
      
      // 성공 메시지 표시
      const earnedAmount = data.earnedRewards || stake.earned_so_far || 0;
      setSuccessMessage(`언스테이킹 성공! ${earnedAmount} TESOLA 토큰을 획득했습니다.`);
      
      // 데이터 갱신
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 1000); // 데이터 동기화를 위해 약간의 지연 추가
      }
    } catch (err) {
      debugError('StakedNFTCard', '오류:', err);
      setError(err.message || "NFT 언스테이킹에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = stake.progress_percentage || 0;
  
  // Determine NFT tier and apply appropriate styling
  const getTierStyle = (tier) => {
    const lowerTier = (tier || "").toLowerCase();
    if (lowerTier.includes("legendary")) return "bg-yellow-900/30 border-yellow-500/30 text-yellow-300";
    if (lowerTier.includes("epic")) return "bg-purple-900/30 border-purple-500/30 text-purple-300";
    if (lowerTier.includes("rare")) return "bg-blue-900/30 border-blue-500/30 text-blue-300";
    return "bg-green-900/30 border-green-500/30 text-green-300"; // Common default
  };

  // Get the appropriate tier badge color
  const getTierBadge = (tier) => {
    const lowerTier = (tier || "").toLowerCase();
    if (lowerTier.includes("legendary")) return "bg-yellow-900 text-yellow-300";
    if (lowerTier.includes("epic")) return "bg-purple-900 text-purple-300";
    if (lowerTier.includes("rare")) return "bg-blue-900 text-blue-300";
    return "bg-green-900 text-green-300"; // Common default
  };

  // 클레임 보상 함수
  const handleClaimRewards = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      // 클레임 API 요청
      const res = await fetch("/api/staking/claimRewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          mintAddress: stake.mint_address
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "보상 청구 준비 실패");
      }

      const data = await res.json();
      setSuccessMessage(`${data.amount || "0"} TESOLA 토큰을 성공적으로 청구했습니다!`);

      // 데이터 갱신
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      debugError('StakedNFTCard', '보상 청구 오류:', err);
      setError(err.message || "보상 청구 실패");
    } finally {
      setLoading(false);
    }
  };

  // Use NFT utilities to extract name and info
  const nftName = getNFTName(stake, 'SOLARA');
  
  // NFT 티어 표준화 함수 - API 응답에서 받은 그대로의 티어 정보를 표준화된 형식으로 변환
  const standardizeTier = (originalTier) => {
    if (!originalTier) return "Common";
    
    // 문자열로 변환
    const tierStr = String(originalTier).trim().toUpperCase();
    
    // 정확한 값 확인
    if (tierStr === "LEGENDARY") return "Legendary";
    if (tierStr === "EPIC") return "Epic";
    if (tierStr === "RARE") return "Rare";
    if (tierStr === "COMMON") return "Common";
    
    // 부분 문자열 확인
    if (tierStr.includes("LEGEND")) return "Legendary";
    if (tierStr.includes("EPIC")) return "Epic";
    if (tierStr.includes("RARE")) return "Rare";
    
    // 기본값
    return "Common";
  };
  
  // 온체인 tier_multiplier 값 사용 (최우선)
  // 콘솔에 전체 데이터 출력해서 확인
  debugLog('StakedNFTCard', "Raw stake data:", stake);
  
  // stake 객체에서 tier_multiplier 로그 출력
  debugLog('StakedNFTCard', "Tier multiplier:", {
    value: stake.tier_multiplier, 
    type: typeof stake.tier_multiplier, 
    parsed: stake.tier_multiplier ? parseInt(stake.tier_multiplier) : 1
  });
  
  // parseInt를 사용해 확실히 숫자로 변환
  const tierMultiplier = stake.tier_multiplier ? parseInt(stake.tier_multiplier) : 1;
  
  // tier_multiplier 값으로 티어 계산 (온체인 값 최우선)
  const getTierFromMultiplier = (multiplier) => {
    // Log the multiplier value for debugging
    debugLog('StakedNFTCard', "Converting multiplier to tier:", multiplier);
    
    if (multiplier >= 8) return "Legendary";
    if (multiplier >= 4) return "Epic";
    if (multiplier >= 2) return "Rare";
    return "Common";
  };
  
  // 최종 표시할 티어 정보 결정 (우선순위 변경)
  // 1. 온체인 tier_multiplier 값 (가장 신뢰할 수 있음)
  // 2. 메타데이터에서 가져온 실제 티어 정보
  // 3. stake.nft_tier 필드 값
  // 4. 기본값 "Common"
  const displayTier = tierMultiplier > 1 ? 
    getTierFromMultiplier(tierMultiplier) : 
    (realNftTier || standardizeTier(stake.nft_tier) || "Common");
  
  // NFT tier details formatting - 온체인 tier_multiplier 우선 사용
  const getTierMultiplier = (tier) => {
    // tier_multiplier 값이 있으면 그대로 사용 (가장 신뢰할 수 있음)
    if (stake.tier_multiplier) {
      // 디버깅 로그
      debugLog('StakedNFTCard', `Using tier_multiplier directly: ${stake.tier_multiplier}`);
      
      // 정확한 값 처리 (문자열이면 parseInt 적용)
      const multiplierValue = typeof stake.tier_multiplier === 'string' 
        ? parseInt(stake.tier_multiplier) 
        : stake.tier_multiplier;
      
      // 상수 TIER_MULTIPLIERS 매핑에 맞춰 값 처리 (스테이킹 시스템의 배율 기준)
      // STAKING.TIER_MULTIPLIERS에 정의된 값: Common = 1.0, Rare = 1.5, Epic = 2.0, Legendary = 3.0
      // 실제 온체인 상태의 tier값: 0 = Common (1.0x), 1 = Rare (2.0x), 2 = Epic (4.0x), 3 = Legendary (8.0x)
      let finalMultiplier = multiplierValue;
      
      // 온체인 tier 값에서 UI 표시용 배율로 매핑
      if (multiplierValue === 2) finalMultiplier = 1.5; // Rare
      else if (multiplierValue === 4) finalMultiplier = 2.0; // Epic
      else if (multiplierValue === 8) finalMultiplier = 3.0; // Legendary
      else finalMultiplier = 1.0; // Common
      
      return `${finalMultiplier}x`;
    }
    
    // 티어 이름 기반 기본값
    if (!tier) return "1.0x";
    
    // UI 표시 용도의 배율 값
    const lowerTier = String(tier).toLowerCase();
    if (lowerTier.includes('legendary')) return "3.0x"; // Legendary
    if (lowerTier.includes('epic')) return "2.0x"; // Epic
    if (lowerTier.includes('rare')) return "1.5x"; // Rare
    return "1.0x"; // Common default
  };
  
  // Determine if NFT is unlocked (staking period complete)
  const isUnlocked = stake.is_unlocked || calculateDaysLeft(stake.release_date) === 0;
  
  // Format numbers with commas
  const formatNumber = (num) => {
    return parseFloat(num).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  
  // Process image URL with stable cache busting
  const getImageUrl = (imageUrl) => {
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      try {
        const url = new URL(imageUrl);
        // Use a stable cache key instead of constantly changing timestamp
        // to prevent image flickering issues
        url.searchParams.set('_cb', 'stable');
        return url.toString();
      } catch (err) {
        debugError('StakedNFTCard', 'Error parsing image URL:', err);
        return imageUrl;
      }
    }
    return imageUrl;
  };
  
  return (
    <div className={`rounded-lg border p-4 ${getTierStyle(displayTier)} transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10`}>
      {/* Unstake confirmation dialog */}
      {showUnstakeConfirm && (
        <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center rounded-lg">
          <div className="bg-gray-900 rounded-lg p-4 max-w-xs mx-auto border border-red-500/30">
            <h4 className="text-lg font-bold text-white mb-2">Confirm Unstaking</h4>
            
            {!isUnlocked && (
              <div className="bg-red-900/30 p-3 rounded-lg mb-3 text-sm">
                <p className="text-red-300 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Early unstaking will result in a penalty. You will lose approximately {Math.round(stake.total_rewards * 0.25)} TESOLA tokens.
                </p>
              </div>
            )}
            
            <p className="text-gray-300 mb-4">
              {isUnlocked 
                ? `You will receive ${formatNumber(stake.earned_so_far)} TESOLA tokens.` 
                : `Are you sure you want to unstake this NFT before the release date?`
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUnstakeConfirm(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnstake}
                disabled={loading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Unstake"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* NFT Header with image, name and tier */}
      <div className="flex items-start mb-3 relative">
        {/* NFT Image - EnhancedProgressiveImage 컴포넌트로 개선 */}
        <div className="w-16 h-16 rounded-lg overflow-hidden mr-3 border border-white/10 flex-shrink-0">
          {imageLoadError ? (
            // Image load failed 시 오류 대신 일관된 대체 이미지 표시
            <div className="w-full h-full overflow-hidden">
              {nftId ? (
                // NFT ID가 있으면 대체 이미지 생성 (ID 기반 결정론적 선택)
                <img 
                  src={`/nft-previews/${['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'][parseInt(nftId) % 6]}`}
                  alt={getNFTName(stake, 'SOLARA')}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 대체 이미지도 로드 실패하면 그라데이션 배경으로 대체
                    e.target.style.display = 'none';
                    e.target.parentNode.classList.add('bg-gradient-to-r', 'from-purple-900/50', 'to-blue-900/50');
                    e.target.parentNode.innerHTML += '<span class="text-xs text-white/70">NFT #' + nftId + '</span>';
                  }}
                />
              ) : (
                // NFT ID도 없으면 기본 그라데이션 배경
                <div className="w-full h-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                  <span className="text-xs text-white/70">SOLARA NFT</span>
                </div>
              )}
            </div>
          ) : imageUrl ? (
            // 자동으로 모바일과 데스크탑에 맞는 이미지 로더 사용
            <ResponsiveImageLoader
              src={imageUrl}
              alt={getNFTName(stake, 'SOLARA')}
              className="w-full h-full object-cover"
              id={stake.id || stake.mint_address}
              lazyLoad={true}
              priority={true} // 우선적으로 로드하도록 변경
              highQuality={true}
              preferRemote={true}
              useCache={true} // 깜빡임 방지를 위해 캐시 사용
              blur={true}
              placeholder={createPlaceholder(nftName || "SOLARA NFT")}
              _source="StakedNFTCard-thumbnail"
              disableCacheBusting={false} // Enable smart caching with stable keys
              onError={() => {
                debugLog('StakedNFTCard', `Image load failed: ${imageUrl}`);
                setImageLoadError(true);
              }}
            />
          ) : (
            // 이미지 URL이 아직 로딩 중인 경우 로딩 표시 (개선된 애니메이션)
            <div className="w-full h-full bg-black/30 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-purple-500/50 mb-1"></div>
                <span className="text-xs text-white/50">로딩 중</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start w-full">
            <div className="min-w-0">
              <h4 className="font-bold text-white truncate">{nftName}</h4>
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                <span 
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${getTierBadge(displayTier)}`}
                  title={`${displayTier} - Reward Multiplier: ${getTierMultiplier(displayTier)}`}
                >
                  {displayTier}
                </span>
                {isUnlocked && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300 font-medium animate-pulse">
                    Unlocked
                  </span>
                )}
              </div>
            </div>
            
            {/* Toggle expanded view button */}
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="text-white/70 hover:text-white transition-colors ml-1 flex-shrink-0"
              aria-label={expandedView ? "Show less" : "Show more"}
            >
              {expandedView ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Success message */}
        {successMessage && (
          <div className="absolute top-0 -right-2 transform translate-x-full bg-green-900/90 p-2 rounded-lg shadow-lg z-10 animate-fadeIn">
            <p className="text-sm text-green-300 whitespace-nowrap">{successMessage}</p>
          </div>
        )}
      </div>
      
      {/* Progress bar with enhanced styling */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">Progress</span>
          <span className="text-white">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-transform duration-1000 ease-out"
            style={{width: `${progressPercentage}%`, transform: `translateX(${animation ? '5px' : '0px'})`}}
          ></div>
        </div>
      </div>
      
      {/* Time left and key info */}
      <div className="mb-3">
        {timeLeft ? (
          <div className="bg-black/20 rounded-lg p-2 flex justify-between items-center">
            <span className="text-xs text-white/70">Time Remaining:</span>
            <span className="text-sm font-medium text-white">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
        ) : (
          <div className="bg-green-900/20 rounded-lg p-2 flex justify-between items-center">
            <span className="text-xs text-white/70">Status:</span>
            <span className="text-sm font-medium text-green-300">Ready to claim</span>
          </div>
        )}
      </div>
      
      {/* Reward info - always visible */}
      <div className={`bg-black/20 rounded-lg p-3 mb-3 transition-all duration-300 ${animation ? 'scale-105 bg-purple-900/40' : ''}`}>
        <div className="text-center">
          <div className="text-white/70 text-xs mb-1">Earned so far</div>
          <div className="text-xl font-bold text-white">
            <span className="text-yellow-400">{formatNumber(typeof stake.earned_so_far === 'number' ? stake.earned_so_far : 0)}</span>{" "}
            <span className="text-sm font-normal text-yellow-500/70">TESOLA</span>
          </div>
          {stake.daily_reward_rate && (
            <div className="text-xs text-green-400 mt-1">
              +{stake.daily_reward_rate} TESOLA/day
            </div>
          )}
        </div>
      </div>
      
      {/* Expandable details */}
      {expandedView && (
        <div className="mt-4 pt-3 border-t border-white/10 space-y-3 animate-fadeIn">
          {/* Enlarged NFT Image - EnhancedProgressiveImage로 개선 */}
          <div className="aspect-square w-full max-w-[180px] mx-auto rounded-lg overflow-hidden border border-white/10 mb-4 relative">
            {imageLoadError ? (
              // Image load failed 시 오류 대신 대체 이미지와 정보 표시
              <div className="w-full h-full overflow-hidden">
                {nftId ? (
                  // 실패한 경우 NFT ID 기반 대체 이미지 표시
                  <div className="relative w-full h-full">
                    <img 
                      src={`/nft-previews/${['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'][parseInt(nftId) % 6]}`}
                      alt={getNFTName(stake, 'SOLARA')}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 대체 이미지도 로드 실패하면 그라데이션으로 대체
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('bg-gradient-to-r', 'from-purple-800/70', 'to-blue-800/70');
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4">
                      <span className="text-white font-bold mb-2">SOLARA #{nftId}</span>
                      <span className="text-xs text-white/80 text-center">대체 이미지 표시 중</span>
                      <span className="text-xs text-white/60 text-center mt-2">민트 주소:
                        <br />{stake.mint_address?.slice(0, 8)}...{stake.mint_address?.slice(-6)}
                      </span>
                    </div>
                  </div>
                ) : (
                  // NFT ID가 없는 경우 단순 그라데이션 배경
                  <div className="w-full h-full bg-gradient-to-r from-purple-800/70 to-blue-800/70 flex flex-col items-center justify-center p-4">
                    <span className="text-white font-bold mb-2">SOLARA NFT</span>
                    <span className="text-xs text-white/80 text-center">Image load failed</span>
                    <span className="text-xs text-white/60 text-center mt-2">민트 주소:
                      <br />{stake.mint_address?.slice(0, 8)}...{stake.mint_address?.slice(-6)}
                    </span>
                  </div>
                )}
              </div>
            ) : imageUrl ? (
              // 확대 이미지 표시 (캐시 버스팅과 에러 핸들링 개선)
              <ResponsiveImageLoader
                src={imageUrl}
                alt={getNFTName(stake, 'SOLARA')}
                className="w-full h-full object-cover"
                id={`enlarged-${stake.id || stake.mint_address}`}
                lazyLoad={false} // Load immediately when expanded view is shown
                priority={true}
                highQuality={true} // Use high quality for enlarged view
                preferRemote={true}
                useCache={true} // 깜빡임 방지를 위해 캐시 사용
                blur={true}
                placeholder={createPlaceholder(nftName || "SOLARA NFT")}
                _source="StakedNFTCard-enlarged"
                disableCacheBusting={false} // Enable smart caching with stable keys
                forceDesktop={true} // Force desktop version for enlarged view
                onError={() => {
                  debugLog('StakedNFTCard', `확대 Image load failed: ${imageUrl}`);
                  setImageLoadError(true);
                }}
              />
            ) : (
              // 로딩 중 표시 (확대 이미지)
              <div className="w-full h-full bg-black/30 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <div className="text-xs text-white/70">이미지 로딩 중...</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-white/70">Staked On</div>
              <div className="font-medium text-white">{formatDate(stake.staked_at)}</div>
            </div>
            <div>
              <div className="text-white/70">Release Date</div>
              <div className="font-medium text-white">{formatDate(stake.release_date)}</div>
            </div>
            <div>
              <div className="text-white/70">Staking Period</div>
              <div className="font-medium text-white">{stake.staking_period} days</div>
            </div>
            <div>
              <div className="text-white/70">Days Remaining</div>
              <div className="font-medium text-white">{calculateDaysLeft(stake.release_date)} days</div>
            </div>
            <div>
              <div className="text-white/70">Daily Rate</div>
              <div className="font-medium text-white">{stake.daily_reward_rate} TESOLA</div>
            </div>
            <div>
              <div className="text-white/70">Total Rewards</div>
              <div className="font-medium text-white">{formatNumber(stake.total_rewards)} TESOLA</div>
            </div>
          </div>
          
          {/* Additional NFT info */}
          <div className="bg-black/20 rounded-lg p-3 text-sm">
            <div className="font-medium text-white/70 mb-1">NFT Details</div>
            <div className="flex justify-between">
              <span>Mint Address</span>
              <span className="text-white font-mono">{stake.mint_address.substr(0, 6)}...{stake.mint_address.substr(-4)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Tier</span>
              <span className={`font-medium ${
                displayTier.toLowerCase().includes('legendary') ? 'text-yellow-300' :
                displayTier.toLowerCase().includes('epic') ? 'text-purple-300' :
                displayTier.toLowerCase().includes('rare') ? 'text-blue-300' :
                'text-green-300'
              }`}>
                {displayTier} ({getTierMultiplier(displayTier)} rewards)
              </span>
            </div>
          </div>
          
          {/* Early unstaking warning if applicable */}
          {!isUnlocked && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              <p className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Early unstaking will result in reward penalties. Wait until the release date for full rewards.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-3 bg-red-900/20 border border-red-500/20 rounded-lg p-2 text-sm text-red-300">
          {error}
        </div>
      )}
      
      {/* 버튼 영역 */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <div className="flex gap-2 flex-1">
          <PrimaryButton
            onClick={() => setShowUnstakeConfirm(true)}
            loading={loading && !successMessage}
            fullWidth
            className={isUnlocked ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500' : ''}
          >
            {isUnlocked ? 'Claim & Unstake' : 'Unstake NFT'}
          </PrimaryButton>

          {/* 클레임 버튼 추가 */}
          <SecondaryButton
            onClick={handleClaimRewards}
            loading={loading && successMessage}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
          >
            Claim
          </SecondaryButton>
        </div>

        {/* 비상 언스테이킹 버튼 - 스테이킹 기간이 끝나지 않았을 때만 표시 */}
        {!isUnlocked && (
          <EmergencyUnstakeButton
            nftMint={stake.mint_address}
            stakeInfo={stake}
            onSuccess={(signature, result) => {
              setEmergencyUnstakeSignature(signature);
              setEmergencyUnstakeResult(result);
              setShowEmergencyUnstakeResult(true);

              // 데이터 갱신
              if (onRefresh) {
                onRefresh();
              }
            }}
            disabled={loading}
          />
        )}

        {/* 비상 언스테이킹 결과 모달 */}
        {showEmergencyUnstakeResult && emergencyUnstakeResult && (
          <EmergencyUnstakeResultModal
            isOpen={showEmergencyUnstakeResult}
            onClose={() => setShowEmergencyUnstakeResult(false)}
            result={emergencyUnstakeResult}
            signature={emergencyUnstakeSignature}
          />
        )}
      </div>
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// React.memo로 컴포넌트 최적화 - Prevent unnecessary re-rendering
const MemoizedStakedNFTCard = React.memo(StakedNFTCard, (prevProps, nextProps) => {
  // 중요 속성만 비교하여 Prevent unnecessary re-rendering
  
  // 1. stake ID가 다르면 리렌더링 필요 (완전히 다른 NFT)
  if (prevProps.stake.id !== nextProps.stake.id) {
    return false;
  }
  
  // 2. 민트 주소가 다르면 리렌더링 필요
  if (prevProps.stake.mint_address !== nextProps.stake.mint_address) {
    return false;
  }
  
  // 3. 언락 상태가 변경되면 리렌더링 필요
  if (prevProps.stake.is_unlocked !== nextProps.stake.is_unlocked) {
    return false;
  }

  // 4. 보상 금액이 변경되면 리렌더링 필요
  if (prevProps.stake.earned_so_far !== nextProps.stake.earned_so_far) {
    return false;
  }
  
  // 5. 진행률이 변경되면 리렌더링 필요
  if (prevProps.stake.progress_percentage !== nextProps.stake.progress_percentage) {
    return false;
  }
  
  // 위 조건에 해당하지 않으면 리렌더링 필요 없음
  return true;
});

export default MemoizedStakedNFTCard;