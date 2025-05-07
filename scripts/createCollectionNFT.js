import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import pkg from '@solana/web3.js';
const { Connection, PublicKey } = pkg;
import { SELLER_KEYPAIR } from './server/utils/sellerKeypair.js';

const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';
const COLLECTION_JSON_CID = process.env.NEXT_PUBLIC_COLLECTION_JSON_CID || 'bafybeifff7fnixl2vmubgvwxyd6wswcp5atdolby3qwstdh2bmeetixqki';
const COLLECTION_SIZE = parseInt(process.env.NEXT_PUBLIC_COLLECTION_SIZE) || 1000;

async function createCollectionNFT() {
  try {
    // Initialize Solana connection and Metaplex
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // Debug SELLER_KEYPAIR to ensure it's properly loaded
    console.log('Seller keypair public key:', SELLER_KEYPAIR.publicKey.toString());
    
    const metaplex = Metaplex.make(connection).use(keypairIdentity(SELLER_KEYPAIR));

    console.log('Creating collection NFT with size...');
    const { nft, response } = await metaplex.nfts().create({
      name: 'SOLARA COLLECTION',
      symbol: 'SLR',
      uri: `${IPFS_GATEWAY}/ipfs/${COLLECTION_JSON_CID}/collection.json`,
      sellerFeeBasisPoints: 500,
      creators: [
        {
          address: SELLER_KEYPAIR.publicKey,
          share: 100,
          verified: true,
        },
      ],
      isCollection: true,
      collectionIsSized: true,  // 명시적으로 사이즈가 있는 컬렉션임을 표시
      collectionDetails: {
        __kind: 'V1',
        size: COLLECTION_SIZE,
      },
    }, { commitment: 'finalized' });

    console.log('Collection NFT created:');
    console.log('Mint Address:', nft.address.toString());
    console.log('Metadata Address:', nft.metadataAddress.toString());
    console.log('Transaction Signature:', response.signature);

    // Confirm transaction
    console.log('Confirming transaction...');
    await connection.confirmTransaction(response.signature, 'finalized');
    console.log('Transaction confirmed.');

    // Fetch and verify collection NFT metadata
    console.log('Fetching collection NFT metadata...');
    const collectionNft = await metaplex.nfts().findByMint(
      { mintAddress: nft.address },
      { commitment: 'finalized' }
    );

    console.log('Collection NFT metadata:', JSON.stringify(collectionNft, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));

    if (collectionNft.collectionDetails) {
      console.log('Collection NFT size verified:', collectionNft.collectionDetails.size.toString());
    } else {
      console.warn('Collection details not found in metadata. This might cause issues with collection verification.');
    }

    console.log('Collection NFT setup complete.');
    console.log('Update NEXT_PUBLIC_COLLECTION_MINT in .env.development.local with:', nft.address.toString());

    return {
      collectionMint: nft.address,
      collectionMetadata: collectionNft.metadata,
    };
  } catch (err) {
    console.error('Error creating collection NFT:', err);
    if (err.logs) {
      console.error('Transaction logs:', err.logs);
    }
    throw err;
  }
}

async function main() {
  try {
    await createCollectionNFT();
    console.log('Collection creation completed successfully.');
  } catch (err) {
    console.error('Main execution failed:', err.message);
    process.exit(1);
  }
}

main();