/**
 * Application Constants
 * 
 * Centralized constants for use throughout the application.
 * This file helps maintain consistency and makes it easier
 * to update values that are used in multiple places.
 */

// Network configuration
export const NETWORK = {
  MAINNET: 'mainnet-beta',
  TESTNET: 'testnet',
  DEVNET: 'devnet',
  // The active network for the application
  ACTIVE: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
};

// Endpoints for Solana
export const ENDPOINTS = {
  mainnet: {
    name: 'Mainnet',
    endpoint: 'https://api.mainnet-beta.solana.com',
    ws: 'wss://api.mainnet-beta.solana.com',
  },
  testnet: {
    name: 'Testnet',
    endpoint: 'https://api.testnet.solana.com',
    ws: 'wss://api.testnet.solana.com',
  },
  devnet: {
    name: 'Devnet',
    endpoint: 'https://api.devnet.solana.com',
    ws: 'wss://api.devnet.solana.com',
  },
};

// IPFS gateway configuration
export const IPFS = {
  // Primary IPFS gateway
  PRIMARY_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud/ipfs',
  // Fallback IPFS gateways in order of preference
  FALLBACK_GATEWAYS: [
    'https://cloudflare-ipfs.com/ipfs',
    'https://ipfs.io/ipfs',
    'https://gateway.pinata.cloud/ipfs',
  ],
  // Maximum timeout for IPFS requests
  TIMEOUT: 5000,
};

// NFT configuration
export const NFT = {
  // Collection address
  COLLECTION_ADDRESS: process.env.NEXT_PUBLIC_COLLECTION_ADDRESS,
  // Maximum NFT supply
  MAX_SUPPLY: 10000,
  // Default NFT tiers with distribution
  TIERS: {
    LEGENDARY: { name: 'Legendary', ratio: 5, color: 'yellow' },
    EPIC: { name: 'Epic', ratio: 15, color: 'purple' },
    RARE: { name: 'Rare', ratio: 30, color: 'blue' },
    COMMON: { name: 'Common', ratio: 50, color: 'green' },
  },
};

// Staking configuration
export const STAKING = {
  // Program address
  PROGRAM_ADDRESS: process.env.NEXT_PUBLIC_STAKING_PROGRAM,
  // Minimum staking duration (in days)
  MIN_DURATION: 7,
  // Base rewards per day
  BASE_REWARDS: 10,
  // Tier multipliers
  TIER_MULTIPLIERS: {
    'Legendary': 3.0,
    'Epic': 2.0,
    'Rare': 1.5,
    'Common': 1.0,
  },
};

// UI configuration
export const UI = {
  // Theme colors
  COLORS: {
    primary: '#8A2BE2', // Purple
    secondary: '#38B2AC', // Teal
    accent: '#F6AD55', // Orange
    background: '#1A202C', // Dark blue
    backgroundLight: '#2D3748', // Light dark blue
    text: '#FFFFFF', // White
    textSecondary: '#CBD5E0', // Light gray
  },
  // Animation durations
  ANIMATION: {
    fast: 200, // ms
    normal: 300, // ms
    slow: 500, // ms
  },
  // Breakpoints
  BREAKPOINTS: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

// Media queries for responsive design
export const MEDIA_QUERIES = {
  xs: `@media (max-width: ${UI.BREAKPOINTS.xs}px)`,
  sm: `@media (max-width: ${UI.BREAKPOINTS.sm}px)`,
  md: `@media (max-width: ${UI.BREAKPOINTS.md}px)`,
  lg: `@media (max-width: ${UI.BREAKPOINTS.lg}px)`,
  xl: `@media (max-width: ${UI.BREAKPOINTS.xl}px)`,
};

// Application routes
export const ROUTES = {
  HOME: '/',
  NFT: '/nft',
  NFT_DETAIL: (id) => `/nft/${id}`,
  STAKING: '/staking',
  PRESALE: '/presale',
  LEADERBOARD: '/leaderboard',
  TRANSACTIONS: '/transactions',
  COMMUNITY: '/community',
  REFUND_POLICY: '/solara/refund-policy',
  REQUEST_REFUND: '/solara/request-refund',
};

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_HISTORY: 'tesola_wallet_history',
  RECENT_TRANSACTIONS: 'tesola_recent_transactions',
  THEME: 'tesola_theme',
  ANALYTICS_DISABLED: 'tesola_analytics_disabled',
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_CONNECTION: 'Failed to connect wallet. Please try again.',
  WALLET_DISCONNECTION: 'Failed to disconnect wallet. Please try again.',
  WALLET_NOT_CONNECTED: 'Wallet not connected. Please connect your wallet.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  INSUFFICIENT_BALANCE: 'Insufficient balance. Please fund your wallet.',
  NFT_NOT_FOUND: 'NFT not found.',
  UNAUTHORIZED: 'Unauthorized. Please connect your wallet.',
  FETCH_ERROR: 'Failed to fetch data. Please try again.',
  STAKING_FAILED: 'Failed to stake NFT. Please try again.',
  UNSTAKING_FAILED: 'Failed to unstake NFT. Please try again.',
  NO_VOTING_POWER: 'No voting power left. Stake more NFTs to gain voting power.',
  ALREADY_VOTED: 'You have already voted for this proposal.',
};

// Meme contest sample data
export const SAMPLE_MEMES = [
  {
    id: "meme1",
    publicKey: "7RLH8CGCXLEUzVeEf7AoQKpnYE1LzecJdqQ3y16Dkprj",
    title: "When TESOLA Moons",
    description: "E-LON's face when TESOLA price goes to the moon",
    imageUrl: "/nft-previews/0418.png",
    creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s",
    creatorDisplay: "DBtG...xz5s",
    votes: 1240,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "meme2",
    publicKey: "9ZLH7FGWXjuo7VSEf6AmQFpnYF1CzUcJcqW3y15DiprJ",
    title: "SOLARA's Cosmic Power",
    description: "SOLARA unleashing blockchain validation power",
    imageUrl: "/nft-previews/0119.png",
    creator: "HirFHFrDy29ajuh5T1ALRFYmvrTkLvEjHGYNJTrJ3Sgz",
    creatorDisplay: "HirF...3Sgz",
    votes: 980,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "meme3",
    publicKey: "5TGH6FGCXLPZveEf3AeQKJpnYN2LzQcLcqQ9y74Dkwij",
    title: "Staking Intensifies",
    description: "How it feels to stake your SOLARA NFTs",
    imageUrl: "/nft-previews/0171.png",
    creator: "EVK9UQS93bwsdbzrHWKZdoVpbnDhNBaLYSYJcJMhAGKj",
    creatorDisplay: "EVK9...AGKj",
    votes: 2150,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "meme4",
    publicKey: "4BGH6FGZXLQZveEf3AeQKLpnYN2LbQcLcqQ9y74Dkwij",
    title: "Diamond Hands",
    description: "HODLing TESOLA through the dip",
    imageUrl: "/nft-previews/0327.png",
    creator: "J4zFgSkEtPBGJgcB8qPZKPD7JJBpKLX4HzHgxVD8io2e", 
    creatorDisplay: "J4zF...io2e",
    votes: 1650,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "meme5",
    publicKey: "3FFR6FGCXLPZveEf3AeQKJpnYN2LzQcLcqQ9y74Dkwij",
    title: "Cosmic Journey",
    description: "To the moon and beyond with TESOLA tokens",
    imageUrl: "/nft-previews/0579.png",
    creator: "DBtGiKwwBxTtMwGvFWU6v3uqP8U4xg5usCwJpGmFxz5s",
    creatorDisplay: "DBtG...xz5s",
    votes: 750,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

// Governance and voting constants
export const GOVERNANCE = {
  // 투표권 관련 상수
  VOTING_POWER_PER_NFT: 1, // 스테이킹된 NFT 당 투표권
  PROPOSAL_CREATE_THRESHOLD: 10, // 제안 생성에 필요한 최소 투표권
  VOTE_COST: 1, // 한 번 투표에 사용되는 투표권 수
  MAX_VOTING_POWER: 50, // 최대 투표권 수
};

// Export all constants
export default {
  NETWORK,
  ENDPOINTS,
  IPFS,
  NFT,
  STAKING,
  UI,
  MEDIA_QUERIES,
  ROUTES,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SAMPLE_MEMES,
  GOVERNANCE,
};