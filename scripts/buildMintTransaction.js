import { SELLER_KEYPAIR } from "../../utils/sellerKeypair";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV2Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from "@metaplex-foundation/mpl-token-metadata";
import { createClient } from "@supabase/supabase-js";
import { SOLANA_RPC_ENDPOINT } from "../../utils/cluster";

const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const COLLECTION_MINT = new PublicKey(process.env.NEXT_PUBLIC_COLLECTION_MINT);
const SELLER_PUBLIC_KEY = new PublicKey(process.env.NEXT_PUBLIC_SELLER_PUBLIC_KEY);
const RESOURCE_CID = process.env.NEXT_PUBLIC_RESOURCE_CID;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { wallet } = req.body;
  if (!wallet || typeof wallet !== "string") {
    return res.status(400).json({ error: "wallet is missing or invalid" });
  }
  console.log("🔍 Request body wallet:", req.body.wallet);

  let publicKey;
  try {
    publicKey = new PublicKey(wallet);
    console.log("wallet toBase58:", publicKey?.toBase58());
  } catch (e) {
    return res.status(400).json({ error: "Invalid public key" });
  }

  try {
    let randIndex;
    let attempts = 0;
    do {
      randIndex = Math.floor(Math.random() * 1000) + 1;
      const { data, error } = await supabase.from("minted_nfts").select("id").eq("mint_index", randIndex);
      if (error) throw error;
      if (data.length === 0) break;
      attempts++;
    } while (attempts < 10);
    if (attempts >= 10) return res.status(400).json({ error: "All NFTs minted" });

    const filename = String(randIndex).padStart(4, "0");
    const metaUrl = `https://ipfs.io/ipfs/${RESOURCE_CID}/${filename}.json`;

    let metaRes;
    try {
      metaRes = await fetch(metaUrl);
      if (!metaRes.ok) {
        metaRes = await fetch(`https://ipfs.io/ipfs/${RESOURCE_CID}/${filename}.json`);
      }
      if (!metaRes.ok) throw new Error("Metadata fetch failed");
    } catch (e) {
      return res.status(500).json({ error: "Metadata fetch failed", message: e.message });
    }

    const metadata = await metaRes.json();
    console.log("🧪 metadata:", metadata);
    if (!metadata.name || !metadata.uri) return res.status(400).json({ error: "Invalid metadata" });

    const mint = Keypair.generate();
    console.log("✅ BEFORE: PDA 계산");
    const [metadataPDA] = await PublicKey.findProgramAddress([
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.publicKey.toBuffer(),
    ], TOKEN_METADATA_PROGRAM_ID);

    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });
    console.log("✅ AFTER: metadataPDA");
    const initMintIx = createInitializeMintInstruction(mint.publicKey, 0, SELLER_PUBLIC_KEY, SELLER_PUBLIC_KEY);
    const ata = await getAssociatedTokenAddress(mint.publicKey, publicKey);
    const createATAIx = createAssociatedTokenAccountInstruction(publicKey, ata, publicKey, mint.publicKey);
    const mintToIx = createMintToInstruction(mint.publicKey, ata, SELLER_PUBLIC_KEY, 1);

    console.log("✅ DEBUG: preparing metadataIx");

    try {
      console.log("➡ creators raw:", JSON.stringify(metadata.properties?.creators, null, 2));
      if (!Array.isArray(metadata.properties?.creators)) {
        console.log("❗ creators is not an array or missing.");
      } else {
        metadata.properties.creators.forEach((c, i) => {
          console.log(`🔹 creators[${i}]`, c);
        });
      }
    } catch (metaLogErr) {
      console.error("❌ logging creators failed:", metaLogErr);
    }
    
    const metadataIx = createCreateMetadataAccountV2Instruction({
      metadata: metadataPDA,
      mint: mint.publicKey,
      mintAuthority: SELLER_PUBLIC_KEY,
      payer: publicKey,
      updateAuthority: SELLER_PUBLIC_KEY,
    }, {
      createMetadataAccountArgsV2: {
        data: {
          name: metadata.name,
          symbol: metadata.symbol || "",
          uri: metadata.uri,
          sellerFeeBasisPoints: metadata.seller_fee_basis_points ?? 500,
          creators: (Array.isArray(metadata.properties?.creators)
          ? metadata.properties.creators.map((c, i) => {
              if (!c?.address || typeof c.share !== "number") {
                console.error(`🚨 Creator 오류 at index ${i}:`, c);
                throw new Error("Invalid creator object in metadata");
              }
              return {
                address: new PublicKey(c.address),
                verified: true,
                share: c.share,
              };
            })
          : []
        ),
        
          collection: {
            key: COLLECTION_MINT,
            verified: true,
          },
          uses: null,
        },
        isMutable: true,
      },
    });
    console.log("✅ AFTER: createMetadataAccountIx");

    const transferIx = SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: SELLER_PUBLIC_KEY,
      lamports: 1.5 * 1_000_000_000,
    });

    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    let tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash })
      .add(createMintAccountIx, initMintIx, createATAIx, mintToIx, metadataIx, transferIx);
      console.log("📦 트랜잭션 인스트럭션 구성 완료");

      // simulateTransaction은 실제 실행 전에 오류를 미리 감지할 수 있는 매우 강력한 도구입니다
      try {
        const sim = await connection.simulateTransaction(tx);
        console.log("🧪 시뮬레이션 결과:", JSON.stringify(sim.value, null, 2));
      
        if (sim.value?.err) {
          console.error("❌ 시뮬레이션 오류:", sim.value.err);
          if (sim.value.logs) {
            console.error("🪵 시뮬레이션 로그:", sim.value.logs.join("\\n"));
          }
          throw new Error("Transaction simulation failed");
        }
      } catch (e) {
        console.error("❌ simulateTransaction 자체 실패:", e);
        throw e; // ✅ 반드시 throw 해서 catch (error) 로 이어지게 만듦
      }
      

    tx.partialSign(mint);
    console.log("✅ 트랜잭션 구성 완료, 직렬화 시작");

    const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");

    return res.status(200).json({
      transaction: serialized,
      mint: mint.publicKey.toString(),
      filename,
      randIndex,
      metadataPDA: metadataPDA?.toBase58() || null,
    });

  } catch (error) {
    console.error("🧨 catch triggered. FULL ERROR:", error);
    if (error instanceof Error && error.stack) {
      console.error("🧨 STACK:", error.stack);
    } else {
      console.error("🧨 RAW error dump:", JSON.stringify(error, null, 2));
    }
    return res.status(500).json({ error: error.message ?? "Unknown error" });
  }
}
