import Head from "next/head";
import HomePage from "../components/HomePage";
import Layout from "../components/Layout";
import LaunchAnnouncementModal from "../components/LaunchAnnouncementModal";
import { useEffect } from "react";

export default function NFTMintingPage() {
  // 버튼 클릭 이벤트 리스너 추가
  useEffect(() => {
    const handleShowPreview = () => {
      // 커스텀 이벤트를 HomePage 컴포넌트로 보내기
      window.dispatchEvent(new CustomEvent('show-preview-nft'));
    };
    
    window.addEventListener('show-nft-preview', handleShowPreview);
    
    return () => {
      window.removeEventListener('show-nft-preview', handleShowPreview);
    };
  }, []);
  
  return (
    <>
      <Head>
        <title>SOLARA GEN:0 - NFT Minting on Solana</title>
        <meta
          name="description"
          content="Mint unique SOLARA GEN:0 NFTs on the Solana blockchain. Join the ultimate community of Solana Maxis."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4B0082" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content="SOLARA GEN:0 - NFT Minting on Solana" />
        <meta property="og:description" content="Mint unique SOLARA GEN:0 NFTs on the Solana blockchain. Join the ultimate community of Solana Maxis." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://tesola.xyz/nft" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SOLARA GEN:0 - NFT Minting on Solana" />
        <meta name="twitter:description" content="Mint unique SOLARA GEN:0 NFTs on the Solana blockchain. Join the ultimate community of Solana Maxis." />
        <meta name="twitter:image" content="/og-image.jpg" />
      </Head>
      <Layout>
        <HomePage initialMintedCount={0} />
        <LaunchAnnouncementModal />
      </Layout>
    </>
  );
}