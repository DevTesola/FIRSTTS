import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

/**
 * BlogMediaOptimizedV2 Component
 * 미디어 최적화 컴포넌트
 * - Next.js Image 컴포넌트 활용 (PNG/JPG)
 * - GIF는 일반 img 태그 사용
 * - 레이아웃 시프트 방지
 */
export const BlogMediaOptimizedV2 = ({ 
  src, 
  alt, 
  className = '',
  priority = false,
  width,
  height,
  aspectRatio = '16/9',
  quality = 85,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: width || 400, height: height || 300 });
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
    threshold: 0
  });

  const isVideo = src?.endsWith('.mp4') || src?.endsWith('.webm');
  const isGif = src?.endsWith('.gif');
  
  // 이미지 차원 계산
  useEffect(() => {
    if (!width || !height) {
      const [w, h] = aspectRatio.split('/').map(Number);
      const containerWidth = 800;
      const calculatedHeight = (containerWidth * h) / w;
      setImageDimensions({
        width: containerWidth,
        height: calculatedHeight
      });
    } else {
      setImageDimensions({ width, height });
    }
  }, [width, height, aspectRatio]);
  
  // 최적화된 소스 경로 계산
  const getOptimizedSrc = () => {
    // PNG/JPG는 WebP 버전 사용
    if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg')) {
      const pathParts = src.split('/');
      const fileName = pathParts.pop();
      const basePath = pathParts.join('/');
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      return `${basePath}/optimized/${fileNameWithoutExt}.webp`;
    }
    
    return src;
  };


  // 비디오 컴포넌트
  if (isVideo) {
    return (
      <div 
        ref={ref} 
        className={`relative overflow-hidden rounded-lg ${className}`}
        style={{ aspectRatio }}
      >
        {inView && (
          <video
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            controls={controls}
            playsInline
            preload={priority ? "auto" : "none"}
            className="w-full h-full object-cover"
            onLoadedData={() => setIsLoading(false)}
            onError={() => setError(true)}
          >
            <source src={src} type={`video/${src.split('.').pop()}`} />
          </video>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <p className="text-gray-400">Failed to load video</p>
          </div>
        )}
      </div>
    );
  }

  // 이미지 컴포넌트
  const optimizedSrc = getOptimizedSrc();
  
  // GIF 파일은 img 태그로 처리 (Next.js Image가 GIF 최적화를 잘못 처리함)
  if (isGif) {
    return (
      <div 
        ref={ref} 
        className={`relative ${className}`}
        style={{ aspectRatio, overflow: 'hidden' }}
      >
        {inView ? (
          <>
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover rounded-lg"
              loading={priority ? "eager" : "lazy"}
              onLoad={() => {
                console.log('GIF loaded:', src);
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error('GIF load error:', src, e);
                setError(true);
                setIsLoading(false);
              }}
              style={{ display: 'block' }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse rounded-lg" />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse rounded-lg" />
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
            <p className="text-gray-400">Failed to load GIF</p>
          </div>
        )}
      </div>
    );
  }
  
  // 일반 이미지는 Next.js Image 사용
  return (
    <div 
      ref={ref} 
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio }}
    >
      {!inView && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
      )}
      {inView && (
        <>
          <Image
            src={optimizedSrc}
            alt={alt}
            width={imageDimensions.width || 400}
            height={imageDimensions.height || 300}
            quality={quality}
            priority={priority}
            className="object-cover"
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => {
              setError(true);
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
          )}
        </>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <p className="text-gray-400">Failed to load image</p>
        </div>
      )}
    </div>
  );
};


// 블로그 히어로 이미지용 특화 컴포넌트
export const BlogHeroMediaOptimizedV2 = ({ 
  src, 
  alt, 
  className = '', 
  children,
  height = 400, // 600에서 400으로 줄임
  ...props 
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
      <BlogMediaOptimizedV2
        src={src}
        alt={alt}
        priority={true}
        width={1200}
        height={height}
        aspectRatio="3/1" // 2/1에서 3/1로 변경하여 더 넓고 낮게
        quality={90}
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


export default BlogMediaOptimizedV2;