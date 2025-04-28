// pages/api/getTransactions.js
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

// 환경 변수
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const SOLARA_COLLECTION_ID = process.env.NEXT_PUBLIC_SOLARA_COLLECTION_ID || '3pKP7a1Z744DyHxt3gpYyTSvGUMLYKDAwzZJCVHcQuXe';

// SOLARA NFT 확인 함수
function isSolaraNFT(nft) {
  // 컬렉션 ID로 확인
  if (nft.collection && nft.collection.key && 
      nft.collection.key.toString() === SOLARA_COLLECTION_ID) {
    return true;
  }
  
  // 이름으로 백업 확인
  if (nft.name && typeof nft.name === 'string' && nft.name.includes("SOLARA")) {
    return true;
  }
  
  return false;
}

export default async function handler(req, res) {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    console.log('RPC Endpoint:', SOLANA_RPC_ENDPOINT);
    
    // Metaplex 인스턴스 생성
    const metaplex = new Metaplex(connection);
    
    // 사용자의 NFT 가져오기
    let userNfts = [];
    try {
      userNfts = await metaplex.nfts().findAllByOwner({
        owner: new PublicKey(wallet)
      });
      console.log(`Found ${userNfts.length} NFTs owned by wallet`);
    } catch (err) {
      console.error("Error fetching NFTs:", err);
    }
    
    // 최근 트랜잭션 가져오기
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(wallet),
      { limit: 10 }
    );
    
    // 트랜잭션 세부 정보 처리
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          // 트랜잭션 정보 가져오기
          let nftMint = "";
          let nftName = "SOLARA NFT";
          let matchedNft = null;
          
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            });
            
            if (tx && tx.meta && tx.meta.postTokenBalances) {
              for (const balance of tx.meta.postTokenBalances) {
                if (balance.uiTokenAmount && balance.uiTokenAmount.uiAmount === 1) {
                  const currentMint = balance.mint;
                  
                  // 사용자의 NFT 중에서 이 민트 주소를 가진 NFT 찾기
                  matchedNft = userNfts.find(
                    nft => nft.mintAddress && nft.mintAddress.toString() === currentMint && isSolaraNFT(nft)
                  );
                  
                  if (matchedNft) {
                    nftMint = currentMint;
                    nftName = matchedNft.name || "SOLARA NFT";
                    break;
                  }
                }
              }
            }
          } catch (txErr) {
            console.error(`Error getting transaction details: ${txErr.message}`);
          }
          
          return {
            signature: sig.signature,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            status: 'verified',
            nftMint,
            nftName
          };
        } catch (err) {
          console.error(`Error processing transaction ${sig.signature}:`, err);
          return {
            signature: sig.signature,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            status: 'verified',
            nftMint: "",
            nftName: "SOLARA NFT"
          };
        }
      })
    );
    
    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error in getTransactions API:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions: ' + error.message });
  }
}