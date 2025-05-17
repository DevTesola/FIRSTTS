import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';

// 기존 최적화 컴포넌트들 활용
const EnhancedProgressiveImage = dynamic(() => import('./EnhancedProgressiveImage'), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg" />,
  ssr: false
});

/**
 * SimpleBlogMedia Component - 블로그 페이지를 위한 간단한 미디어 컴포넌트
 * GIF 파일을 직접 로드하면서 최적화된 버전이 있을 때만 사용
 */
export const SimpleBlogMedia = ({ 
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
  
  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e) => {
    console.error('Media load error:', src);
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

  // GIF 및 일반 이미지 - 직접 img 태그 사용
  if (isGif) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        {inView ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 animate-pulse rounded-lg" />
            )}
            <img
              src={src}
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
  }

  // 일반 이미지 - EnhancedProgressiveImage 사용
  return (
    <div ref={ref} className={`relative ${className}`}>
      {inView ? (
        <EnhancedProgressiveImage
          src={src}
          alt={alt}
          priority={priority}
          lazyLoad={!priority}
          highQuality={false}
          quality={75}
          className="w-full h-full object-cover rounded-lg"
          onLoad={handleLoad}
          onError={handleError}
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
export const SimpleBlogHeroMedia = ({ src, alt, className = '', children, ...props }) => {
  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      <SimpleBlogMedia
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
export const SimpleBlogContentImage = ({ src, alt, className = '', ...props }) => {
  return (
    <div className={`my-6 ${className}`}>
      <SimpleBlogMedia
        src={src}
        alt={alt}
        priority={false}
        className="w-full rounded-lg shadow-xl shadow-purple-900/30"
        {...props}
      />
    </div>
  );
};

export default SimpleBlogMedia;