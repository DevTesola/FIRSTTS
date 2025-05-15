# Real-time Staking Rewards Implementation Plan

This document outlines the implementation plan for enhancing the TESOLA NFT staking platform with real-time rewards display while maintaining the on-chain calculation model.

## Current System Overview

The current staking rewards system operates as follows:

1. **On-chain Logic:**
   - Rewards are calculated on-chain using the staking duration, NFT tier, and various multipliers
   - Key data stored on-chain: staking start time, staking period, tier, last claim time, etc.
   - Reward calculations occur only when transactions are processed (staking, unstaking, claiming)

2. **Current UI Implementation:**
   - Rewards are displayed as static values from API responses
   - Progress bars update only when the page is refreshed
   - No real-time updates between server data synchronizations

## Enhancement Strategy

We will implement a hybrid approach that maintains the on-chain calculation as the source of truth while enhancing the UI with real-time updates:

### 1. Client-side Reward Calculation

Add a React hook that incrementally updates the displayed rewards based on elapsed time:

```javascript
// /utils/hooks/useRewardUpdater.js
import { useState, useEffect, useRef } from 'react';

export function useRewardUpdater(initialReward, dailyRate, lastUpdateTime) {
  const [currentReward, setCurrentReward] = useState(initialReward || 0);
  const initialRewardRef = useRef(initialReward || 0);
  const dailyRateRef = useRef(dailyRate || 0);
  const lastUpdateTimeRef = useRef(lastUpdateTime || Date.now());
  
  useEffect(() => {
    // Initialize refs with current values
    initialRewardRef.current = initialReward || 0;
    dailyRateRef.current = dailyRate || 0;
    lastUpdateTimeRef.current = lastUpdateTime || Date.now();
    
    // Calculate rewards per second
    const rewardPerSecond = dailyRateRef.current / (24 * 60 * 60);
    
    // Update every second
    const timer = setInterval(() => {
      // Calculate elapsed time in seconds
      const elapsedSeconds = (Date.now() - lastUpdateTimeRef.current) / 1000;
      
      // Calculate additional rewards based on elapsed time
      const additionalReward = rewardPerSecond * elapsedSeconds;
      
      // Update displayed rewards
      setCurrentReward(initialRewardRef.current + additionalReward);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [initialReward, dailyRate, lastUpdateTime]);
  
  return currentReward;
}
```

### 2. Real-time Progress Bar Updates

Add a React hook for automatically updating the staking progress bar:

```javascript
// Hook for real-time progress updates
function useProgressUpdater(startDate, endDate, initialProgress) {
  const [progress, setProgress] = useState(initialProgress);
  
  useEffect(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    const updateProgress = () => {
      const now = Date.now();
      
      if (now >= end) {
        setProgress(100);
        return;
      }
      
      if (now <= start) {
        setProgress(0);
        return;
      }
      
      const newProgress = Math.min(100, ((now - start) / (end - start)) * 100);
      setProgress(newProgress);
    };
    
    // Initial update
    updateProgress();
    
    // Update every second
    const timer = setInterval(updateProgress, 1000);
    
    return () => clearInterval(timer);
  }, [startDate, endDate]);
  
  return progress;
}
```

### 3. Periodic Server Synchronization

Implement automatic synchronization with server data to maintain accuracy:

```javascript
// Periodic server data synchronization
useEffect(() => {
  // Sync with server data every 5 minutes
  const syncTimer = setInterval(() => {
    if (onRefresh) {
      console.log('Syncing with server data...');
      onRefresh();
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return () => clearInterval(syncTimer);
}, [onRefresh]);
```

### 4. Integration into StakedNFTCard Component

Integrate these hooks into the existing StakedNFTCard component with minimal changes:

```javascript
// StakedNFTCard.jsx modifications
import { useRewardUpdater } from '../../utils/hooks/useRewardUpdater';

const StakedNFTCard = ({ stake, onRefresh }) => {
  // Existing code...
  
  // Add real-time reward updater hook
  const updatedReward = useRewardUpdater(
    stake.earned_so_far,
    stake.daily_reward_rate,
    Date.now() // Base time from page load
  );
  
  // Add real-time progress updater
  const updatedProgress = useProgressUpdater(
    stake.staked_at,
    stake.release_date,
    stake.progress_percentage || 0
  );
  
  // In the render function, use the updated values
  return (
    <div className={...}>
      {/* Existing UI structure */}
      
      {/* Updated rewards display */}
      <div className={`bg-black/20 rounded-lg p-3 mb-3 transition-all duration-300 ${animation ? 'scale-105 bg-purple-900/40' : ''}`}>
        <div className="text-center">
          <div className="text-white/70 text-xs mb-1">Earned so far</div>
          <div className="text-xl font-bold text-white">
            <span className="text-yellow-400">
              {formatNumber(updatedReward)}
            </span>{" "}
            <span className="text-sm font-normal text-yellow-500/70">TESOLA</span>
          </div>
          {stake.daily_reward_rate && (
            <div className="text-xs text-green-400 mt-1">
              +{stake.daily_reward_rate} TESOLA/day
            </div>
          )}
        </div>
      </div>
      
      {/* Updated progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/70">Progress</span>
          <span className="text-white">{updatedProgress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-transform duration-1000 ease-out"
            style={{width: `${updatedProgress}%`, transform: `translateX(${animation ? '5px' : '0px'})`}}
          ></div>
        </div>
      </div>
      
      {/* Rest of the UI structure remains the same */}
    </div>
  );
};
```

## Benefits of This Approach

1. **On-chain Trust with Real-time UI**
   - Maintains the integrity of the on-chain calculation model
   - Provides responsive visual feedback to users
   - Enhances perceived value of staking rewards

2. **Minimal Code Changes**
   - Uses existing code base with targeted enhancements
   - Doesn't require rewriting entire components
   - Preserves existing functionality

3. **Optimal User Experience**
   - Rewards appear to accumulate in real-time
   - Progress bars update smoothly
   - Regular synchronization ensures accuracy

4. **Scalable Architecture**
   - Clean separation between on-chain and UI concerns
   - Hooks can be reused across different components
   - Easy to maintain and extend

## Implementation Phases

### Phase 1: Core Real-time Features
- Create the reward updater hook
- Create the progress updater hook
- Integrate hooks into StakedNFTCard component

### Phase 2: Enhancements
- Add periodic server synchronization
- Implement offline status detection
- Add error handling for RPC connection issues

### Phase 3: Polish
- Add visual indicators for synchronization status
- Optimize rendering performance
- Add animation transitions for smoother updates

## Technical Considerations

- **Performance**: The update intervals should be efficient and not cause excessive rendering
- **Accuracy**: Ensure calculations match the on-chain logic
- **Edge Cases**: Handle timezone differences, browser clock inaccuracies, and network issues
- **Battery Usage**: On mobile devices, consider reducing update frequency when the tab is not active

## Conclusion

This implementation approach allows us to enhance the user experience with real-time updates while maintaining the security and trust benefits of on-chain calculation. By using a hybrid model where the UI updates continuously but regularly synchronizes with the blockchain, we create an engaging and accurate staking dashboard that encourages user participation.

The plan requires minimal changes to the existing codebase, making it a low-risk, high-reward enhancement that can be implemented quickly and iteratively improved.