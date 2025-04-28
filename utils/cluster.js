import { PublicKey } from '@solana/web3.js';

export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
export const COLLECTION_MINT = new PublicKey(process.env.NEXT_PUBLIC_COLLECTION_MINT);