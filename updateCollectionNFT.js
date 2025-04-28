require('dotenv').config({ path: './.env.development.local' });

const { Connection, PublicKey } = require('@solana/web3.js');
const { Metaplex, keypairIdentity } = require('@metaplex-foundation/js');
const { SELLER_KEYPAIR } = require('./server/utils/sellerKeypair');

const SOLANA_RPC_ENDPOINT = 'https://api.devnet.solana.com';
const COLLECTION_MINT_ADDRESS = '4T9zHFiPTkXjd4jHiuugktCCK9dMEg6mT94hJeySSvSA'; // Step 2.2에서 얻은 최신 민트 주소로 교체

async function updateCollectionNFT() {
  try {
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const metaplex = Metaplex.make(connection).use(keypairIdentity(SELLER_KEYPAIR));

    // 컬렉션 NFT 로드
    console.log('Loading collection NFT...');
    const collectionMint = new PublicKey(COLLECTION_MINT_ADDRESS);
    const collectionNft = await metaplex.nfts().findByMint({ mintAddress: collectionMint });

    // collectionDetails 업데이트
    console.log('Updating collection NFT with collectionDetails...');
    await metaplex.nfts().update({
      nftOrSft: collectionNft,
      collectionDetails: {
        __kind: 'V1',
        size: 1000, // 컬렉션 크기 설정 (SOLARA GEN:0은 1000개)
      },
    }, { commitment: 'confirmed' });

    console.log('Collection NFT updated successfully:');
    console.log('Mint Address:', collectionNft.address.toBase58());
    console.log('Update Authority:', collectionNft.updateAuthorityAddress.toBase58());
  } catch (err) {
    console.error('Error updating collection NFT:', err);
  }
}

updateCollectionNFT();