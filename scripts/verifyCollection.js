import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// 연결
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

// 지갑
const secret = JSON.parse(fs.readFileSync("./mintWallet.json", "utf8"));
const wallet = Keypair.fromSecretKey(new Uint8Array(secret));
console.log("SELLER_WALLET.publicKey:", wallet.publicKey.toBase58());

// SDK 초기화
const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet));

// 민트 주소는 PublicKey로, 명시적으로!
const NFT_MINT_ADDRESS = new PublicKey("FBVytgNjbXgnZPzgHQ9VNq6uALgrREye97MgzD4exHVZ");

async function runVerify() {
  try {
    const nft = await metaplex.nfts().findByMint({ mintAddress: NFT_MINT_ADDRESS });

    const result = await metaplex.nfts().verifyCollection({
      mintAddress: NFT_MINT_ADDRESS,
      collectionMintAddress: nft.collection?.address, // 이게 핵심
      isSizedCollection: false,
    });

    console.log("✅ 컬렉션 verify 성공!");
    console.log("🔗 트랜잭션:", result.response.signature);
  } catch (err) {
    console.error("❌ verify 실패:", err.message || err);
    process.exit(1);
  }
}

runVerify();
