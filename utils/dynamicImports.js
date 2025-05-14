/**
 * Centralized dynamic import configuration for code splitting
 * This file manages all dynamically loaded components
 */
import dynamic from 'next/dynamic';
import FallbackLoading from '../components/FallbackLoading';
import LoadingSkeleton from '../components/LoadingSkeleton';

// Common configuration for dynamic imports
const defaultOptions = {
  loading: () => <LoadingSkeleton />,
  ssr: true
};

// General Utility Components
export const DynamicBackgroundVideo = dynamic(() => 
  import('../components/BackgroundVideo'), {
    ...defaultOptions,
    ssr: false, // Media components shouldn't be server-rendered
    loading: () => null // No loading state for background
  }
);

export const DynamicNotifications = dynamic(() => 
  import('../components/Notifications').then(mod => mod.Notifications), {
    ...defaultOptions,
    ssr: true // Essential UI component
  }
);

export const DynamicOfflineDetector = dynamic(() => 
  import('../components/OfflineDetector'), {
    ...defaultOptions,
    ssr: false, // Browser APIs required
    loading: () => null // No loading state needed
  }
);

// NFT and UI Components
export const DynamicNFTCard = dynamic(() => 
  import('../components/NFTCard'), {
    ...defaultOptions
  }
);

export const DynamicNFTInfoVisualization = dynamic(() => 
  import('../components/NFTInfoVisualization'), {
    ...defaultOptions,
    ssr: false, // Heavy component, better client-side only
    loading: () => <LoadingSkeleton lines={5} height="300px" />
  }
);

export const DynamicMintSection = dynamic(() => 
  import('../components/MintSection'), {
    ...defaultOptions,
    ssr: true, // Important for SEO
    loading: () => <FallbackLoading message="Loading mint options..." />
  }
);

export const DynamicVideoPlayer = dynamic(() => 
  import('../components/VideoPlayer'), {
    ...defaultOptions,
    ssr: false, // Media component
    loading: () => <div className="w-full h-full bg-gray-900 animate-pulse rounded-lg" />
  }
);

// Modal Components
export const DynamicInfoModal = dynamic(() => 
  import('../components/InfoModal'), {
    ...defaultOptions,
    ssr: false, // Not needed on initial load
    loading: () => null
  }
);

export const DynamicMintResultModal = dynamic(() => 
  import('../components/MintResultModal'), {
    ...defaultOptions,
    ssr: false, // Only loaded after minting
    loading: () => null
  }
);

export const DynamicRefundPolicyModal = dynamic(() => 
  import('../components/RefundPolicyModal'), {
    ...defaultOptions,
    ssr: false,
    loading: () => null
  }
);

// Staking Components
export const DynamicStakingDashboard = dynamic(() => 
  import('../components/staking/StakingDashboard'), {
    ...defaultOptions,
    ssr: false, // Complex UI, load on client
    loading: () => <FallbackLoading message="Loading staking dashboard..." />
  }
);

export const DynamicLeaderboard = dynamic(() => 
  import('../components/staking/Leaderboard'), {
    ...defaultOptions,
    loading: () => <LoadingSkeleton lines={10} height="400px" />
  }
);

export const DynamicStakingRewards = dynamic(() => 
  import('../components/staking/StakingRewards'), {
    ...defaultOptions,
    loading: () => <LoadingSkeleton lines={6} />
  }
);

// Presale Components
export const DynamicPresaleSection = dynamic(() => 
  import('../components/presale/PresaleSection'), {
    ...defaultOptions,
    loading: () => <FallbackLoading message="Loading presale information..." />
  }
);

export const DynamicPresaleTimer = dynamic(() => 
  import('../components/presale/PresaleTimer'), {
    ...defaultOptions,
    ssr: true, // Important for SEO
  }
);

export const DynamicTokenomics = dynamic(() => 
  import('../components/presale/Tokenomics'), {
    ...defaultOptions,
  }
);

export const DynamicRoadmap = dynamic(() => 
  import('../components/presale/Roadmap'), {
    ...defaultOptions,
  }
);

// Community Components
export const DynamicCommunityPage = dynamic(() => 
  import('../components/community/CommunityPage'), {
    ...defaultOptions,
    loading: () => <FallbackLoading message="Loading community hub..." />
  }
);