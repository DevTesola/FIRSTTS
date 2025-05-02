"use client";

import React, { useState, useEffect } from "react";

// Set your custom IPFS gateway as the only gateway
const CUSTOM_IPFS_GATEWAY = process.env.NEXT_PUBLIC_CUSTOM_IPFS_GATEWAY || "https://tesola.mypinata.cloud";

/**
 * Progressive loading image component with custom IPFS gateway
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Image alt text
 * @param {string} placeholder - Low-res placeholder image URL (optional)
 * @param {function} onLoad - Callback function when image loading completes (optional)
 * @param {function} onError - Callback function when image loading fails (optional)
 * @param {Object} props - Other image attributes
 */
export default function ProgressiveImage({
  src,
  alt,
  placeholder = "",
  onLoad,
  onError,
  className = "",
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(placeholder || src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Process image URL to use custom IPFS gateway
  const processImageUrl = (url) => {
    if (!url) return "";
    
    // Handle IPFS URLs with your custom gateway
    if (url.startsWith('ipfs://')) {
      return `${CUSTOM_IPFS_GATEWAY}/ipfs/${url.replace('ipfs://', '')}`;
    }
    
    // Replace any other IPFS gateways with your custom one
    const knownGateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/', 
      'https://ipfs.infura.io/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    
    for (const gateway of knownGateways) {
      if (url.includes(gateway)) {
        const cid = url.split(gateway)[1];
        return `${CUSTOM_IPFS_GATEWAY}/ipfs/${cid}`;
      }
    }
    
    return url;
  };

  // 이미지 로드 상태 관리
  useEffect(() => {
    // 이미지가 없거나 이미 오류가 있는 경우 처리
    if (!src || error) return;

    // Process source URL with custom gateway
    const processedSrc = processImageUrl(src);
    
    // 현재 로딩 중인 이미지와 다른 이미지가 제공된 경우 초기화
    if (processedSrc !== imgSrc) {
      setIsLoading(true);
      setImgSrc(placeholder || processedSrc);
    }

    // 실제 이미지 미리 로드
    const img = new Image();
    img.src = processedSrc;

    // 로드 완료 처리
    img.onload = () => {
      setImgSrc(processedSrc);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    // 로드 실패 처리
    img.onerror = () => {
      console.error(`Failed to load image: ${processedSrc}`);
      setError(true);
      setIsLoading(false);
      if (onError) onError();
    };

    // 컴포넌트 언마운트 시 이미지 이벤트 정리
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder, imgSrc, error, onLoad, onError]);

  // 폴백 이미지 URL 생성
  const generateFallbackUrl = () => {
    // NFT 이름 추출 (파일명에서)
    const nftId = src.split('/').pop()?.split('.')[0] || "NFT";
    
    // 색상 계산 (NFT ID 기반으로 일관성 있는 색상 생성)
    let hash = 0;
    for (let i = 0; i < nftId.length; i++) {
      hash = nftId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    const bgColor = `hsl(${hue}, 70%, 25%)`;
    
    // SVG 데이터 URL 사용 (CORS 우회)
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='${encodeURIComponent(bgColor)}' /%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' text-anchor='middle' fill='white' dominant-baseline='middle'%3ESOLARA ${nftId}%3C/text%3E%3C/svg%3E`;
  };

  // 에러가 발생하면 폴백 이미지 표시
  if (error) {
    return (
      <div className={`relative overflow-hidden ${className}`} {...props}>
        <img
          src={generateFallbackUrl()}
          alt={alt || "Image unavailable"}
          className={`${className} w-full h-full object-cover`}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-white">Unable to load image</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      {/* 실제 이미지 */}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} w-full h-full object-cover ${isLoading ? 'opacity-60' : 'opacity-100'} transition-opacity duration-300`}
      />
      
      {/* 로딩 인디케이터 - 이미지가 로딩 중일 때만 표시 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}