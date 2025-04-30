// update-metadata-latest.js
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { 
  Metaplex, 
  keypairIdentity, 
  toMetaplexFile,
  findMetadataPda
} from '@metaplex-foundation/js';
import fs from 'fs';

async function updateMetadata() {
  try {
    console.log('Reading keypair...');
    const keypairPath = 'C:/Users/YUNO/phantom-wallets/tesola_main.json';
    console.log('Reading keypair from:', keypairPath);
    
    // 키페어 로드
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    // 연결 설정
    console.log('Connecting to Solana...');
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // 토큰 주소
    const mintAddress = new PublicKey('DLKpkX9dfd8wUkXLVskyKF882i3ziifyF1XvYh19BXk4');
    console.log('Using mint address:', mintAddress.toString());
    
    // Metaplex 인스턴스 생성
    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));
    
    // NFT 정보 가져오기
    console.log('Fetching token metadata...');
    const nft = await metaplex.nfts().findByMint({ mintAddress });
    console.log('Current metadata URI:', nft.uri);
    
    // 메타데이터 업데이트
    console.log('Updating metadata...');
    const newUri = 'https://tesola.mypinata.cloud/ipfs/bafkreic7s5vnzwormeg7zqxdqme4gvikqkk4qk3dgidlh2ghzmjrslfmta';
    console.log('New URI:', newUri);
    
    const { response } = await metaplex.nfts().update({
      nftOrSft: nft,
      uri: newUri,
    });
    
    console.log('Metadata updated successfully!');
    console.log('Transaction signature:', response.signature);
    console.log('Verify your transaction at: https://solscan.io/tx/' + response.signature);
  } catch (error) {
    console.error('Error updating metadata:', error);
    if (error.logs) {
      console.error('Transaction logs:');
      console.error(error.logs.join('\n'));
    }
  }
}

updateMetadata();