import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';

// 기존 최적화 컴포넌트들 활용
const EnhancedProgressiveImage = dynamic(() => import('./EnhancedProgressiveImage'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg" />,
  ssr: false
});

/**
 * BlogMediaHybrid Component
 * GIF는 원본 사용, PNG/JPG는 WebP 최적화 버전 사용
 */
export const BlogMediaHybrid = ({ 
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
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const isVideo = src?.endsWith('.mp4') || src?.endsWith('.webm');
  const isGif = src?.endsWith('.gif');
  
  // PNG/JPG/GIF 모두 WebP로 최적화
  const getOptimizedSrc = () => {
    // PNG/JPG/GIF는 최적화된 WebP 버전 사용
    if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.gif')) {
      const pathParts = src.split('/');
      const fileName = pathParts.pop();
      const basePath = pathParts.join('/');
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      return `${basePath}/optimized/${fileNameWithoutExt}.webp`;
    }
    
    // 기타 형식은 원본 사용
    return src;
  };
  
  const optimizedSrc = getOptimizedSrc();
  
  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e) => {
    console.error('Media load error:', optimizedSrc);
    
    // 최적화된 버전이 실패하면 원본 시도
    if (optimizedSrc !== src) {
      // 원본으로 재시도
      e.target.src = src;
      return;
    }
    
    setError(true);
    setIsLoading(false);
  };

  // 비디오 컴포넌트
  if (isVideo) {
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
            <source src={src} type={`video/${src.split('.').pop()}`} />
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

  // 이미지 - GIF는 원본, PNG/JPG는 WebP 사용
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
export const BlogHeroMediaHybrid = ({ src, alt, className = '', children, ...props }) => {
  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      <BlogMediaHybrid
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

export default BlogMediaHybrid;