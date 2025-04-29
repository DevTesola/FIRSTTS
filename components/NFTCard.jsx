"use client";

import React, { useState } from "react";
import ProgressiveImage from "./ProgressiveImage";

/**
 * NFT 카드 컴포넌트
 * 
 * @param {Object} nft - NFT 데이터 객체
 * @param {function} onClick - 클릭 이벤트 핸들러
 * @param {boolean} showActions - 액션 버튼 표시 여부 (옵션)
 */
export default function NFTCard({ nft, onClick, showActions = false }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // NFT 데이터에서 필요한 정보 추출
  const { image, name, mint, tier = "Unknown" } = nft;
  
  // 이름 포맷팅 (너무 긴 경우 잘라내기)
  const formattedName = name && name.length > 25 
    ? `${name.substring(0, 22)}...` 
    : name || "SOLARA NFT";
  
  // 민트 주소 포맷팅 (앞뒤 4자리만 표시)
  const shortMint = mint 
    ? `${mint.slice(0, 4)}...${mint.slice(-4)}` 
    : "";

  return (
    <div 
      className={`border border-purple-500 rounded-lg overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer transform hover:scale-[1.02] duration-200 bg-gray-900/50 ${isImageLoaded ? 'loaded' : 'loading'}`}
      onClick={onClick}
    >
      <div className="relative aspect-square">
        <ProgressiveImage 
          src={image} 
          alt={formattedName}
          className="w-full h-full object-cover"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageLoaded(true)}
          placeholder="/placeholder-nft.jpg" // 저해상도 플레이스홀더 이미지 (필요시 추가)
        />
        
        {/* NFT 정보 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
          <p className="text-white font-semibold truncate">{formattedName}</p>
          <div className="flex justify-between items-center">
            <p className="text-purple-300 text-sm">{tier}</p>
            {shortMint && <p className="text-gray-400 text-xs font-mono">{shortMint}</p>}
          </div>
        </div>
      </div>
      
      {/* 액션 버튼들 (조건부 렌더링) */}
      {showActions && (
        <div className="p-3 bg-gray-800 flex justify-between items-center gap-2">
          <button 
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md flex-1"
            onClick={(e) => {
              e.stopPropagation(); // 카드 클릭 이벤트 방지
              window.open(`https://solscan.io/token/${mint}?cluster=devnet`, '_blank');
            }}
          >
            View
          </button>
          <button 
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md flex-1"
            onClick={(e) => {
              e.stopPropagation(); // 카드 클릭 이벤트 방지
              // 트윗 공유 기능 구현 (기존 로직 활용)
              alert('Tweet sharing will be implemented here');
            }}
          >
            Share
          </button>
        </div>
      )}
    </div>
  );
}