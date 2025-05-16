import { config } from 'dotenv';
// 메인넷용 환경 변수 파일 로드
config({ path: './.env.production' });  // 또는 './.env.mainnet'

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import pkg from '@solana/web3.js';
const { Connection, PublicKey } = pkg;
import { SELLER_KEYPAIR } from './server/utils/sellerKeypair.js';

// 메인넷 RPC 엔드포인트
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io';
const COLLECTION_JSON_CID = process.env.NEXT_PUBLIC_COLLECTION_JSON_CID || 'bafybeifff7fnixl2vmubgvwxyd6wswcp5atdolby3qwstdh2bmeetixqki';
const COLLECTION_SIZE = parseInt(process.env.NEXT_PUBLIC_COLLECTION_SIZE) || 1000;

async function createCollectionNFT() {
  try {
    // 메인넷 연결 초기화
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 메인넷에서 사용할 지갑 확인
    console.log('Using mainnet wallet:', SELLER_KEYPAIR.publicKey.toString());
    console.log('⚠️  WARNING: This will create a collection on MAINNET! Make sure you have enough SOL.');
    
    // 지갑 잔액 확인
    const balance = await connection.getBalance(SELLER_KEYPAIR.publicKey);
    console.log(`Wallet balance: ${balance / 1e9} SOL`);
    
    if (balance < 0.1 * 1e9) {
      throw new Error('Insufficient balance. You need at least 0.1 SOL to create a collection.');
    }
    
    const metaplex = Metaplex.make(connection).use(keypairIdentity(SELLER_KEYPAIR));

    console.log('Creating collection NFT on mainnet...');
    const { nft, response } = await metaplex.nfts().create({
      name: 'SOLARA COLLECTION',
      symbol: 'SLR',
      uri: `${IPFS_GATEWAY}/ipfs/${COLLECTION_JSON_CID}/collection.json`,
      sellerFeeBasisPoints: 500,  // 5% royalty
      creators: [
        {
          address: SELLER_KEYPAIR.publicKey,
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
    }, { commitment: 'finalized' });

    console.log('🎉 Collection NFT created successfully on MAINNET!');
    console.log('Mint Address:', nft.address.toString());
    console.log('Metadata Address:', nft.metadataAddress.toString());
    console.log('Transaction Signature:', response.signature);
    console.log(`View on Solscan: https://solscan.io/tx/${response.signature}`);

    // 트랜잭션 확인
    console.log('Confirming transaction...');
    await connection.confirmTransaction(response.signature, 'finalized');
    console.log('Transaction confirmed.');

    // 컬렉션 NFT 메타데이터 검증
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

    console.log('✅ Collection NFT setup complete.');
    console.log('');
    console.log('IMPORTANT: Update these in your .env.production file:');
    console.log(`NEXT_PUBLIC_COLLECTION_MINT=${nft.address.toString()}`);
    console.log('');

    // 결과를 파일로 저장
    const fs = await import('fs/promises');
    const result = {
      collectionMint: nft.address.toString(),
      metadataAddress: nft.metadataAddress.toString(),
      transactionSignature: response.signature,
      createdAt: new Date().toISOString(),
      network: 'mainnet-beta'
    };
    
    await fs.writeFile(
      'mainnet-collection-result.json', 
      JSON.stringify(result, null, 2)
    );
    console.log('Collection details saved to mainnet-collection-result.json');

    return result;
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
    console.log('=== MAINNET COLLECTION CREATION ===');
    console.log('Network: Solana Mainnet-Beta');
    console.log('');
    
    // 사용자 확인
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
    
    await createCollectionNFT();
    console.log('Collection creation completed successfully.');
  } catch (err) {
    console.error('Main execution failed:', err.message);
    process.exit(1);
  }
}

main();