"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { 
  processImageUrl, 
  createPlaceholder, 
  getOptimalImageSize, 
  isIPFSUrl,
  preloadImage,
} from "../utils/mediaUtils";

// 이미지 객체 풀
// 메모리 누수 방지를 위해 사용한 후 메모리에서 해제
// 이미지 로딩 성능 개선을 위한 기능
const imagePool = {
  images: new Map(),
  maxSize: 20, // 최대 이미지 객체 수
  getImage: function() {
    // 이미 생성된 사용 가능한 이미지 이용
    for (const [key, img] of this.images.entries()) {
      if (!img.inUse) {
        img.inUse = true;
        return img.element;
      }
    }
    
    // 새 이미지 객체 생성
    if (this.images.size < this.maxSize) {
      const id = `img_${this.images.size}`;
      const img = new Image();
      this.images.set(id, { element: img, inUse: true });
      return img;
    }
    
    // 풀이 가득 차면 새 객체 생성
    return new Image();
  },
  releaseImage: function(img) {
    // 이미지 사용 해제
    for (const [key, imgData] of this.images.entries()) {
      if (imgData.element === img) {
        imgData.inUse = false;
        // 클린업
        img.onload = null;
        img.onerror = null;
        img.src = '';
        return;
      }
    }
  },
  clearPool: function() {
    this.images.clear();
  }
};

// IPFS 게이트웨이 목록 정의
const IPFS_GATEWAYS = [
  'https://tesola.mypinata.cloud/ipfs/',  // 개인 게이트웨이 (최우선)
  'https://gateway.pinata.cloud/ipfs/',    // Pinata 게이트웨이 
  'https://nftstorage.link/ipfs/',         // NFT.Storage (안정적)
  'https://ipfs.io/ipfs/',                 // IPFS.io
  'https://dweb.link/ipfs/',               // Protocol Labs
  'https://cloudflare-ipfs.com/ipfs/'      // Cloudflare
];

function EnhancedProgressiveImage({
  src,
  alt,
  placeholder = "",
  lazyLoad = true,
  quality = 75,
  blur = true,
  priority = false,
  highQuality = false,
  preferRemote = true,
  onLoad,
  onError,
  className = "",
  ...props
}) {
  // 로딩 인디케이터 특수 URL 처리 (loading:indicator)
  if (src === "loading:indicator") {
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
  
  // Use stable cache keys for consistent image loading
  useEffect(() => {
    // If cache busting is disabled, don't add any cache key
    if (props.disableCacheBusting) {
      return;
    }
    
    // Only add cache key for components that need it and don't already have one
    if (props.__source && !props._cacheBust) {
      // Use a stable identifier for caching instead of constantly changing timestamps
      // This prevents image flickering while still allowing proper caching
      if (props.id) {
        // If ID is provided, use it as a stable cache key
        props._cacheBust = `stable-${props.id}`;
      } else if (props.alt) {
        // Use alt text as fallback (typically contains NFT name)
        const simpleId = props.alt.replace(/[^a-z0-9]/gi, '');
        props._cacheBust = `img-${simpleId}`;
      } else {
        // Session-based stable key - changes only on page reload
        props._cacheBust = 'session-stable';
      }
    }
  }, [props.id, props.alt, props.__source, props.disableCacheBusting]);

  // Generate beautiful placeholder with gradient for better UX
  const defaultPlaceholder = useMemo(() => createPlaceholder(alt || "SOLARA", null, { 
    gradient: true, 
    blur: true 
  }), [alt]);

  // Enhanced loading state to track progressive loading stages
  const [loadState, setLoadState] = useState({
    loading: true,
    error: false,
    stage: 'initial',
    src: placeholder || defaultPlaceholder,
    thumbnailLoaded: false,
    fullLoaded: false
  });
  
  const containerRef = useRef(null);
  const fullImageRef = useRef(null);
  const thumbnailRef = useRef(null);
  const attemptedUrls = useRef(new Set());
  const currentGatewayIndex = useRef(0);
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  // Determine screen type for responsive image sizing - memoized for performance
  const screenType = useMemo(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }, []); // Empty deps to calculate only once on mount

  // Optimized IntersectionObserver config to reduce rerenders
  const inViewConfig = useMemo(() => ({
    triggerOnce: !lazyLoad,
    rootMargin: priority ? '400px 0px' : '200px 0px',
    threshold: 0.01
  }), [lazyLoad, priority]);

  // Use enhanced intersection observer for lazy loading
  const { ref: inViewRef, inView } = useInView(inViewConfig);
  
  // Merge refs for the container and intersection observer with null check
  const setRefs = useCallback(node => {
    if (node !== null) {
      containerRef.current = node;
      if (lazyLoad || priority) {
        inViewRef(node);
      }
    }
  }, [inViewRef, lazyLoad, priority]);
  
  // Preload high priority images immediately
  useEffect(() => {
    if (priority && src) {
      preloadImage(src, { 
        width: highQuality ? 1200 : 800, 
        quality: quality,
        optimizeFormat: true
      }).catch(() => {});
    }
  }, [src, priority, highQuality, quality]);
  
  // Load thumbnail image - 성능 개선된 썸네일 로딩 처리
  const loadThumbnail = useCallback(async (processSrc, containerWidth, isIpfs = false) => {
    // Calculate optimal thumbnail size based on container and device
    const thumbnailSize = getOptimalImageSize(Math.min(containerWidth / 2, 300), { 
      screenType,
      isHighQuality: false
    });
    
    // Process thumbnail URL
    const thumbnailUrl = processImageUrl(processSrc, { 
      width: thumbnailSize,
      quality: Math.min(quality, 30),
      optimizeFormat: true,
      useCache: true, // 캐싱 활성화하여 성능 개선
      gatewayIndex: isIpfs ? currentGatewayIndex.current : null,
      preferLocalFiles: false,
      preferRemote: true
    });
    
    // Skip if already attempted
    if (attemptedUrls.current.has(thumbnailUrl)) {
      return null;
    }
    
    attemptedUrls.current.add(thumbnailUrl);
    return thumbnailUrl;
  }, [quality, screenType]);

  // Load full image
  const loadFullImage = useCallback(async (processSrc, containerWidth, isIpfs = false) => {
    // Calculate optimal full image size
    const fullSize = getOptimalImageSize(containerWidth, { 
      screenType,
      isHighQuality: highQuality
    });
    
    // Process full image URL
    const fullUrl = processImageUrl(processSrc, { 
      width: fullSize,
      quality: quality,
      optimizeFormat: true,
      useCache: false,
      gatewayIndex: isIpfs ? currentGatewayIndex.current : null,
      preferLocalFiles: false,
      preferRemote: preferRemote
    });
    
    // Skip if already attempted
    if (attemptedUrls.current.has(fullUrl)) {
      return null;
    }
    
    attemptedUrls.current.add(fullUrl);
    return fullUrl;
  }, [quality, highQuality, preferRemote, screenType]);

  // Main image loading logic
  useEffect(() => {
    // Skip if no source or not in view (unless priority)
    if (!src || (lazyLoad && !inView && !priority)) return;
    
    let isMounted = true;
    currentGatewayIndex.current = 0;
    retryCount.current = 0;
    const isIpfs = isIPFSUrl(src);
    
    const loadImage = async () => {
      try {
        // Get container width for sizing
        const containerWidth = containerRef.current?.clientWidth || 300;
        
        // Start with placeholder if not already loaded
        if (loadState.stage === 'initial') {
          setLoadState(prev => ({
            ...prev,
            stage: 'thumbnail',
            loading: true
          }));
        }
        
        // IPFS URL processing
        let processedSrc = src;
        if (isIpfs) {
          const hashAndPath = src.replace('ipfs://', '');
          processedSrc = `https://tesola.mypinata.cloud/ipfs/${hashAndPath}`;
          
          // Add cache busting as a stable cache key
          // This allows browsers to cache properly while still loading correct images
          if (props._cacheBust) {
            processedSrc += `?cache=${props._cacheBust}`;
          }
        }

        // 병렬 로딩 전략 - 썸네일과 풀 이미지를 동시에 로딩
        // 사용자에게 더 빠른 경험 제공
        const loadBothVersions = async () => {
          try {
            // 썸네일과 풀 이미지 URL 동시에 준비 (병렬 처리)
            const thumbnailUrlPromise = loadState.thumbnailLoaded ? 
              Promise.resolve(null) : 
              loadThumbnail(processedSrc, containerWidth, isIpfs);
              
            const fullUrlPromise = loadState.fullLoaded ? 
              Promise.resolve(null) : 
              loadFullImage(processedSrc, containerWidth, isIpfs);
              
            // 동시에 두 URL 가져오기
            const [thumbnailUrl, fullUrl] = await Promise.all([thumbnailUrlPromise, fullUrlPromise]);
            
            if (!isMounted) return;
            
            // 썸네일 로딩 (아직 로드되지 않았고 URL이 있는 경우)
            if (!loadState.thumbnailLoaded && thumbnailUrl) {
              thumbnailRef.current = imagePool.getImage(); // 풀에서 이미지 객체 가져오기
              
              thumbnailRef.current.onload = () => {
                if (!isMounted) return;
                
                setLoadState(prev => ({
                  ...prev,
                  thumbnailLoaded: true,
                  src: thumbnailUrl,
                  stage: 'thumbnail'
                }));
              };
              
              thumbnailRef.current.onerror = () => {
                if (!isMounted) return;
                
                // 다음 게이트웨이 시도
                if (isIpfs && currentGatewayIndex.current < IPFS_GATEWAYS.length - 1) {
                  currentGatewayIndex.current++;
                  loadImage();
                  return;
                }
              };
              
              thumbnailRef.current.src = thumbnailUrl;
            }
            
            // 풀 이미지 로딩 (아직 로드되지 않았고 URL이 있는 경우)
            if (!loadState.fullLoaded && fullUrl) {
              // 초기 상태를 전체 이미지 로딩으로 업데이트
              if (loadState.stage === 'initial') {
                setLoadState(prev => ({
                  ...prev,
                  stage: 'full',
                  loading: true
                }));
              }
              
              fullImageRef.current = imagePool.getImage(); // 풀에서 이미지 객체 가져오기
              
              fullImageRef.current.onload = () => {
                if (!isMounted) return;
                
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
                
                // Critical error logging
                if (src.includes('tesola.mypinata.cloud') && src.includes('forcereload')) {
                  console.error(`❌ 이미지 로드 실패 (Critical Pinata URL): ${src}`);
                }
                
                // 다음 게이트웨이 시도
                if (isIpfs && currentGatewayIndex.current < IPFS_GATEWAYS.length - 1) {
                  currentGatewayIndex.current++;
                  tryNextGateway();
                  return;
                }
                
                // 다음 대체 전략 시도
                tryNextGateway();
              };
              
              fullImageRef.current.src = fullUrl;
            }
            
            // 둘 다 URL을 가져올 수 없는 경우, 대체 방식 시도
            if ((!loadState.thumbnailLoaded && !thumbnailUrl) && (!loadState.fullLoaded && !fullUrl)) {
              tryNextGateway();
            }
            
          } catch (error) {
            if (!isMounted) return;
            console.error('이미지 로딩 중 오류:', error);
            tryNextGateway();
          }
        };
        
        // 양쪽 동시 로딩 시작
        loadBothVersions();
        
        // Function to load full quality version
        async function loadFullVersion() {
          if (!isMounted) return;
          
          setLoadState(prev => ({
            ...prev,
            stage: 'full',
            loading: !prev.fullLoaded
          }));
          
          // IPFS URL processing for full image
          let processedFullSrc = src;
          if (isIpfs) {
            const hashAndPath = src.replace('ipfs://', '');
            processedFullSrc = `https://tesola.mypinata.cloud/ipfs/${hashAndPath}`;
            
            // Add stable cache key for proper caching behavior
            // This allows different images to be loaded correctly while still using cache
            if (props._cacheBust) {
              processedFullSrc += `?cache=${props._cacheBust}`;
            }
          }
          
          const fullUrl = await loadFullImage(processedFullSrc, containerWidth, isIpfs);
          
          if (fullUrl && isMounted) {
            fullImageRef.current = new Image();
            
            fullImageRef.current.onload = () => {
              if (!isMounted) return;
              
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
              
              // Critical error logging
              if (src.includes('tesola.mypinata.cloud') && src.includes('forcereload')) {
                console.error(`❌ 이미지 로드 실패 (Critical Pinata URL): ${src}`);
              }
              
              // Try next gateway for IPFS URLs
              if (isIpfs && currentGatewayIndex.current < IPFS_GATEWAYS.length - 1) {
                currentGatewayIndex.current++;
                tryNextGateway();
                return;
              }
              
              // Try fallback strategy
              tryNextGateway();
            };
            
            fullImageRef.current.src = fullUrl;
          } else if (isMounted) {
            // Skip to next gateway or fallback
            tryNextGateway();
          }
        }
        
        // Improved fallback strategy
        function tryNextGateway() {
          retryCount.current++;
          
          // For non-IPFS content, handle differently
          if (!isIpfs) {
            if (retryCount.current <= maxRetries) {
              const retryImg = new Image();
              
              retryImg.onload = () => {
                if (!isMounted) return;
                
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
              
              retryImg.src = `${src}?retry=${retryCount.current}`;
              return;
            } else {
              handleFinalError();
              return;
            }
          }
          
          // For IPFS content, try next gateway
          currentGatewayIndex.current++;
          
          if (currentGatewayIndex.current >= IPFS_GATEWAYS.length || retryCount.current > maxRetries) {
            handleFinalError();
            return;
          }
          
          // Try with next gateway
          const containerWidth = containerRef.current?.clientWidth || 300;
          const fullSize = getOptimalImageSize(containerWidth, { 
            screenType,
            isHighQuality: highQuality
          });
          
          const nextUrl = processImageUrl(src, {
            width: fullSize,
            quality: quality,
            optimizeFormat: true,
            useCache: false,
            gatewayIndex: currentGatewayIndex.current
          });
          
          if (attemptedUrls.current.has(nextUrl)) {
            tryNextGateway();
            return;
          }
          
          attemptedUrls.current.add(nextUrl);
          
          const nextImg = new Image();
          
          nextImg.onload = () => {
            if (!isMounted) return;
            
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
            tryNextGateway();
          };
          
          nextImg.src = nextUrl;
        }
        
        // Final error handling
        function handleFinalError() {
          if (!isMounted) return;
          
          // Use thumbnail if already loaded
          if (loadState.thumbnailLoaded) {
            setLoadState(prev => ({
              ...prev,
              loading: false,
              error: false
            }));
            return;
          }
          
          // Set error state for fallback handling
          setLoadState(prev => ({
            ...prev,
            loading: false,
            error: true,
            src: prev.src || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
          }));
          
          if (onError) onError();
        }
      } catch (err) {
        if (!isMounted) return;
        
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
      
      // 리소스 정리 및 메모리 해제 개선
      if (thumbnailRef.current) {
        imagePool.releaseImage(thumbnailRef.current); // 풀로 돌려보내기
        thumbnailRef.current = null;
      }
      
      if (fullImageRef.current) {
        imagePool.releaseImage(fullImageRef.current); // 풀로 돌려보내기
        fullImageRef.current = null;
      }
      
      // Clear attempted URLs
      attemptedUrls.current.clear();
    };
  }, [
    src, 
    alt, 
    inView, 
    lazyLoad, 
    priority, 
    highQuality, 
    quality, 
    onLoad, 
    onError, 
    loadState.thumbnailLoaded, 
    loadState.fullLoaded, 
    loadState.stage,
    loadThumbnail,
    loadFullImage,
    defaultPlaceholder,
    screenType
  ]);
  
  // Determine if we should apply blur effect to thumbnail
  const shouldApplyBlur = blur && loadState.thumbnailLoaded && !loadState.fullLoaded;
  
  // Memoized loading indicator based on state
  const LoadingIndicator = useMemo(() => {
    if (!loadState.loading) return null;
    
    if (loadState.stage === 'thumbnail' || !loadState.thumbnailLoaded) {
      // Initial loading stage - simplified for mobile
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-1"></div>
            <span className="text-xs text-white/70">Loading NFT...</span>
          </div>
        </div>
      );
    } else {
      // Thumbnail loaded, waiting for full image - minimal indicator
      return (
        <div className="absolute bottom-1 right-1 p-1 bg-black/30 rounded-full">
          <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
  }, [loadState.loading, loadState.stage, loadState.thumbnailLoaded]);

  // Memoized error overlay
  const ErrorOverlay = useMemo(() => {
    if (!loadState.error) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-red-900/30 to-purple-900/30 backdrop-blur-sm">
        <div className="text-center p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-red-300">Failed to load image</p>
        </div>
      </div>
    );
  }, [loadState.error]);

  return (
    <div 
      ref={setRefs} 
      className={`relative overflow-hidden ${className}`} 
      {...props}
    >
      <img
        src={loadState.src}
        alt={alt || "Image"}
        className={`w-full h-full object-cover transition-all duration-300 ease-in-out
                    ${loadState.loading && !loadState.thumbnailLoaded ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}
                    ${shouldApplyBlur ? 'filter blur-sm' : ''}`}
        loading={priority ? "eager" : lazyLoad ? "lazy" : "eager"}
        decoding="async"
        fetchpriority={priority ? "high" : "auto"}
      />
      
      {/* Optimized conditional rendering using memoized components */}
      {LoadingIndicator}
      {ErrorOverlay}
    </div>
  );
}

// React.memo를 이용한 최적화 - 불필요한 리렌더링 방지
// 이미지 소스나 새 클래스 이름이 추가되었을 때만 리렌더링
// 기본 리액트 코드 방식을 유지하기 위해 외부에서 memo 적용
export default React.memo(EnhancedProgressiveImage, (prevProps, nextProps) => {
  // src가 변경되었을 때는 반드시 리렌더링
  if (prevProps.src !== nextProps.src) return false;
  
  // 프라이어리티 변경 시 리렌더링
  if (prevProps.priority !== nextProps.priority) return false;
  
  // 클래스네임 변경 시 리렌더링
  if (prevProps.className !== nextProps.className) return false;
  
  // alt 텍스트 변경 시 리렌더링
  if (prevProps.alt !== nextProps.alt) return false;
  
  // 품질 옵션 변경 시 리렌더링
  if (prevProps.quality !== nextProps.quality) return false;
  if (prevProps.highQuality !== nextProps.highQuality) return false;
  if (prevProps.blur !== nextProps.blur) return false;
  
  // 나머지 사례에는 리렌더링 스킵
  return true;
});