import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';

// 기존 최적화 컴포넌트들 활용
const EnhancedProgressiveImage = dynamic(() => import('./EnhancedProgressiveImage'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg" />,
  ssr: false
});

/**
 * BlogMediaOptimized Component - 블로그 페이지를 위한 최적화된 미디어 컴포넌트
 * optimized 폴더에서 WebP 버전을 우선 찾고, 없으면 원본 사용
 */
export const BlogMediaOptimized = ({ 
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
    
    setError(true);
    setIsLoading(false);
  };
  
  // 최적화된 소스 확인 및 설정
  useEffect(() => {
    if (!src || !inView) return;
    
    const checkOptimizedVersion = async () => {
      const pathParts = src.split('/');
      const fileName = pathParts.pop();
      const basePath = pathParts.join('/');
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      
      // optimized 폴더에서 WebP 버전 확인
      const optimizedWebP = `${basePath}/optimized/${fileNameWithoutExt}.webp`;
      
      try {
        console.log('Checking optimized WebP:', optimizedWebP);
        const response = await fetch(optimizedWebP, { method: 'HEAD' });
        if (response.ok) {
          console.log('Optimized WebP found:', optimizedWebP);
          setOptimizedSrc(optimizedWebP);
          return;
        }
      } catch (e) {
        console.log('Optimized WebP not found, using original');
      }
      
      // GIF의 경우 MP4 버전도 확인
      if (isGif) {
        const mp4Version = src.replace('.gif', '.mp4');
        try {
          const response = await fetch(mp4Version, { method: 'HEAD' });
          if (response.ok) {
            console.log('MP4 version found:', mp4Version);
            setOptimizedSrc(mp4Version);
            return;
          }
        } catch (e) {
          console.log('MP4 not found');
        }
      }
      
      // 원본 사용
      setOptimizedSrc(src);
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

  // 이미지 (WebP 포함)
  return (
    <div ref={ref} className={`relative ${className}`}>
      {inView ? (
        <EnhancedProgressiveImage
          src={optimizedSrc}
          alt={alt}
          priority={priority}
          lazyLoad={!priority}
          highQuality={false}
          quality={85}
          className="w-full h-full object-cover rounded-lg"
          onLoad={handleLoad}
          onError={handleError}
          preferRemote={true}
          disableCacheBusting={true}
        />
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
export const BlogHeroMediaOptimized = ({ src, alt, className = '', children, ...props }) => {
  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      <BlogMediaOptimized
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
export const BlogContentImageOptimized = ({ src, alt, className = '', ...props }) => {
  return (
    <div className={`my-6 ${className}`}>
      <BlogMediaOptimized
        src={src}
        alt={alt}
        priority={false}
        className="w-full rounded-lg shadow-xl shadow-purple-900/30"
        {...props}
      />
    </div>
  );
};

export default BlogMediaOptimized;