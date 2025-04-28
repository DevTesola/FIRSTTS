// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

// Next.js 13+ recommends a functional Document instead of extending a class
export default function MyDocument() {
  return (
    <Html lang="en">
      <Head>
        {/* Tailwind CSS, meta tags, favicons 등 */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
