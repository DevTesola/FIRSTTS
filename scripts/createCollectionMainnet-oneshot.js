import { config } from 'dotenv';
config({ path: './.env.development.local' });

import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// 메인넷 RPC 엔드포인트 (더 빠른 RPC 서비스 사용 가능)
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
// const MAINNET_RPC = 'https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY';

// 메인넷 지갑 파일 경로 (기존 mintWallet.json 사용)
const MAINNET_WALLET_PATH = './mintWallet.json';

// IPFS 설정 (기존 개발 환경과 동일하게 사용)
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
const COLLECTION_JSON_CID = process.env.NEXT_PUBLIC_COLLECTION_JSON_CID || 'bafybeifff7fnixl2vmubgvwxyd6wswcp5atdolby3qwstdh2bmeetixqki';
const COLLECTION_SIZE = parseInt(process.env.NEXT_PUBLIC_COLLECTION_SIZE) || 1000;

async function createMainnetCollection() {
  try {
    // 메인넷 지갑 로드
    if (!fs.existsSync(MAINNET_WALLET_PATH)) {
      throw new Error(`Mainnet wallet file not found at ${MAINNET_WALLET_PATH}`);
    }
    
    const walletData = JSON.parse(fs.readFileSync(MAINNET_WALLET_PATH, 'utf8'));
    const mainnetKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    
    console.log('🔐 Mainnet wallet loaded:', mainnetKeypair.publicKey.toString());
    
    // 메인넷 연결
    const connection = new Connection(MAINNET_RPC, 'confirmed');
    console.log('🌐 Connected to Solana Mainnet');
    
    // 잔액 확인
    const balance = await connection.getBalance(mainnetKeypair.publicKey);
    console.log(`💰 Wallet balance: ${balance / 1e9} SOL`);
    
    if (balance < 0.1 * 1e9) {
      throw new Error('Insufficient balance. You need at least 0.1 SOL to create a collection.');
    }
    
    // Metaplex 인스턴스 생성
    const metaplex = Metaplex.make(connection).use(keypairIdentity(mainnetKeypair));
    
    // 사용자 확인
    console.log('\n⚠️  WARNING: You are about to create a collection on MAINNET!');
    console.log('Collection details:');
    console.log(`- Name: SOLARA COLLECTION`);
    console.log(`- Symbol: SLR`);
    console.log(`- Size: ${COLLECTION_SIZE}`);
    console.log(`- Royalty: 5%`);
    console.log(`- Metadata URI: ${IPFS_GATEWAY}/ipfs/${COLLECTION_JSON_CID}/collection.json`);
    
    const readline = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('\nDo you want to proceed? (yes/no): ', resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Collection creation cancelled.');
      process.exit(0);
    }
    
    // 컬렉션 생성
    console.log('\n🔄 Creating collection NFT on mainnet...');
    const { nft, response } = await metaplex.nfts().create({
      name: 'SOLARA COLLECTION',
      symbol: 'SLR',
      uri: `${IPFS_GATEWAY}/ipfs/${COLLECTION_JSON_CID}/collection.json`,
      sellerFeeBasisPoints: 500, // 5% royalty
      creators: [
        {
          address: mainnetKeypair.publicKey,
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
    
    console.log('\n✅ Collection NFT created successfully!');
    console.log('📍 Mint Address:', nft.address.toString());
    console.log('📝 Metadata Address:', nft.metadataAddress.toString());
    console.log('🔗 Transaction Signature:', response.signature);
    console.log(`📊 View on Solscan: https://solscan.io/tx/${response.signature}`);
    
    // 트랜잭션 확인
    console.log('\n⏳ Confirming transaction...');
    await connection.confirmTransaction(response.signature, 'finalized');
    console.log('✅ Transaction confirmed!');
    
    // 결과 저장
    const result = {
      network: 'mainnet-beta',
      collectionMint: nft.address.toString(),
      metadataAddress: nft.metadataAddress.toString(),
      transactionSignature: response.signature,
      createdAt: new Date().toISOString(),
      creator: mainnetKeypair.publicKey.toString(),
      collectionSize: COLLECTION_SIZE
    };
    
    const resultPath = path.join(process.cwd(), 'mainnet-collection-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    
    console.log('\n📁 Collection details saved to:', resultPath);
    console.log('\n🎉 SUCCESS! Your mainnet collection is ready.');
    console.log('\n⚠️  IMPORTANT: Save this collection mint address:');
    console.log(`   ${nft.address.toString()}`);
    console.log('\nYou will need this address for your mainnet deployment.');
    
    return result;
  } catch (err) {
    console.error('\n❌ Error creating collection NFT:', err.message);
    throw err;
  }
}

// 실행
createMainnetCollection()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Script failed:', err);
    process.exit(1);
  });