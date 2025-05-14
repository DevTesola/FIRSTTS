import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// 클라이언트 사이드에서만 로드되도록 동적 임포트 사용
const VideoLandingPage = dynamic(() => import('../components/VideoLandingPage'), {
  ssr: false,
});

export default function Landing() {
  return (
    <>
      <Head>
        <title>TESOLA - Welcome</title>
        <meta name="description" content="Welcome to TESOLA - The Future of Solana" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VideoLandingPage />
    </>
  );
}