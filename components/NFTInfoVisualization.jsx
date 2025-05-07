"use client";

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import EnhancedProgressiveImage from './EnhancedProgressiveImage';
import { createPlaceholder, getNftPreviewImage } from "../utils/mediaUtils";

/**
 * NFT Info Visualization Component - Optimized for Performance
 * 
 * @param {string} tierDistribution - Tier distribution object (with ratios)
 */
const NFTInfoVisualization = ({ tierDistribution }) => {
  const [activeTab, setActiveTab] = useState('rarity');
  const [animationCompleted, setAnimationCompleted] = useState(false);
  
  // Default distribution as a memoized value
  const defaultDistribution = useMemo(() => ({
    legendary: { ratio: 5, color: 'yellow' },
    epic: { ratio: 15, color: 'purple' },
    rare: { ratio: 30, color: 'blue' },
    common: { ratio: 50, color: 'green' }
  }), []);
  
  // Use memoized distribution value
  const distribution = useMemo(() => 
    tierDistribution || defaultDistribution
  , [tierDistribution, defaultDistribution]);
  
  // Animation effect with improved cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationCompleted(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Memoized tier traits data
  const tierTraits = useMemo(() => ({
    legendary: [
      { name: 'Cosmic Nexus', probability: 80 },
      { name: 'Stellar Halo', probability: 75 },
      { name: 'Quantum Core', probability: 70 }
    ],
    rare: [
      { name: 'Galactic Wind', probability: 60 },
      { name: 'Nebula Cloud', probability: 55 },
      { name: 'Astral Glow', probability: 50 }
    ],
    uncommon: [
      { name: 'Solar Flare', probability: 40 },
      { name: 'Planet Ring', probability: 35 },
      { name: 'Comet Trail', probability: 30 }
    ],
    common: [
      { name: 'Star Dust', probability: 20 },
      { name: 'Space Debris', probability: 15 },
      { name: 'Void Pattern', probability: 10 }
    ]
  }), []);
  
  // Tab change handler with useCallback
  const handleTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
  }, []);
  
  // Color mapping function memoized
  const getColorClasses = useCallback((tier, type) => {
    if (type === 'bg') {
      return tier === 'legendary' || tier === 'yellow' ? 'bg-yellow-500' :
             tier === 'epic' || tier === 'purple' ? 'bg-purple-500' :
             tier === 'rare' || tier === 'blue' ? 'bg-blue-500' :
             'bg-green-500';
    } else {
      return tier === 'legendary' || tier === 'yellow' ? 'text-yellow-400' :
             tier === 'epic' || tier === 'purple' ? 'text-purple-400' :
             tier === 'rare' || tier === 'blue' ? 'text-blue-400' :
             'text-green-400';
    }
  }, []);
  
  // Memoized tab content rendering
  const renderRarityTab = useMemo(() => (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">
        Each SOLARA NFT falls into one of these rarity tiers, determining its unique traits and value:
      </p>
      
      {/* Rarity Chart */}
      <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
        {Object.entries(distribution).map(([tier, { ratio, color }], index) => {
          // Animation style calculation
          const width = animationCompleted ? `${ratio}%` : '0%';
          const delay = index * 0.2;
          
          // Get background color class
          const bgColor = getColorClasses(color, 'bg');
          
          return (
            <div
              key={tier}
              className={`absolute h-full transition-all duration-1000 ${bgColor}`}
              style={{
                width,
                left: Object.entries(distribution)
                  .slice(0, index)
                  .reduce((sum, [_, { ratio }]) => sum + ratio, 0) + '%',
                transitionDelay: `${delay}s`
              }}
            ></div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {Object.entries(distribution).map(([tier, { ratio, color }]) => {
          const textColor = getColorClasses(color, 'text');
          const bgColor = getColorClasses(color, 'bg');
          
          return (
            <div key={tier} className="flex items-center">
              <div className={`w-3 h-3 ${bgColor} rounded-full mr-1`}></div>
              <span className={`text-xs ${textColor} mr-1 capitalize`}>{tier}</span>
              <span className="text-xs text-gray-400">({ratio}%)</span>
            </div>
          );
        })}
      </div>
      
      {/* Additional description */}
      <div className="bg-gray-800/50 p-3 rounded mt-3">
        <h4 className="font-medium text-sm mb-1">How Rarity Works</h4>
        <p className="text-xs text-gray-300">
          The rarity tier determines the availability of special traits and the overall value of your NFT.
          Legendary NFTs are the most scarce and contain the most valuable traits.
        </p>
      </div>
    </div>
  ), [distribution, animationCompleted, getColorClasses]);
  
  const renderTraitsTab = useMemo(() => (
    <div>
      <p className="text-gray-300 text-sm mb-3">
        Each NFT contains special traits based on its rarity tier. Here are some examples:
      </p>
      
      {/* Tier traits list */}
      <div className="space-y-3">
        {Object.entries(tierTraits).map(([tier, traits]) => {
          const textColor = getColorClasses(tier, 'text');
          
          return (
            <div key={tier} className="bg-gray-800/70 p-3 rounded">
              <h4 className={`font-medium ${textColor} capitalize mb-1`}>{tier} Tier Traits</h4>
              <div className="space-y-2">
                {traits.map((trait) => (
                  <div key={trait.name} className="flex justify-between items-center">
                    <span className="text-sm text-white">{trait.name}</span>
                    <div className="w-24 bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={getColorClasses(tier, 'bg')}
                        style={{ width: `${trait.probability}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ), [tierTraits, getColorClasses]);
  
  const renderBenefitsTab = useMemo(() => (
    <div>
      <p className="text-gray-300 text-sm mb-3">
        Owning a SOLARA NFT provides unique benefits based on its tier:
      </p>
      
      <div className="space-y-3">
        <div className="bg-yellow-900/30 border border-yellow-800 p-3 rounded">
          <h4 className="text-yellow-400 font-medium">Legendary Tier Benefits</h4>
          <ul className="text-sm text-gray-300 mt-1 list-disc list-inside">
            <li>VIP access to all SOLARA events</li>
            <li>First-access to future drops</li>
            <li>Highest staking rewards multiplier (3x)</li>
            <li>Exclusive legendary holder channels</li>
          </ul>
        </div>
        
        <div className="bg-purple-900/30 border border-purple-800 p-3 rounded">
          <h4 className="text-purple-400 font-medium">Rare Tier Benefits</h4>
          <ul className="text-sm text-gray-300 mt-1 list-disc list-inside">
            <li>Priority access to SOLARA events</li>
            <li>Early access to future drops</li>
            <li>Enhanced staking rewards multiplier (2x)</li>
            <li>Rare holder community access</li>
          </ul>
        </div>
        
        <div className="bg-blue-900/30 border border-blue-800 p-3 rounded">
          <h4 className="text-blue-400 font-medium">Uncommon Tier Benefits</h4>
          <ul className="text-sm text-gray-300 mt-1 list-disc list-inside">
            <li>Standard access to SOLARA events</li>
            <li>Standard staking rewards (1.5x)</li>
            <li>Community participation benefits</li>
          </ul>
        </div>
        
        <div className="bg-green-900/30 border border-green-800 p-3 rounded">
          <h4 className="text-green-400 font-medium">Common Tier Benefits</h4>
          <ul className="text-sm text-gray-300 mt-1 list-disc list-inside">
            <li>Community membership</li>
            <li>Base staking rewards (1x)</li>
            <li>Participation in community events</li>
          </ul>
        </div>
      </div>
    </div>
  ), []);
  
  // Get active tab content
  const activeTabContent = useMemo(() => {
    switch (activeTab) {
      case 'rarity':
        return renderRarityTab;
      case 'traits':
        return renderTraitsTab;
      case 'benefits':
        return renderBenefitsTab;
      default:
        return renderRarityTab;
    }
  }, [activeTab, renderRarityTab, renderTraitsTab, renderBenefitsTab]);
  
  return (
    <div className="bg-gray-900 rounded-xl border border-purple-500/30 p-4 shadow-lg">
      <h3 className="text-xl font-bold text-center mb-4">SOLARA Collection Info</h3>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'rarity' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          onClick={() => handleTabChange('rarity')}
        >
          Rarity Distribution
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'traits' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          onClick={() => handleTabChange('traits')}
        >
          Special Traits
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'benefits' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          onClick={() => handleTabChange('benefits')}
        >
          Benefits
        </button>
      </div>
      
      {/* Active tab content */}
      {activeTabContent}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(NFTInfoVisualization);