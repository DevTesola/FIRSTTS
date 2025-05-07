// scripts/checkCollectionPDAs.js

import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

async function main() {
  // Devnet RPC
  const connection = new Connection("https://api.devnet.solana.com");

  // 여러분의 Devnet 컬렉션 민트 주소
  const COLLECTION_MINT = new PublicKey("AjeuEmRPH6c4CH6WEhGghJPAPHtiGQD93zmXLRFAWKo7");

  // Metadata PDA
  const [collectionMetadataPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), COLLECTION_MINT.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
  // Master Edition PDA
  const [collectionMasterEditionPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      COLLECTION_MINT.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  // Collection Authority Record PDA (Metaplex v1.5+)
  const [collectionAuthorityRecordPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      COLLECTION_MINT.toBuffer(),
      Buffer.from("collection_authority"),
      new PublicKey("qNfZ9QHYyu5dDDMvVAZ1hE55JX4GfUYQyfvLzZKBZi3").toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  console.log("Collection Metadata PDA:      ", collectionMetadataPDA.toBase58());
  console.log("Collection MasterEdition PDA: ", collectionMasterEditionPDA.toBase58());
  console.log("Collection AuthorityRec PDA:  ", collectionAuthorityRecordPDA.toBase58());

  // 계정 존재 여부
  const metaInfo = await connection.getAccountInfo(collectionMetadataPDA);
  const editionInfo = await connection.getAccountInfo(collectionMasterEditionPDA);
  console.log("→ Metadata account exists?  ", !!metaInfo);
  console.log("→ MasterEdition exists?     ", !!editionInfo);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
