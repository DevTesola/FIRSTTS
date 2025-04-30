"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import ErrorMessage from "./ErrorMessage";

/**
 * NFT 미리보기 및 민팅 컴포넌트
 * 
 * @param {string} mintPrice - 민팅 가격 (예: "1.5 SOL")
 * @param {function} onMint - 민팅 버튼 클릭 시 호출할 콜백
 * @param {boolean} loading - 로딩 상태
 */
export default function NFTPreviewMinter({ mintPrice = "1.5 SOL", onMint, loading = false }) {
  const { publicKey, connected } = useWallet();
  const [previewCollection, setPreviewCollection] = useState([]);
  const [selectedRarity, setSelectedRarity] = useState("all");
  const [error, setError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  // 미리보기용 NFT 데이터 가져오기
  useEffect(() => {
    const fetchPreviewData = async () => {
      setPreviewLoading(true);
      try {
        // 여기서는 미리 정의된 미리보기 데이터를 사용합니다.
        // 실제 환경에서는 API 호출을 통해 미리보기 데이터를 가져올 수 있습니다.
        const previewData = [
          // 레전더리 등급
          {
            id: "preview-legendary-1",
            name: "SOLARA #0113 (Preview)",
            videoUrl: "/nft-previews/0113.mp4", // 비디오 URL (옵션)
            tier: "Legendary",
            attributes: [
              { trait_type: "Background", value: "Cosmic Nebula" },
              { trait_type: "Base", value: "Gold" },
              { trait_type: "Special", value: "Aurora" }
            ],
            description: "A rare Legendary SOLARA NFT with cosmic powers."
          },
          {
            id: "preview-legendary-2",
            name: "SOLARA #0625 (Preview)",
            videoUrl: "/nft-previews/0625.mp4",
            tier: "Legendary",
            attributes: [
              { trait_type: "Background", value: "Deep Space" },
              { trait_type: "Base", value: "Platinum" },
              { trait_type: "Special", value: "Stardust" }
            ],
            description: "One of the rarest Legendary SOLARA NFTs in the galaxy."
          },
          
          // 에픽(Epic) 등급 추가
          {
            id: "preview-epic-1",
            name: "SOLARA #0418 (Preview)",
            image: "/nft-previews/0418.png",
            tier: "Epic",
            attributes: [
              { trait_type: "Background", value: "Galactic Core" },
              { trait_type: "Base", value: "Iridium" },
              { trait_type: "Special", value: "Supernova" }
            ],
            description: "A powerful Epic tier SOLARA NFT with enhanced abilities."
          },
          {
            id: "preview-epic-2",
            name: "SOLARA #0579 (Preview)",
            image: "/nft-previews/0579.png",
            tier: "Epic",
            attributes: [
              { trait_type: "Background", value: "Black Hole" },
              { trait_type: "Base", value: "Obsidian" },
              { trait_type: "Special", value: "Gravitational Lens" }
            ],
            description: "Epic tier SOLARA NFT with mysterious dark energy properties."
          },
          
          // 레어 등급
          {
            id: "preview-rare-1",
            name: "SOLARA #0327 (Preview)",
            image: "/nft-previews/0327.png",
            tier: "Rare",
            attributes: [
              { trait_type: "Background", value: "Moonscape" },
              { trait_type: "Base", value: "Silver" },
              { trait_type: "Special", value: "Comet" }
            ],
            description: "A Rare SOLARA NFT with enhanced lunar properties."
          },
          {
            id: "preview-rare-2",
            name: "SOLARA #0416 (Preview)",
            image: "/nft-previews/0416.png",
            tier: "Rare",
            attributes: [
              { trait_type: "Background", value: "Asteroid Belt" },
              { trait_type: "Base", value: "Titanium" },
              { trait_type: "Special", value: "Meteor" }
            ],
            description: "Rare tier SOLARA NFT formed from cosmic minerals."
          },
          
          // 커먼 등급
          {
            id: "preview-common-1",
            name: "SOLARA #0119 (Preview)",
            image: "/nft-previews/0119.png",
            tier: "Common",
            attributes: [
              { trait_type: "Background", value: "Star Field" },
              { trait_type: "Base", value: "Iron" },
              { trait_type: "Special", value: "None" }
            ],
            description: "A Common SOLARA NFT with standard stellar attributes."
          },
          {
            id: "preview-common-2",
            name: "SOLARA #0171 (Preview)",
            image: "/nft-previews/0171.png",
            tier: "Common",
            attributes: [
              { trait_type: "Background", value: "Milky Way" },
              { trait_type: "Base", value: "Steel" },
              { trait_type: "Special", value: "None" }
            ],
            description: "Common tier SOLARA NFT that represents the basic building blocks of the universe."
          }
        ];
        
        // 실제 이미지가 없는 경우를 위한 색상 생성 함수
        const generateColorFromString = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          
          const hue = hash % 360;
          const saturation = 70 + (hash % 30);
          const lightness = 20 + (hash % 40);
          
          return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        };
        
        // 미리보기 이미지 없는 경우 대체 이미지 생성
        const previewWithPlaceholders = previewData.map(nft => {
            // 모든 NFT에 대해 플레이스홀더 배경색 생성
            const bgColor = generateColorFromString(nft.name);
            nft.placeholderBg = bgColor;
            
            // image가 undefined인 경우 빈 문자열로 설정
            if (!nft.image) {
              nft.image = '';
            }
            
            return nft;
          });
        
        setPreviewCollection(previewWithPlaceholders);
      } catch (err) {
        console.error('Error loading preview data:', err);
        setError('Failed to load NFT previews');
      } finally {
        setPreviewLoading(false);
      }
    };
    
    fetchPreviewData();
  }, []);

  // 선택된 희귀도에 따라 필터링된 미리보기 목록
  const filteredPreviews = selectedRarity === 'all' 
    ? previewCollection
    : previewCollection.filter(nft => nft.tier.toLowerCase() === selectedRarity.toLowerCase());

  // 티어별 색상 클래스
  const getTierColorClass = (tier) => {
    switch(tier.toLowerCase()) {
      case 'legendary':
        return 'text-yellow-400 border-yellow-500';
      case 'epic':
        return 'text-pink-400 border-pink-500';
      case 'rare':
        return 'text-blue-400 border-blue-500';
      case 'common':
      default:
        return 'text-green-400 border-green-500';
    }
  };

  // 실제 토큰 분포 (현실적인 숫자로 제공)
  const actualDistribution = {
    legendary: 50,
    epic: 100,
    rare: 250,
    common: 600
  };

  // 전체 토큰 개수
  const totalTokens = Object.values(actualDistribution).reduce((sum, count) => sum + count, 0);

  // 희귀도 분포 계산 (미리보기용)
  const calculateRarityDistribution = () => {
    const distribution = {
      legendary: 0,
      epic: 0,
      rare: 0,
      common: 0
    };
    
    previewCollection.forEach(nft => {
      const tier = nft.tier.toLowerCase();
      if (distribution.hasOwnProperty(tier)) {
        distribution[tier]++;
      }
    });
    
    return distribution;
  };

  const previewDistribution = calculateRarityDistribution();

  return (
    <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-center">NFT Preview Gallery</h2>
      
      {error && (
        <ErrorMessage 
          message={error}
          type="error"
          className="mb-4"
          onDismiss={() => setError(null)}
        />
      )}
      
      {!error && (
        <>
          <p className="text-gray-300 text-center mb-6">
            Here's a preview of what you might get when minting your SOLARA NFT. Each NFT is randomly generated.
          </p>
          
          {/* 희귀도 필터 */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedRarity('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedRarity === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRarity('legendary')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedRarity === 'legendary'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                }`}
              >
                Legendary ({actualDistribution.legendary})
              </button>
              <button
                onClick={() => setSelectedRarity('epic')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedRarity === 'epic'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-800 text-pink-400 hover:bg-gray-700'
                }`}
              >
                Epic ({actualDistribution.epic})
              </button>
              <button
                onClick={() => setSelectedRarity('rare')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedRarity === 'rare'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-blue-400 hover:bg-gray-700'
                }`}
              >
                Rare ({actualDistribution.rare})
              </button>
              <button
                onClick={() => setSelectedRarity('common')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedRarity === 'common'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-green-400 hover:bg-gray-700'
                }`}
              >
                Common ({actualDistribution.common})
              </button>
            </div>
          </div>
          
          {/* 미리보기 갤러리 */}
          {previewLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPreviews.map((nft) => (
                <div 
                  key={nft.id}
                  className={`rounded-lg overflow-hidden border ${getTierColorClass(nft.tier)} bg-gray-800 flex flex-col hover:shadow-lg hover:transform hover:scale-105 transition-transform`}
                >
                  {/* NFT 이미지 또는 비디오 */}
                  <div className="relative aspect-square" style={{ backgroundColor: nft.placeholderBg }}>
  {nft.videoUrl ? (
    <video 
      src={nft.videoUrl} 
      autoPlay 
      loop 
      muted 
      playsInline 
      onError={(e) => {
        console.error(`Error loading video: ${nft.videoUrl}`, e);
        e.target.style.display = 'none';
      }}
      className="w-full h-full object-cover"
    />
  ) : nft.image && nft.image.startsWith('/') ? (
    <img 
      src={nft.image} 
      alt={nft.name}
      onError={(e) => {
        console.error(`Error loading image: ${nft.image}`, e);
        e.target.style.display = 'none';
      }}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-white text-opacity-80 font-bold">
        SOLARA
      </span>
    </div>
  )}
                    
                    {/* 티어 배지 */}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold ${
                      nft.tier.toLowerCase() === 'legendary' ? 'bg-yellow-600 text-white' :
                      nft.tier.toLowerCase() === 'epic' ? 'bg-pink-600 text-white' :
                      nft.tier.toLowerCase() === 'rare' ? 'bg-blue-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {nft.tier}
                    </div>
                  </div>
                  
                  {/* NFT 정보 */}
                  <div className="p-2">
                    <h3 className="font-medium text-sm truncate">{nft.name}</h3>
                    {nft.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{nft.description}</p>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      {nft.attributes && nft.attributes.slice(0, 2).map((attr, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{attr.trait_type}:</span>
                          <span className="text-gray-300">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 희귀도 분포 정보 */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Rarity Distribution</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-yellow-500 h-full" 
                    style={{ width: `${(actualDistribution.legendary / totalTokens) * 100}%` }}
                    title={`Legendary: ${actualDistribution.legendary}`}
                  ></div>
                  <div 
                    className="bg-pink-500 h-full" 
                    style={{ width: `${(actualDistribution.epic / totalTokens) * 100}%` }}
                    title={`Epic: ${actualDistribution.epic}`}
                  ></div>
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${(actualDistribution.rare / totalTokens) * 100}%` }}
                    title={`Rare: ${actualDistribution.rare}`}
                  ></div>
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${(actualDistribution.common / totalTokens) * 100}%` }}
                    title={`Common: ${actualDistribution.common}`}
                  ></div>
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                  <span>Legendary ({Math.round((actualDistribution.legendary / totalTokens) * 100)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-1"></div>
                  <span>Epic ({Math.round((actualDistribution.epic / totalTokens) * 100)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span>Rare ({Math.round((actualDistribution.rare / totalTokens) * 100)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  <span>Common ({Math.round((actualDistribution.common / totalTokens) * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 민팅 버튼 */}
          <div className="mt-8 text-center">
            <p className="mb-2 text-lg font-medium text-gray-300">Ready to try your luck?</p>
            <button
              onClick={onMint}
              disabled={loading || !connected}
              className="mint-button inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Mint Now ({mintPrice})
                  <span className="ml-3">
                    <img src="/logo2.png" alt="SOLARA Logo" width={32} height={32} className="inline-block" />
                  </span>
                </>
              )}
            </button>
            
            {!connected && (
              <p className="mt-2 text-red-400 text-sm">Please connect your wallet first</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}