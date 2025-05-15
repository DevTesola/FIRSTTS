import React from "react";

/**
 * Collection Bonus Component
 *
 * Displays information about the bonus users get for staking multiple NFTs
 * from the same collection.
 *
 * Collection Bonus tiers based on on-chain logic:
 * - 0% bonus for 1 NFT
 * - 10% bonus for 2 NFTs
 * - 20% bonus for 3 NFTs (maximum possible)
 *
 * Note: The maximum number of NFTs a user can stake is 3.
 */
const CollectionBonus = ({ stats }) => {
  if (!stats || !stats.activeStakes) {
    return null;
  }

  const stakedCount = stats.activeStakes.length;
  const collectionBonus = stats.stats?.collectionBonus || 0;
  
  // Format bonus as percentage (basis points to percentage)
  const formatBonus = (bonusInBasisPoints) => {
    return (bonusInBasisPoints / 100).toFixed(0) + "%";
  };
  
  // Convert current bonus to percentage
  const currentBonusPercentage = formatBonus(collectionBonus);
  
  // Define bonus tiers based on on-chain logic
  const tiers = [
    { min: 0, max: 0, bonus: 0, label: "0 NFTs", color: "gray" },
    { min: 1, max: 1, bonus: 0, label: "1 NFT", color: "gray" },
    { min: 2, max: 2, bonus: 1000, label: "2 NFTs", color: "blue" },
    { min: 3, max: 3, bonus: 2000, label: "3 NFTs (Max)", color: "yellow" }
  ];
  
  // Find current tier
  const currentTier = tiers.find(tier => 
    stakedCount >= tier.min && stakedCount <= tier.max
  );
  
  // Calculate progress to next tier
  const getNextTier = () => {
    const currentTierIndex = tiers.findIndex(tier => 
      stakedCount >= tier.min && stakedCount <= tier.max
    );
    
    if (currentTierIndex < tiers.length - 1) {
      return tiers[currentTierIndex + 1];
    }
    
    return null;
  };
  
  const nextTier = getNextTier();
  
  // Calculate how many more NFTs needed for next tier
  const nftsToNextTier = nextTier ? nextTier.min - stakedCount : 0;
  
  // Determine progress bar color based on current tier
  const getColorClass = (color) => {
    switch (color) {
      case "green": return "bg-green-500";
      case "blue": return "bg-blue-500";
      case "purple": return "bg-purple-500";
      case "yellow": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };
  
  // Determine text color based on current tier
  const getTextColorClass = (color) => {
    switch (color) {
      case "green": return "text-green-300";
      case "blue": return "text-blue-300";
      case "purple": return "text-purple-300";
      case "yellow": return "text-yellow-300";
      default: return "text-gray-300";
    }
  };
  
  return (
    <div className="bg-gray-800/50 rounded-xl border border-purple-500/20 p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
        Collection Bonus
      </h3>
      
      {/* Current Bonus Section */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-5 border border-gray-700/30">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-gray-400">Current Bonus</p>
            <p className={`text-2xl font-bold ${getTextColorClass(currentTier.color)}`}>
              {currentBonusPercentage}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">NFTs Staked</p>
            <p className="text-2xl font-bold text-white">{stakedCount}</p>
          </div>
        </div>
        
        {nextTier && (
          <div className="text-sm text-gray-400 mt-2">
            Stake <span className="font-medium text-white">{nftsToNextTier} more NFT{nftsToNextTier !== 1 ? 's' : ''}</span> to reach <span className={getTextColorClass(nextTier.color)}>{formatBonus(nextTier.bonus)} bonus</span>
          </div>
        )}
      </div>
      
      {/* Progress Visualization */}
      <div className="space-y-3">
        <p className="text-sm text-gray-400 mb-2">Bonus Tiers</p>
        
        {tiers.map((tier, index) => {
          const isCurrentTier = stakedCount >= tier.min && stakedCount <= tier.max;
          const hasPassed = stakedCount > tier.max;
          
          return (
            <div key={index} className={`rounded-lg p-3 ${isCurrentTier ? 'bg-gray-700/30 border border-purple-500/30' : 'bg-gray-800/30'}`}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getColorClass(tier.color)} mr-2`}></div>
                  <span className={`font-medium ${isCurrentTier ? getTextColorClass(tier.color) : 'text-gray-300'}`}>
                    {tier.label}
                  </span>
                </div>
                <span className={`font-medium ${isCurrentTier ? 'text-white' : 'text-gray-400'}`}>
                  {formatBonus(tier.bonus)} bonus
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className={`${getColorClass(tier.color)} h-2 rounded-full ${hasPassed ? 'w-full' : isCurrentTier ? `w-[${Math.floor((stakedCount - tier.min) / (tier.max - tier.min + 1) * 100)}%]` : 'w-0'}`}
                  style={{ 
                    width: hasPassed ? '100%' : isCurrentTier 
                      ? `${Math.floor((stakedCount - tier.min) / (tier.max - tier.min + 1) * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
              
              {isCurrentTier && (
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{stakedCount}/{tier.max}</span>
                  <span>{nextTier ? `${nftsToNextTier} more to ${formatBonus(nextTier.bonus)}` : 'Max tier reached'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Bonus Explanation */}
      <div className="mt-5 p-3 bg-purple-900/20 rounded-lg border border-purple-500/10">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How Collection Bonus Works
        </h4>
        <p className="text-sm text-gray-300">
          The more NFTs you stake from the same collection, the higher your bonus reward rate.
          With 2 NFTs, you get a 10% bonus. With 3 NFTs (maximum), you get a 20% bonus.
          This bonus applies to all your staked NFTs from this collection.
        </p>
      </div>
    </div>
  );
};

export default CollectionBonus;