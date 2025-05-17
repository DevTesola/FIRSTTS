import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

// 기존 최적화 컴포넌트들 활용
const EnhancedProgressiveImage = dynamic(() => import('./EnhancedProgressiveImage'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg" />,
  ssr: false
});

/**
 * BlogMedia Component - 블로그 페이지를 위한 최적화된 미디어 컴포넌트
 * GIF, MP4, 일반 이미지를 효율적으로 처리
 */
export const BlogMedia = ({ 
  src, 
  alt, 
  className = '',
  priority = false,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const isVideo = src?.endsWith('.mp4') || src?.endsWith('.webm');
  const isGif = src?.endsWith('.gif');
  
  // GIF 파일의 경우 WebP 또는 MP4로 변환된 버전 확인
  const getOptimizedSrc = () => {
    if (!src) return '';
    
    // GIF 최적화 - 변환된 파일이 있는지 확인
    if (isGif) {
      // 먼저 MP4 버전 확인 (가장 효율적)
      const mp4Version = src.replace('.gif', '.mp4');
      const webpVersion = src.replace('.gif', '.webp');
      
      // 클라이언트 사이드에서는 원본 사용
      // 서버 사이드에서 최적화된 버전 체크
      if (typeof window === 'undefined') {
        // 서버 사이드에서는 파일 시스템 체크 가능
        // 하지만 여기서는 단순히 확장자만 변경
        return mp4Version; // MP4 우선
      }
      
      // 클라이언트에서는 원본 사용
      return src;
    }
    
    // 일반 이미지의 경우 WebP 버전 확인
    if (['.jpg', '.jpeg', '.png'].some(ext => src.endsWith(ext))) {
      const webpVersion = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
      
      // 서버 사이드에서만 변환
      if (typeof window === 'undefined') {
        return webpVersion;
      }
    }
    
    return src;
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e) => {
    console.error('Media load error:', optimizedSrc);
    
    // 최적화된 버전이 실패하면 원본 시도
    if (optimizedSrc !== src) {
      console.log('Falling back to original source:', src);
      setOptimizedSrc(src);
      setError(false); // 에러 상태 리셋
      return;
    }
    
    // 원본도 실패하면 에러 상태로
    console.error('Failed to load original source:', src);
    setError(true);
    setIsLoading(false);
  };
  
  // 최적화된 소스 확인 및 설정
  useEffect(() => {
    if (!src || !inView) return;
    
    console.log('Checking optimized version for:', src, 'isGif:', isGif);
    
    const checkOptimizedVersion = async () => {
      let newSrc = src;
      
      if (isGif) {
        // MP4 버전 먼저 시도
        const mp4Version = src.replace('.gif', '.mp4');
        console.log('Checking MP4 version:', mp4Version);
        try {
          const response = await fetch(mp4Version, { method: 'HEAD' });
          if (response.ok) {
            console.log('MP4 version found:', mp4Version);
            newSrc = mp4Version;
          } else {
            // MP4가 없으면 WebP 시도
            const webpVersion = src.replace('.gif', '.webp');
            console.log('Checking WebP version:', webpVersion);
            try {
              const webpResponse = await fetch(webpVersion, { method: 'HEAD' });
              if (webpResponse.ok) {
                console.log('WebP version found:', webpVersion);
                newSrc = webpVersion;
              } else {
                console.log('No optimized versions found, using original GIF');
              }
            } catch (webpError) {
              console.log('WebP check failed:', webpError);
            }
          }
        } catch (mp4Error) {
          console.log('MP4 check failed:', mp4Error);
          // WebP 버전 시도
          const webpVersion = src.replace('.gif', '.webp');
          try {
            const response = await fetch(webpVersion, { method: 'HEAD' });
            if (response.ok) {
              console.log('WebP version found:', webpVersion);
              newSrc = webpVersion;
            } else {
              console.log('No optimized versions found, using original GIF');
            }
          } catch (webpError) {
            console.log('WebP check failed, using original GIF');
          }
        }
      } else if (['.jpg', '.jpeg', '.png'].some(ext => src.endsWith(ext))) {
        // WebP 버전 시도
        const webpVersion = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
        try {
          const response = await fetch(webpVersion, { method: 'HEAD' });
          if (response.ok) {
            newSrc = webpVersion;
          }
        } catch (e) {
          // 원본 사용
        }
      }
      
      console.log('Final optimized src:', newSrc);
      setOptimizedSrc(newSrc);
    };
    
    checkOptimizedVersion();
  }, [src, inView, isGif]);

  // 비디오 컴포넌트 (최적화된 MP4 포함)
  if (isVideo || optimizedSrc?.endsWith('.mp4')) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        {(!inView || isLoading) && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse rounded-lg" />
        )}
        {inView && (
          <video
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            controls={controls}
            playsInline
            preload={priority ? "auto" : "metadata"}
            className="w-full h-full object-cover rounded-lg"
            onLoadedData={handleLoad}
            onError={handleError}
          >
            <source src={optimizedSrc} type={`video/${optimizedSrc.split('.').pop()}`} />
            Your browser does not support the video tag.
          </video>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
            <p className="text-gray-400">Failed to load video</p>
          </div>
        )}
      </div>
    );
  }

  // GIF나 일반 이미지 (WebP 포함)
  return (
    <div ref={ref} className={`relative ${className}`}>
      {inView ? (
        !error ? (
          <EnhancedProgressiveImage
            src={optimizedSrc}
            alt={alt}
            priority={priority}
            lazyLoad={!priority}
            highQuality={false}
            quality={isGif ? 60 : 75} // GIF는 품질 낮춤
            className="w-full h-full object-cover rounded-lg"
            onLoad={handleLoad}
            onError={handleError}
            preferRemote={true}
            disableCacheBusting={isGif} // GIF는 캐시 버스팅 비활성화
          />
        ) : (
          // 에러시 원본으로 폴백
          <img 
            src={src}
            alt={alt}
            className="w-full h-full object-cover rounded-lg"
            onLoad={handleLoad}
            onError={() => setError(true)}
          />
        )
      ) : (
        <div className="animate-pulse bg-gray-800 rounded-lg aspect-video" />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <p className="text-gray-400">Failed to load image</p>
        </div>
      )}
    </div>
  );

};

// 블로그 히어로 이미지/비디오용 특화 컴포넌트
export const BlogHeroMedia = ({ src, alt, className = '', children, ...props }) => {
  const isVideo = src?.endsWith('.mp4') || src?.endsWith('.webm');
  
  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      <BlogMedia
        src={src}
        alt={alt}
        priority={true}
        autoPlay={true}
        loop={true}
        muted={true}
        className="w-full h-full"
        {...props}
      />
      {children}
    </div>
  );
};

// 블로그 콘텐츠 이미지용 특화 컴포넌트
export const BlogContentImage = ({ src, alt, className = '', ...props }) => {
  return (
    <div className={`my-6 ${className}`}>
      <BlogMedia
        src={src}
        alt={alt}
        priority={false}
        className="w-full rounded-lg shadow-xl shadow-purple-900/30"
        {...props}
      />
    </div>
  );
};

export default BlogMedia;