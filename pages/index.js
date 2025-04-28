import Head from "next/head";
import HomePage from "../components/HomePage";
import Layout from "../components/Layout";

export default function Index() {
  return (
    <Layout>
      <Head>
        <title>SOLARA GEN:0 - NFT Minting on Solana</title>
        <meta
          name="description"
          content="Mint unique SOLARA GEN:0 NFTs on the Solana blockchain."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HomePage initialMintedCount={0} />
    </Layout>
  );
}