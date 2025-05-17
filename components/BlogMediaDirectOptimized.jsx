import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';

// 기존 최적화 컴포넌트들 활용
const EnhancedProgressiveImage = dynamic(() => import('./EnhancedProgressiveImage'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg" />,
  ssr: false
});

/**
 * BlogMediaDirectOptimized Component
 * 직접 최적화된 경로를 사용하는 간단한 접근법
 */
export const BlogMediaDirectOptimized = ({ 
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
  const [currentSrc, setCurrentSrc] = useState(src);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const isVideo = src?.endsWith('.mp4') || src?.endsWith('.webm');
  const isGif = src?.endsWith('.gif');
  
  // GIF는 MP4로, PNG/JPG는 WebP로 최적화
  const getOptimizedSrc = () => {
    if (isGif) {
      // GIF는 애니메이션을 위해 MP4 버전 시도, 없으면 원본
      const mp4Path = src.replace('.gif', '.mp4');
      // MP4 파일이 있는지 확인하는 대신 바로 시도
      return mp4Path;
    }
    
    // PNG/JPG는 최적화된 WebP 버전 사용
    if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg')) {
      const pathParts = src.split('/');
      const fileName = pathParts.pop();
      const basePath = pathParts.join('/');
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      return `${basePath}/optimized/${fileNameWithoutExt}.webp`;
    }
    
    return src;
  };
  
  const optimizedSrc = getOptimizedSrc();
  const shouldUseVideo = isGif || isVideo;
  
  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e) => {
    console.error('Media load error:', currentSrc);
    
    // 최적화된 버전이 실패하면 원본 시도
    if (currentSrc !== src) {
      console.log('Falling back to original source:', src);
      setCurrentSrc(src);
      setError(false);
      return;
    }
    
    setError(true);
    setIsLoading(false);
  };

  // 비디오 컴포넌트 (GIF도 MP4로 렌더링)
  if (shouldUseVideo) {
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
            onError={(e) => {
              // MP4가 없으면 GIF 원본으로 폴백
              if (isGif && currentSrc === optimizedSrc) {
                setCurrentSrc(src);
                return;
              }
              handleError(e);
            }}
          >
            <source src={currentSrc || optimizedSrc} type={`video/${optimizedSrc.split('.').pop()}`} />
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

  // 이미지 - 직접 img 태그 사용 (WebP 우선)
  return (
    <div ref={ref} className={`relative ${className}`}>
      {inView ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse rounded-lg" />
          )}
          <img
            src={optimizedSrc}
            alt={alt}
            className="w-full h-full object-cover rounded-lg"
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
          />
        </>
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

// 블로그 히어로 이미지용 특화 컴포넌트
export const BlogHeroMediaDirect = ({ src, alt, className = '', children, ...props }) => {
  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      <BlogMediaDirectOptimized
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

export default BlogMediaDirectOptimized;