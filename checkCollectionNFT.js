import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';
import { SELLER_KEYPAIR } from './server/utils/sellerKeypair.js';

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const COLLECTION_MINT_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_MINT;

async function checkCollectionNFT() {
  try {
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(SELLER_KEYPAIR));

    console.log('Loading collection NFT...');
    const collectionNft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(COLLECTION_MINT_ADDRESS) });

    console.log('Collection NFT details:');
    console.log('Mint Address:', collectionNft.address.toString());
    console.log('Update Authority:', collectionNft.updateAuthorityAddress.toString());
    console.log('Is Collection:', collectionNft.isCollection);
    console.log('Collection Details:', collectionNft.collectionDetails);
    console.log('Metadata:', collectionNft.metadata);
  } catch (err) {
    console.error('Error checking collection NFT:', err);
  }
}

checkCollectionNFT();