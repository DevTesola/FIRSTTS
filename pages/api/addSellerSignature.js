import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createVerifyCollectionInstruction } from "@metaplex-foundation/mpl-token-metadata";
import { SOLANA_RPC_ENDPOINT } from "../../utils/cluster";
import { SELLER_KEYPAIR } from "../../utils/sellerKeypair";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { txBase64, metadataPDA, collectionPdas } = req.body;
    if (!txBase64 || !metadataPDA || !collectionPdas?.collectionMint) {
      throw new Error("Missing required fields");
    }

    const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
    const tx = Transaction.from(Buffer.from(txBase64, "base64"));

    // 컬렉션 검증 명령어 추가
    const verifyIx = createVerifyCollectionInstruction({
      metadata: new PublicKey(metadataPDA),
      collectionMint: new PublicKey(collectionPdas.collectionMint),
      collectionMetadata: new PublicKey(collectionPdas.collectionMetadata),
      collectionMasterEdition: new PublicKey(collectionPdas.collectionMasterEdition),
      collectionAuthority: SELLER_KEYPAIR.publicKey,
      payer: SELLER_KEYPAIR.publicKey,
    });

    tx.add(verifyIx);
    tx.sign(SELLER_KEYPAIR); // ✅ 서명 추가

    return res.status(200).json({
      txBase64: tx.serialize().toString("base64"),
    });
  } catch (error) {
    console.error("[addSellerSignature] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}