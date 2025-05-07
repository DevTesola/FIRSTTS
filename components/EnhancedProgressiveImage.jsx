"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { 
  processImageUrl, 
  createPlaceholder, 
  getOptimalImageSize, 
  extractIPFSCid,
  isIPFSUrl,
  preloadImage,
  simpleIpfsUrlConversion
} from "../utils/mediaUtils";

/**
 * Enhanced Progressive Image component with optimized loading
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Image alt text
 * @param {string} placeholder - Low-res placeholder image URL (optional)
 * @param {boolean} lazyLoad - Whether to lazy load the image (default: true)
 * @param {function} onLoad - Callback function when image loads
 * @param {function} onError - Callback function when image loading fails
 * @param {Object} props - Other image attributes
 */
// 공통으로 사용할 IPFS 게이트웨이 목록 정의
const IPFS_GATEWAYS = [
  'https://tesola.mypinata.cloud/ipfs/',  // 개인 게이트웨이 (최우선)
  'https://gateway.pinata.cloud/ipfs/',    // Pinata 게이트웨이 
  'https://nftstorage.link/ipfs/',         // NFT.Storage (안정적)
  'https://ipfs.io/ipfs/',                 // IPFS.io
  'https://dweb.link/ipfs/',               // Protocol Labs
  'https://cloudflare-ipfs.com/ipfs/'      // Cloudflare
];

export default function EnhancedProgressiveImage({
  src,
  alt,
  placeholder = "",
  lazyLoad = true,
  quality = 75,
  blur = true,
  priority = false,
  highQuality = false,
  preferRemote = true, // 실제 NFT 이미지 항상 우선 (기본값: true로 변경)
  onLoad,
  onError,
  className = "",
  ...props
}) {
  // 로딩 인디케이터 특수 URL 처리 (loading:indicator)
  if (src === "loading:indicator") {
    // 로딩 인디케이터만 표시하고 이미지는 로드하지 않음
    return (
      <div className={`relative overflow-hidden ${className}`} {...props}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-white/70">Loading NFT image...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // 이미지 로딩 디버깅을 위한 로그 추가
  console.log(`🔄 EnhancedProgressiveImage 로딩 시작: ${src}`);
  console.log(`📋 컴포넌트 소스: ${props.__source || 'unknown'}`);
  
  // 스테이킹 페이지 컴포넌트 감지 - 모든 스테이킹 관련 컴포넌트 포함
  const isStakingComponent = props.__source && 
    (props.__source.includes('StakedNFTCard') || 
     props.__source.includes('NFTGallery') || 
     props.__source.includes('Leaderboard') || 
     props.__source.includes('StakingDashboard') || 
     props.__source.includes('Dashboard') || 
     props.__source.includes('staking'));
     
  if (isStakingComponent) {
    console.log(`🔍 스테이킹 페이지 컴포넌트 감지됨: ${props.__source}`);
    // 스테이킹 컴포넌트인 경우 항상 캐시 버스팅 추가
    if (!props._cacheBust) {
      props._cacheBust = Date.now();
    }
  }
  // Generate beautiful placeholder with gradient for better UX
  const defaultPlaceholder = createPlaceholder(alt || "SOLARA", null, { 
    gradient: true, 
    blur: true 
  });

  // Enhanced loading state to track progressive loading stages
  const [loadState, setLoadState] = useState({
    loading: true,
    error: false,
    stage: 'initial', // 'initial', 'thumbnail', 'full'
    src: placeholder || defaultPlaceholder,
    thumbnailLoaded: false,
    fullLoaded: false
  });
  
  const containerRef = useRef(null);
  const fullImageRef = useRef(null);
  const thumbnailRef = useRef(null);
  const attemptedUrls = useRef(new Set());
  
  // Determine screen type for responsive image sizing
  const getScreenType = () => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  };

  // Use enhanced intersection observer for lazy loading with better threshold
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: !lazyLoad, // Only trigger once if not explicitly lazy loading
    rootMargin: priority ? '400px 0px' : '200px 0px', // Load priority images earlier
    threshold: 0.01 // Start loading with minimal visibility
  });
  
  // Merge refs for the container and intersection observer with null check
  const setRefs = useCallback(node => {
    if (node !== null) {
      containerRef.current = node;
      if (lazyLoad || priority) {
        inViewRef(node);
      }
    }
  }, [inViewRef, lazyLoad, priority]);
  
  // Start loading immediately for priority images, regardless of viewport
  useEffect(() => {
    if (priority && src) {
      // Preload high priority images as soon as component mounts
      preloadImage(src, { 
        width: highQuality ? 1200 : 800, 
        quality: quality,
        optimizeFormat: true
      }).catch(() => {}); // Silently handle errors, real error handling in main load
    }
  }, [src, priority, highQuality, quality]);
  
  // Progressive image loading strategy with improved fallback handling
  useEffect(() => {
    // Skip if no source or not in view (unless priority)
    if (!src || (lazyLoad && !inView && !priority)) return;
    
    let isMounted = true;
    let currentGatewayIndex = 0; // Track which gateway we're currently using
    let maxRetries = 3; // Maximum number of retries with different gateways
    let retryCount = 0;
    const isIpfs = isIPFSUrl(src);
    const isLocalImage = src.startsWith('/');
    
    // 로그 제거
    // console.log(`Loading image: ${src}`, {
    //   isIpfs,
    //   isLocalImage,
    //   highQuality
    // });
    
    const loadImage = async () => {
      try {
        // Calculate optimal sizes based on container and device
        const containerWidth = containerRef.current?.clientWidth || 300;
        const screenType = getScreenType();
        
        // For thumbnail (low quality) version
        const thumbnailSize = getOptimalImageSize(containerWidth / 2, { 
          screenType,
          isHighQuality: false
        });
        
        // For full quality version
        const fullSize = getOptimalImageSize(containerWidth, { 
          screenType,
          isHighQuality: highQuality
        });
        
        // Start with placeholder if not already loaded
        if (loadState.stage === 'initial') {
          setLoadState(prev => ({
            ...prev,
            stage: 'thumbnail',
            loading: true
          }));
        }
        
        // Low quality thumbnail first for progressive loading
        if (!loadState.thumbnailLoaded) {
          // 디버깅을 위한 상세 정보
          const isLocalPreview = typeof src === 'string' && src.includes('/nft-previews/');
          const isIpfsImage = isIPFSUrl(src);
          
          // 원본 URL 로깅
          console.log(`EnhancedProgressiveImage loading for: ${src}`);
          console.log(`Classification: isLocalPreview=${isLocalPreview}, isIpfsImage=${isIpfsImage}`);
          
          // 지속적인 403 오류 문제 해결을 위한 로컬 폴백 자동 추출
          let localFallback = null;
          if (isIpfsImage) {
            // 이미지 ID 추출 시도
            const match = src.match(/\/(\d{4})\.png$/);
            if (match && match[1]) {
              const id = parseInt(match[1]);
              const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
              localFallback = `/nft-previews/${previewImages[id % previewImages.length]}`;
              // console.log(`자동 로컬 폴백 생성: ${src} -> ${localFallback}`);
            }
          }
          
          // IPFS URL인 경우 직접 간단하게 게이트웨이 URL로 변환 시도
          let processedSrc = src;
          
          // IPFS -> 게이트웨이 URL 변환 - 강제로 테솔라 게이트웨이 사용
          if (isIpfsImage) {
            // ipfs:// 제거하고 게이트웨이 URL 생성
            const hashAndPath = src.replace('ipfs://', '');
            
            // 항상 Tesola Pinata 게이트웨이 사용 (테솔라 프로젝트 전용)
            let gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${hashAndPath}`;
            
            // 스테이킹 페이지 컴포넌트 감지 및 캐시 버스팅 추가
            const isStakingComponent = props.__source && 
               (props.__source.includes('StakedNFTCard') || 
                props.__source.includes('NFTGallery') || 
                props.__source.includes('Leaderboard') || 
                props.__source.includes('staking'));
                
            if (isStakingComponent) {
              // 캐시 버스팅 파라미터 추가 (항상 새로운 이미지 로드)
              const cacheBuster = `?_cb=${Date.now()}`;
              gatewayUrl += cacheBuster;
              console.log(`🔄 스테이킹 페이지 이미지 캐시 버스팅 적용: ${gatewayUrl}`);
            }
            
            console.log(`이미지 로딩: ${src} -> ${gatewayUrl}`);
            processedSrc = gatewayUrl;
          }
          
          // 일반적인 이미지 처리 계속 진행
          // 디버깅 로그 제거
          // console.log(`EnhancedProgressiveImage 이미지 URL 처리: ${processedSrc}, preferRemote=${preferRemote}`);
          
          const thumbnailUrl = processImageUrl(processedSrc, { 
            width: thumbnailSize,
            quality: Math.min(quality, 30), // 빠른 로딩을 위한 낮은 품질
            optimizeFormat: true,
            useCache: false,
            gatewayIndex: isIpfsImage ? currentGatewayIndex : null,
            preferLocalFiles: false, // 중요: 항상 false로 설정하여 로컬 이미지 사용 방지
            preferRemote: true // 항상 원격 이미지 우선 사용 (강제 적용)
          });
          
          // Skip if already attempted
          if (!attemptedUrls.current.has(thumbnailUrl)) {
            attemptedUrls.current.add(thumbnailUrl);
            
            // Preload thumbnail
            thumbnailRef.current = new Image();
            
            thumbnailRef.current.onload = () => {
              if (!isMounted) return;
              
              // Update with thumbnail while full image loads
              setLoadState(prev => ({
                ...prev,
                thumbnailLoaded: true,
                src: thumbnailUrl,
                stage: 'thumbnail'
              }));
              
              // Start loading full quality version immediately after
              loadFullVersion();
            };
            
            thumbnailRef.current.onerror = () => {
              if (!isMounted) return;
              
              // Increment retry count
              retryCount++;
              
              // 로컬 폴백은 최후의 수단으로만 사용 - 모든 IPFS 게이트웨이를 먼저 시도
              const maxGateways = IPFS_GATEWAYS.length; // 사용 가능한 게이트웨이 수
              
              // IPFS URL인 경우 모든 게이트웨이를 시도하기
              if (isIpfs && currentGatewayIndex < maxGateways - 1) {
                console.log(`IPFS URL 썸네일 로딩 실패. 다른 게이트웨이 시도 중 (${currentGatewayIndex+1}/${maxGateways}): ${src}`);
                // 다음 게이트웨이 시도
                currentGatewayIndex++;
                loadImage(); // 새 게이트웨이로 재시도
                return;
              }
              
              // 모든 게이트웨이 시도 후에도 실패한 경우 로깅
              if (isIpfs) {
                console.warn(`⚠️ 모든 IPFS 게이트웨이(${maxGateways}개)를 시도했으나 실패: ${src}`);
              }
              
              // 모든 게이트웨이 시도 후에도 실패한 경우에만 로컬 폴백 사용
              if (localFallback) {
                console.log(`모든 IPFS 게이트웨이 시도 후 로컬 폴백 사용: ${localFallback}`);
                
                // 로컬 이미지로 전환 - 하지만 경고 로그 남김
                console.warn(`⚠️ 실제 NFT 이미지를 불러오지 못하고 로컬 폴백 사용: ${src} -> ${localFallback}`);
                
                // 디버깅을 위한 추가 컨텍스트 로그
                console.debug(`이미지 로딩 실패 컨텍스트:`, {
                  src: src,
                  attemptedGateways: currentGatewayIndex + 1,
                  totalGateways: maxGateways,
                  retryCount,
                  preferRemote
                });
                
                setLoadState(prev => ({
                  ...prev,
                  thumbnailLoaded: true,
                  src: localFallback,
                  stage: 'thumbnail',
                  loading: false,
                  error: false
                }));
                
                // 로딩 완료 처리
                if (onLoad) onLoad();
                return;
              }
              
              // 게이트웨이 순환 - Try next gateway, local fallback, or skip to full version
              if (isIpfs) {
                // 게이트웨이 최대 개수 정의 (공통 상수 사용)
                const maxGateways = IPFS_GATEWAYS.length;
                
                // 아직 더 시도할 게이트웨이가 있는지 확인
                if (currentGatewayIndex < maxGateways - 1 && retryCount <= maxRetries) {
                  console.log(`게이트웨이 시도 중: ${currentGatewayIndex + 1}/${maxGateways}`);
                  // Try next gateway
                  currentGatewayIndex++;
                  loadImage(); // Restart with new gateway
                  return;
                }
                
                console.log(`모든 게이트웨이 시도 완료 (${currentGatewayIndex + 1}/${maxGateways}). 전체 이미지 로딩으로 진행`);
              }
              
              // 모든 게이트웨이 시도 후에도 실패한 경우 전체 이미지 로딩으로 진행
              loadFullVersion();
            };
            
            // Start loading thumbnail
            thumbnailRef.current.src = thumbnailUrl;
          } else {
            // Skip to full version if thumbnail already attempted
            loadFullVersion();
          }
        } else {
          // Thumbnail already loaded, proceed to full version
          loadFullVersion();
        }
        
        // Function to load full quality version
        function loadFullVersion() {
          // Only proceed if component is still mounted
          if (!isMounted) return;
          
          // Update state to loading full version
          setLoadState(prev => ({
            ...prev,
            stage: 'full',
            loading: !prev.fullLoaded
          }));
          
          // 전체 품질 이미지 로딩 (로컬 폴백 사용 포함)
          console.log(`EnhancedProgressiveImage loading full image from ${src}`);
          console.log(`isIPFS=${isIPFSUrl(src)}, currentGateway=${currentGatewayIndex}`);
          
          // 로컬 폴백 자동 추출 - 이미지 로딩 실패시 사용
          let fullImageLocalFallback = null;
          if (isIPFSUrl(src)) {
            // 이미지 ID 추출 시도
            const match = src.match(/\/(\d{4})\.png$/);
            if (match && match[1]) {
              const id = parseInt(match[1]);
              const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
              fullImageLocalFallback = `/nft-previews/${previewImages[id % previewImages.length]}`;
              console.log(`전체 이미지 로컬 폴백 준비: ${fullImageLocalFallback}`);
            }
          }
          
          // 이미 썸네일 단계에서 로컬 폴백 사용 중이면 완료 처리
          if (isIPFSUrl(src) && loadState.thumbnailLoaded && loadState.src.startsWith('/nft-previews/')) {
            console.log(`이미 로컬 폴백 사용 중, 로딩 완료 처리`);
            setLoadState(prev => ({
              ...prev,
              loading: false,
              fullLoaded: true,
              error: false
            }));
            
            if (onLoad) onLoad();
            return;
          }
          
          // IPFS URL인 경우 게이트웨이 URL로 변환
          let processedSrc = src;
          if (isIPFSUrl(src)) {
            // ipfs:// 제거하고 게이트웨이 URL 생성
            const hashAndPath = src.replace('ipfs://', '');
            
            // 항상 테솔라 전용 게이트웨이 사용 (다른 게이트웨이는 CORS 문제 발생)
            const gatewayUrl = `https://tesola.mypinata.cloud/ipfs/${hashAndPath}`;
            
            console.log(`전체 이미지 로딩: ${src} -> ${gatewayUrl}`);
            processedSrc = gatewayUrl;
          }
          
          // 로그 제거
          // console.log(`실제 로딩할 이미지 URL: ${processedSrc}`);
          // 디버깅용 강제 IPFS URL 검사
          // if (processedSrc.includes('ipfs.io') || processedSrc.includes('pinata') || processedSrc.includes('dweb.link')) {
          //   console.log(`🔍 IPFS 게이트웨이 URL 확인: ${processedSrc}`);
          // }
          
          // 일반 처리 계속 진행
          const fullUrl = processImageUrl(processedSrc, { 
            width: fullSize,
            quality: quality,
            optimizeFormat: true,
            useCache: false,
            gatewayIndex: currentGatewayIndex,
            preferLocalFiles: false, // 중요: IPFS 원본 이미지 우선 사용
            preferRemote: preferRemote // 원격 이미지 강제 사용 (리워드 대시보드 등)
          });
          
          console.log(`Full image URL 최종: ${fullUrl}`);
          
          // Skip if already attempted
          if (attemptedUrls.current.has(fullUrl) && loadState.fullLoaded) {
            return;
          }
          
          attemptedUrls.current.add(fullUrl);
          
          // Load full quality image
          fullImageRef.current = new Image();
          
          fullImageRef.current.onload = () => {
            if (!isMounted) return;
            
            // Full quality image loaded successfully
            setLoadState(prev => ({
              ...prev,
              loading: false,
              fullLoaded: true,
              src: fullUrl,
              error: false
            }));
            
            if (onLoad) onLoad();
          };
          
          fullImageRef.current.onerror = () => {
            if (!isMounted) return;
            
            // 오류 로깅 강화 - 특히 스테이킹 페이지용
            console.error(`❌ 이미지 로드 실패: ${fullImageRef.current.src}`);
            console.error(`요청 URL: ${fullImageRef.current.src}`);
            console.error(`원본 SRC: ${src}`);
            console.error(`컴포넌트 소스: ${props.__source || 'unknown'}`);
            
            // 강제 Pinata URL 테스트를 위한 직접 URL 생성 및 로깅
            if (src.includes('tesola.mypinata.cloud') && src.includes('forcereload')) {
              console.error(`❌ 직접 Pinata URL 로드도 실패! 심각한 문제가 있습니다. URL: ${src}`);
            }
            
            // IPFS URL 로딩이 실패한 경우, 모든 게이트웨이를 시도
            if (isIPFSUrl(src)) {
              // IPFS 게이트웨이 최대 시도 횟수 정의
              const maxGateways = IPFS_GATEWAYS.length;
              
              if (currentGatewayIndex < maxGateways - 1) {
                console.log(`IPFS URL 로딩 실패. 다른 게이트웨이 시도 중 (${currentGatewayIndex+1}/${maxGateways}): ${src}`);
                // 다음 게이트웨이 시도
                currentGatewayIndex++;
                tryNextGateway();
                return;
              } else {
                console.warn(`⚠️ 모든 IPFS 게이트웨이(${maxGateways}개)를 시도했으나 실패: ${src}`);
              }
            }

            // 충분히 시도한 후에 로컬 폴백 사용
            if (fullImageLocalFallback) {
              console.log(`모든 IPFS 게이트웨이 시도 후 로컬 폴백 사용: ${fullImageLocalFallback}`);
              
              // 디버깅을 위한 추가 컨텍스트 로그
              console.debug(`전체 이미지 로딩 실패 컨텍스트:`, {
                src: src,
                attemptedGateways: currentGatewayIndex + 1,
                totalGateways: IPFS_GATEWAYS.length,
                retryCount,
                preferRemote
              });
              
              // 로컬 이미지로 전환
              setLoadState(prev => ({
                ...prev,
                loading: false,
                fullLoaded: true,
                src: fullImageLocalFallback,
                error: false
              }));
              
              // 로딩 완료 처리
              if (onLoad) onLoad();
              return;
            }
            
            // 로컬 폴백이 없으면 다음 게이트웨이 시도
            tryNextGateway();
          };
          
          // Start loading full image
          fullImageRef.current.src = fullUrl;
        }
        
        // Improved fallback strategy - try gateways first, then fall back to local images if available
        function tryNextGateway() {
          // Increment retry count
          retryCount++;
          
          // For non-IPFS content, handle differently
          if (!isIPFSUrl(src)) {
            // If we still have retries left, try loading the image directly again
            if (retryCount <= maxRetries) {
              console.log(`Retrying non-IPFS image: ${src} (attempt ${retryCount})`);
              
              const retryImg = new Image();
              
              retryImg.onload = () => {
                if (!isMounted) return;
                
                // Retry succeeded
                setLoadState(prev => ({
                  ...prev,
                  loading: false,
                  fullLoaded: true,
                  src: src,
                  error: false
                }));
                
                if (onLoad) onLoad();
              };
              
              retryImg.onerror = () => {
                if (!isMounted) return;
                handleFinalError();
              };
              
              retryImg.src = `${src}?retry=${retryCount}`;
              return;
            } else {
              handleFinalError();
              return;
            }
          }
          
          // For IPFS content, try next gateway
          currentGatewayIndex++;
          
          // After trying all gateways, move to final error handling
          if (currentGatewayIndex >= IPFS_GATEWAYS.length || retryCount > maxRetries) {
            console.log(`All IPFS gateways failed for ${src}, handling error`);
            handleFinalError();
            return;
          }
          
          // Process URL with next gateway
          const nextUrl = processImageUrl(src, {
            width: getOptimalImageSize(containerWidth, { 
              screenType,
              isHighQuality: highQuality
            }),
            quality: quality,
            optimizeFormat: true,
            useCache: false,
            gatewayIndex: currentGatewayIndex
          });
          
          console.log(`Trying next gateway (${currentGatewayIndex}) for ${src}: ${nextUrl}`);
          
          // Skip if already attempted
          if (attemptedUrls.current.has(nextUrl)) {
            tryNextGateway(); // Skip to next gateway
            return;
          }
          
          attemptedUrls.current.add(nextUrl);
          
          const nextImg = new Image();
          
          nextImg.onload = () => {
            if (!isMounted) return;
            
            // Gateway succeeded
            setLoadState(prev => ({
              ...prev,
              loading: false,
              fullLoaded: true,
              src: nextUrl,
              error: false
            }));
            
            if (onLoad) onLoad();
          };
          
          nextImg.onerror = () => {
            if (!isMounted) return;
            
            // Try next gateway recursively
            tryNextGateway();
          };
          
          nextImg.src = nextUrl;
        }
        
        // Enhanced error handling with better local image fallback
        function handleFinalError() {
          if (!isMounted) return;
          
          // Option 1: Use thumbnail if already loaded
          if (loadState.thumbnailLoaded) {
            console.log(`Using loaded thumbnail as fallback for ${src}`);
            setLoadState(prev => ({
              ...prev,
              loading: false,
              error: false // Not marking as error since we have thumbnail
            }));
            return;
          }
          
          // Option 2: For IPFS URLs that failed, try local fallback if available
          // This is the key improvement - explicitly try all local versions when IPFS fails
          if (isIPFSUrl(src)) {
            // More aggressive NFT ID extraction with multiple patterns
            let nftIdMatch = null;
            const patterns = [
              // Try to extract from path segments with 3-4 digits
              /\/([0-9]{3,4})[/\.]/,
              // Also try broader pattern for various ID formats
              /\W([0-9]{1,4})\W/,
              // Try to extract any alphanumeric ID
              /\/([0-9a-zA-Z]{3,8})[/.]/
            ];
            
            // Try each pattern
            for (const pattern of patterns) {
              const match = (typeof src === 'string' && src.match(pattern) || []);
              if (match && match[1]) {
                nftIdMatch = match[1];
                break;
              }
            }
            
            if (nftIdMatch) {
              // Format the ID properly and try to load from local preview folder
              let formattedId;
              try {
                // Try to treat as number if possible
                formattedId = String(parseInt(nftIdMatch)).padStart(4, '0');
              } catch (e) {
                // If not a number, use as is
                formattedId = String(nftIdMatch).padStart(4, '0');
              }
              
              // Define available preview images
              const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
              const index = parseInt(formattedId) % previewImages.length;
              const localPathToTry = `/nft-previews/${previewImages[index]}`;
              
              console.log(`IPFS load failed, trying local fallback for ${nftIdMatch}: ${localPathToTry}`);
              
              // Load the local image
              const localImg = new Image();
              localImg.onload = () => {
                if (!isMounted) return;
                
                console.log(`Local fallback succeeded for ${src}: ${localPathToTry}`);
                setLoadState(prev => ({
                  ...prev,
                  loading: false,
                  fullLoaded: true,
                  error: false,
                  src: localPathToTry
                }));
              };
              
              localImg.onerror = () => {
                if (!isMounted) return;
                // If specific local fallback failed, try a fixed fallback from the set
                tryFixedLocalFallback();
              };
              
              localImg.src = localPathToTry;
              return;
            } else {
              // No ID found, try fixed fallbacks
              tryFixedLocalFallback();
              return;
            }
          }
          
          // Try one of the fixed local fallback images
          function tryFixedLocalFallback() {
            // Use a deterministic selection from available previews based on src string
            const hashCode = src.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            
            const previewImages = ['0119.png', '0171.png', '0327.png', '0416.png', '0418.png', '0579.png'];
            const index = Math.abs(hashCode) % previewImages.length;
            const fallbackPath = `/nft-previews/${previewImages[index]}`;
            
            console.log(`Using fixed local fallback: ${fallbackPath}`);
            
            const fixedImg = new Image();
            fixedImg.onload = () => {
              if (!isMounted) return;
              
              setLoadState(prev => ({
                ...prev,
                loading: false,
                fullLoaded: true,
                error: false,
                src: fallbackPath
              }));
            };
            
            fixedImg.onerror = () => {
              if (!isMounted) return;
              // All fallbacks failed, use placeholder
              usePlaceholder();
            };
            
            fixedImg.src = fallbackPath;
          }
          
          // Option 3: Use placeholder as last resort
          usePlaceholder();
          
          // Helper function for creating placeholders
          function usePlaceholder() {
            // Try to use a generated placeholder based on NFT name or number
            const nftIdMatch = typeof src === 'string' && src.match(/\/([0-9]{3,4})\./);
            let placeholderSrc = '';
            
            if (nftIdMatch && nftIdMatch[1]) {
              // Create a special placeholder for NFTs with ID
              const nftNumber = nftIdMatch[1];
              placeholderSrc = createPlaceholder(`SOLARA #${nftNumber}`, null, { 
                gradient: true, 
                blur: false 
              });
            } else {
              // Generic placeholder for other images
              placeholderSrc = '/placeholder-nft.png';
            }
            
            console.warn(`Failed to load image after all attempts: ${src} - using placeholder`);
            
            // No thumbnail, show error placeholder
            setLoadState(prev => ({
              ...prev,
              loading: false,
              error: true,
              src: placeholderSrc
            }));
            
            if (onError) onError();
          }
        }
      } catch (err) {
        if (!isMounted) return;
        
        // console.error(`Image loading error: ${err.message}`); // Comment out to reduce console noise
        setLoadState(prev => ({
          ...prev,
          loading: false,
          error: true,
          src: createPlaceholder(alt || "Error", null, { gradient: true })
        }));
        
        if (onError) onError();
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
      // Clean up image references and prevent potential memory leaks
      if (thumbnailRef.current) {
        thumbnailRef.current.onload = null;
        thumbnailRef.current.onerror = null;
        thumbnailRef.current.src = ''; // Stop any pending requests
        thumbnailRef.current = null;
      }
      if (fullImageRef.current) {
        fullImageRef.current.onload = null;
        fullImageRef.current.onerror = null;
        fullImageRef.current.src = ''; // Stop any pending requests
        fullImageRef.current = null;
      }
      // Clear set of attempted URLs
      attemptedUrls.current = new Set();
    };
  }, [src, alt, inView, lazyLoad, priority, highQuality, quality, onLoad, onError, loadState.thumbnailLoaded, loadState.fullLoaded, loadState.stage]);
  
  // Determine if we should apply blur effect to thumbnail
  const shouldApplyBlur = blur && loadState.thumbnailLoaded && !loadState.fullLoaded;
  
  // Enhanced loading indicator based on state
  const renderLoadingIndicator = () => {
    if (!loadState.loading) return null;
    
    // Different styles based on loading stage
    if (loadState.stage === 'thumbnail' || !loadState.thumbnailLoaded) {
      // Initial loading stage - 로딩 애니메이션 개선
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-white/70">Loading NFT...</span>
          </div>
        </div>
      );
    } else {
      // Thumbnail loaded, waiting for full image - more subtle indicator
      return (
        <div className="absolute bottom-2 right-2 p-1 bg-black/30 rounded-full">
          <div className="w-4 h-4 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
  };

  return (
    <div 
      ref={setRefs} 
      className={`relative overflow-hidden ${className}`} 
      {...props}
    >
      {/* Main image with blur effect on thumbnail */}
      <img
        src={loadState.src}
        alt={alt || "Image"}
        className={`w-full h-full object-cover transition-all duration-500 ease-in-out
                    ${loadState.loading && !loadState.thumbnailLoaded ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'}
                    ${shouldApplyBlur ? 'filter blur-sm' : ''}`}
        loading={priority ? "eager" : lazyLoad ? "lazy" : "eager"}
        decoding="async"
        fetchpriority={priority ? "high" : "auto"}
      />
      
      {/* Loading indicators */}
      {renderLoadingIndicator()}
      
      {/* Error state overlay - 로딩 스타일로 변경 */}
      {loadState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm">
          <div className="text-center p-2 animate-pulse">
            <div className="w-12 h-12 mx-auto border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs text-gray-300">Loading NFT image...</p>
          </div>
        </div>
      )}
    </div>
  );
}