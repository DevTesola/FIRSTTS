// 탭 콘텐츠 렌더링 함수
const renderTabContent = () => {
  if (!connected) {
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Connect your wallet to see your SOLARA NFTs</p>
        <div className="mt-4 flex justify-center">
          <WalletMultiButton />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mb-6">
        <ErrorMessage 
          message={error}
          type="error"
          errorDetails={errorDetails}
          onRetry={handleRetry}
          onDismiss={() => {
            setError(null);
            setErrorDetails(null);
          }}
        />
      </div>
    );
  }
  
  // 컬렉션 탭
  if (activeTab === "collection") {
    if (loading) {
      return (
        <div className="py-12">
          <p className="text-center text-gray-400 mb-8">Loading your NFTs...</p>
          <LoadingSkeleton type="nft" count={6} />
        </div>
      );
    }
    
    if (ownedNFTs.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl mb-4">You don't own any SOLARA NFTs yet</p>
          <PrimaryButton
            onClick={() => router.push('/')}
            className="mx-auto"
          >
            Mint Your First NFT
          </PrimaryButton>
        </div>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ownedNFTs.map((nft) => {
            // Format NFT name to ensure 4-digit ID display
            if (nft.name && nft.name.includes('#')) {
              nft.name = nft.name.replace(/#(\d+)/, (match, id) => 
                `#${String(id).padStart(4, '0')}`
              );
            }
            
            return (
              <div 
                key={nft.mint} 
                className="border border-purple-500/30 rounded-lg overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer transform hover:scale-[1.02] duration-200 bg-gray-900/50"
                onClick={() => handleNFTClick(nft)}
              >
                <div className="relative aspect-square">
                  <EnhancedProgressiveImage 
                    src={nft.image} 
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    lazyLoad={true}
                    quality={85}
                  />
                  
                  {/* NFT info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white font-semibold truncate">{nft.name}</p>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm ${
                        (nft.tier?.toLowerCase() || '').includes('legendary') ? 'text-yellow-300' :
                        (nft.tier?.toLowerCase() || '').includes('epic') ? 'text-purple-300' :
                        (nft.tier?.toLowerCase() || '').includes('rare') ? 'text-blue-300' :
                        'text-green-300'
                      }`}>{nft.tier}</p>
                      {nft.mint && <p className="text-gray-400 text-xs font-mono">{nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}</p>}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="p-3 bg-gray-800/80 backdrop-blur-sm flex justify-between items-center gap-2">
                  <SecondaryButton 
                    size="small" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click event
                      window.open(`https://solscan.io/token/${nft.mint}?cluster=devnet`, '_blank');
                    }}
                  >
                    View
                  </SecondaryButton>
                  <SecondaryButton 
                    size="small" 
                    className={`flex-1 ${
                      checkNftFullyShared(nft) 
                        ? 'bg-green-700/50 border-green-500/50' 
                        : checkNftPartiallyShared(nft) 
                          ? 'bg-yellow-700/50 border-yellow-500/50'
                          : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click event
                      handleShare(nft);
                    }}
                    disabled={checkNftFullyShared(nft)}
                  >
                    {checkNftFullyShared(nft) 
                      ? '✓ Fully Shared' 
                      : checkNftPartiallyShared(nft)
                        ? '½ Partial Rewards' 
                        : 'Share'}
                  </SecondaryButton>
                  <PrimaryButton 
                    size="small" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click event
                      handleStake(nft);
                    }}
                  >
                    Stake
                  </PrimaryButton>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page buttons */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Show first page, last page, current page and 1 page on each side of current
                const showPageButton = pageNum === 1 || 
                                      pageNum === totalPages || 
                                      Math.abs(pageNum - currentPage) <= 1;
                                    
                // Show ellipsis
                if (!showPageButton && (pageNum === currentPage - 2 || pageNum === currentPage + 2)) {
                  return (
                    <span
                      key={`ellipsis-${pageNum}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300"
                    >
                      ...
                    </span>
                  );
                }
                
                if (!showPageButton) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium ${
                      currentPage === pageNum 
                        ? 'bg-purple-700 text-white' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
        
        {/* NFT 수량 표시 */}
        {totalNFTs > 0 && (
          <div className="text-center mt-6 text-gray-400">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalNFTs)}-
            {Math.min(currentPage * itemsPerPage, totalNFTs)} of {totalNFTs} NFTs
          </div>
        )}
      </>
    );
  }
  
  // 리워드 대시보드 탭 (기존 스테이킹 대시보드를 개선)
  if (activeTab === "staking") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* 스테이킹된 NFTs 목록 추가 */}
          <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Currently Staked NFTs
            </h3>
            
            {loadingStaked ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-gray-700 rounded-lg"></div>
                <div className="h-16 bg-gray-700 rounded-lg"></div>
                <div className="h-16 bg-gray-700 rounded-lg"></div>
              </div>
            ) : !stakedNFTs || stakedNFTs.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-400 mb-2">No Staked NFTs</h4>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  You don't have any staked SOLARA NFTs yet. Stake your NFTs to earn TESOLA rewards.
                </p>
                <PrimaryButton
                  onClick={() => setActiveTab("collection")}
                  size="small"
                >
                  Go to Collection
                </PrimaryButton>
              </div>
            ) : (
              <div className="space-y-3">
                {stakedNFTs.map((stake) => (
                  <div 
                    key={stake.mint_address} 
                    className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/20 hover:border-purple-400/40 transition-all"
                  >
                    <div className="flex items-center">
                      <div className="w-14 h-14 mr-3 relative rounded overflow-hidden bg-gray-800">
                        {stake.image_url && (
                          <img 
                            src={stake.image_url} 
                            alt={stake.nft_name || "Staked NFT"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder-nft.jpg";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{stake.nft_name || "SOLARA NFT"}</h4>
                            <p className="text-xs text-gray-400">{new Date(stake.staked_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-yellow-400">{stake.earned_so_far || 0} TESOLA</p>
                            <p className="text-xs text-gray-300">of {stake.total_rewards}</p>
                          </div>
                        </div>
                        
                        {/* Progress bar for staking progress */}
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{width: `${stake.progress_percentage || 0}%`}}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-gray-400">
                            <span>{Math.floor(stake.progress_percentage || 0)}%</span>
                            <span>Unlocks: {new Date(stake.release_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 스테이킹 대시보드 */}
          <StakingDashboard 
            stats={stakingStats} 
            isLoading={loadingStaked} 
            onRefresh={fetchStakedNFTs}
          />
        </div>
        <div>
          <StakingRewards 
            stats={stakingStats} 
            isLoading={loadingStaked}
          />
        </div>
      </div>
    );
  }
  
  // 리더보드 탭 - 최상위 탭으로 이동
  if (activeTab === "leaderboard") {
    return (
      <Leaderboard 
        stats={stakingStats}
        isLoading={loadingStaked}
        onRefresh={fetchStakedNFTs}
      />
    );
  }
  
  // NFT 분석 탭 (기존 Stake NFTs 대신 더 유용한 정보 제공)
  if (activeTab === "stake") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              NFT Collection Metrics
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-700 rounded-lg"></div>
                <div className="h-24 bg-gray-700 rounded-lg"></div>
              </div>
            ) : ownedNFTs.length === 0 ? (
              <div className="text-center py-10 bg-gray-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-400 mb-1">No Data Available</h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  You don't have any SOLARA NFTs in your collection yet. Mint or purchase NFTs to see your collection analytics.
                </p>
              </div>
            ) : (
              <>
                {/* NFT Tier Distribution Chart (Simplified visualization) */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-300 mb-3">Tier Distribution</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="flex items-end h-48 space-x-4 justify-center">
                      {/* Calculate tier counts */}
                      {(() => {
                        const tierCounts = {
                          LEGENDARY: ownedNFTs.filter(nft => 
                            nft.tier?.toUpperCase().includes('LEGEND')).length,
                          EPIC: ownedNFTs.filter(nft => 
                            nft.tier?.toUpperCase().includes('EPIC')).length,
                          RARE: ownedNFTs.filter(nft => 
                            nft.tier?.toUpperCase().includes('RARE')).length,
                          COMMON: ownedNFTs.filter(nft => 
                            !nft.tier?.toUpperCase().includes('LEGEND') && 
                            !nft.tier?.toUpperCase().includes('EPIC') && 
                            !nft.tier?.toUpperCase().includes('RARE')).length
                        };
                        
                        // Calculate max value for scaling
                        const maxCount = Math.max(...Object.values(tierCounts), 1);
                        
                        // Render bars
                        return (
                          <>
                            <div className="flex flex-col items-center">
                              <div 
                                className="w-16 bg-yellow-500/80 hover:bg-yellow-500 transition-all rounded-t-md"
                                style={{ height: `${(tierCounts.LEGENDARY / maxCount) * 100}%` }}
                              ></div>
                              <p className="mt-2 text-xs font-medium text-yellow-400">Legendary</p>
                              <p className="text-sm">{tierCounts.LEGENDARY}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div 
                                className="w-16 bg-purple-500/80 hover:bg-purple-500 transition-all rounded-t-md"
                                style={{ height: `${(tierCounts.EPIC / maxCount) * 100}%` }}
                              ></div>
                              <p className="mt-2 text-xs font-medium text-purple-400">Epic</p>
                              <p className="text-sm">{tierCounts.EPIC}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div 
                                className="w-16 bg-blue-500/80 hover:bg-blue-500 transition-all rounded-t-md"
                                style={{ height: `${(tierCounts.RARE / maxCount) * 100}%` }}
                              ></div>
                              <p className="mt-2 text-xs font-medium text-blue-400">Rare</p>
                              <p className="text-sm">{tierCounts.RARE}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div 
                                className="w-16 bg-green-500/80 hover:bg-green-500 transition-all rounded-t-md"
                                style={{ height: `${(tierCounts.COMMON / maxCount) * 100}%` }}
                              ></div>
                              <p className="mt-2 text-xs font-medium text-green-400">Common</p>
                              <p className="text-sm">{tierCounts.COMMON}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* More content as before... */}
              </>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-5 border border-purple-500/20 h-full">
            {/* Content as before... */}
          </div>
        </div>
      </div>
    );
  }
  
  // If no tab matches (shouldn't happen)
  return null;
};