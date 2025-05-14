import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';

export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
export const COLLECTION_MINT = new PublicKey(process.env.NEXT_PUBLIC_COLLECTION_MINT || 'CbFSKyT2pYNRK4vkJqVdJ9Tqf2R1RDNJjhMKxG2LuFHj');

// Export connection helper functions
export const getNodeEndpoint = () => {
  return SOLANA_RPC_ENDPOINT;
};

export const getConnection = () => {
  return new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
};

export const getCluster = () => {
  if (SOLANA_RPC_ENDPOINT.includes('devnet')) {
    return 'devnet';
  } else if (SOLANA_RPC_ENDPOINT.includes('mainnet')) {
    return 'mainnet-beta';
  } else {
    return 'devnet'; // Default to devnet
  }
};