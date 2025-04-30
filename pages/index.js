import Head from "next/head";
import Layout from "../components/Layout";
import LandingPage from "../components/LandingPage";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SOLARA & TESOLA - NFT Collection & Token Ecosystem</title>
        <meta
          name="description"
          content="Explore the SOLARA NFT Collection and participate in the TESOLA token presale on the Solana blockchain."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4B0082" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content="SOLARA & TESOLA - NFT Collection & Token Ecosystem" />
        <meta property="og:description" content="Explore the SOLARA NFT Collection and participate in the TESOLA token presale on the Solana blockchain." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://tesola.xyz" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SOLARA & TESOLA - NFT Collection & Token Ecosystem" />
        <meta name="twitter:description" content="Explore the SOLARA NFT Collection and participate in the TESOLA token presale on the Solana blockchain." />
        <meta name="twitter:image" content="/og-image.jpg" />
      </Head>
      <Layout>
        <LandingPage />
      </Layout>
    </>
  );
}