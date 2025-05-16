// Network configuration based on environment
import { Connection, clusterApiUrl } from '@solana/web3.js';

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const IS_MAINNET = NETWORK === 'mainnet-beta';

// RPC endpoints
const RPC_ENDPOINTS = {
  'devnet': process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl('devnet'),
  'mainnet-beta': process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com'
};

// Collection mints per network
const COLLECTION_MINTS = {
  'devnet': process.env.NEXT_PUBLIC_COLLECTION_MINT_DEVNET,
  'mainnet-beta': process.env.NEXT_PUBLIC_COLLECTION_MINT_MAINNET
};

// Staking program IDs per network
const STAKING_PROGRAM_IDS = {
  'devnet': process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID_DEVNET,
  'mainnet-beta': process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID_MAINNET
};

export const getNetworkConfig = () => {
  return {
    network: NETWORK,
    isMainnet: IS_MAINNET,
    rpcEndpoint: RPC_ENDPOINTS[NETWORK],
    collectionMint: COLLECTION_MINTS[NETWORK],
    stakingProgramId: STAKING_PROGRAM_IDS[NETWORK],
    commitment: IS_MAINNET ? 'finalized' : 'confirmed'
  };
};

export const getConnection = () => {
  const config = getNetworkConfig();
  return new Connection(config.rpcEndpoint, config.commitment);
};

// Security check for mainnet operations
export const requireMainnetConfirmation = async (operation) => {
  if (!IS_MAINNET) return true;
  
  console.warn(`⚠️  MAINNET OPERATION: ${operation}`);
  console.warn('This will execute on Solana Mainnet. Proceed with caution!');
  
  // In production, you might want to add additional confirmation steps
  return true;
};

export default {
  getNetworkConfig,
  getConnection,
  requireMainnetConfirmation,
  IS_MAINNET,
  NETWORK
};