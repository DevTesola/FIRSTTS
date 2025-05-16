import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { getNetworkConfig, getConnection, requireMainnetConfirmation } from '../utils/network-config.js';
import { SELLER_KEYPAIR } from './server/utils/sellerKeypair.js';
// 메인넷용 지갑은 환경 변수로 구분
import { SELLER_KEYPAIR_MAINNET } from './server/utils/sellerKeypair-mainnet.js';

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';
const COLLECTION_JSON_CID = process.env.NEXT_PUBLIC_COLLECTION_JSON_CID || 'bafybeifff7fnixl2vmubgvwxyd6wswcp5atdolby3qwstdh2bmeetixqki';
const COLLECTION_SIZE = parseInt(process.env.NEXT_PUBLIC_COLLECTION_SIZE) || 1000;

async function createCollectionNFT() {
  try {
    const networkConfig = getNetworkConfig();
    const connection = getConnection();
    
    // 네트워크에 따라 다른 키페어 사용
    const keypair = networkConfig.isMainnet ? SELLER_KEYPAIR_MAINNET : SELLER_KEYPAIR;
    
    console.log(`Creating collection on ${networkConfig.network}`);
    console.log('Seller keypair public key:', keypair.publicKey.toString());
    
    // 메인넷인 경우 추가 확인
    if (networkConfig.isMainnet) {
      await requireMainnetConfirmation('Create Collection NFT');
      
      // 잔액 확인
      const balance = await connection.getBalance(keypair.publicKey);
      console.log(`Wallet balance: ${balance / 1e9} SOL`);
      
      if (balance < 0.1 * 1e9) {
        throw new Error('Insufficient balance. You need at least 0.1 SOL to create a collection.');
      }
    }
    
    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));

    console.log('Creating collection NFT...');
    const { nft, response } = await metaplex.nfts().create({
      name: 'SOLARA COLLECTION',
      symbol: 'SLR',
      uri: `${IPFS_GATEWAY}/ipfs/${COLLECTION_JSON_CID}/collection.json`,
      sellerFeeBasisPoints: 500,
      creators: [
        {
          address: keypair.publicKey,
          share: 100,
          verified: true,
        },
      ],
      isCollection: true,
      collectionIsSized: true,
      collectionDetails: {
        __kind: 'V1',
        size: COLLECTION_SIZE,
      },
    }, { commitment: networkConfig.commitment });

    console.log('Collection NFT created:');
    console.log('Network:', networkConfig.network);
    console.log('Mint Address:', nft.address.toString());
    console.log('Metadata Address:', nft.metadataAddress.toString());
    console.log('Transaction Signature:', response.signature);
    
    if (networkConfig.isMainnet) {
      console.log(`View on Solscan: https://solscan.io/tx/${response.signature}`);
    }

    // 트랜잭션 확인
    await connection.confirmTransaction(response.signature, networkConfig.commitment);
    console.log('Transaction confirmed.');

    // 메타데이터 검증
    const collectionNft = await metaplex.nfts().findByMint(
      { mintAddress: nft.address },
      { commitment: networkConfig.commitment }
    );

    if (collectionNft.collectionDetails) {
      console.log('Collection NFT size verified:', collectionNft.collectionDetails.size.toString());
    }

    console.log('Collection NFT setup complete.');
    console.log(`Update NEXT_PUBLIC_COLLECTION_MINT_${networkConfig.network.toUpperCase()} in .env with:`, nft.address.toString());

    return {
      collectionMint: nft.address,
      collectionMetadata: collectionNft.metadata,
      network: networkConfig.network
    };
  } catch (err) {
    console.error('Error creating collection NFT:', err);
    throw err;
  }
}

async function main() {
  try {
    const networkConfig = getNetworkConfig();
    console.log(`=== ${networkConfig.network.toUpperCase()} COLLECTION CREATION ===`);
    
    if (networkConfig.isMainnet) {
      const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Are you sure you want to create a collection on MAINNET? (yes/no): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Collection creation cancelled.');
        process.exit(0);
      }
    }
    
    await createCollectionNFT();
    console.log('Collection creation completed successfully.');
  } catch (err) {
    console.error('Main execution failed:', err.message);
    process.exit(1);
  }
}

main();