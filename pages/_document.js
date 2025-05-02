// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function MyDocument() {
  return (
    <Html lang="en">
      <Head>
        {/* 추가 및 수정된 메타 태그 */}
        <meta name="theme-color" content="#4c1d95" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo2.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}