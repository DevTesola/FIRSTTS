// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function MyDocument() {
  return (
    <Html lang="en">
      <Head>
        {/* Meta tags - Enhanced for mobile optimization */}
        <meta name="theme-color" content="#4c1d95" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logo2.png" />
        <link rel="apple-touch-startup-image" href="/logo2.png" />
        
        {/* Proper font loading with correct preload attributes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" 
          rel="stylesheet"
          media="print" 
          onLoad="this.media='all'" 
        />
        
        {/* 외부 스타일 로딩 코드 제거 */}
        
        {/* Inline styles for critical CSS */}
        <style>
          {`
          /* 최소한의 기본 스타일만 적용 */
          html, body {
            font-family: 'Orbitron', sans-serif !important;
          }
          `}
        </style>
      </Head>
      <body className="font-orbitron">
        <Main />
        <NextScript />
        
        {/* 모든 커스텀 스크립트는 비활성화 */}
        {/* <script src="/cursor.js" /> */}
        
        {/* 오류 복구 스크립트 유지 */}
        <script src="/recovery.js" />
        
        {/* 오류 컴포넌트 유지 */}
        <script src="/error-components.js" />

        {/* Service worker unregister patch for Vercel compatibility */}
        <script src="/swr-patch.js" />
        
        {/* 행성 애니메이션 수정 스크립트 */}
        <script src="/planet-fix.js" />
      </body>
    </Html>
  );
}