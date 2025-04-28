"use client";

import dynamic from "next/dynamic";
import "../styles/globals.css";

const WalletWrapper = dynamic(() => import("../components/WalletWrapper"), { ssr: false });

export default function MyApp({ Component, pageProps }) {
  // 여기서 Layout을 제거하고 각 페이지에서 처리하도록 합니다
  return (
    <WalletWrapper>
      <Component {...pageProps} />
    </WalletWrapper>
  );
}