import Head from "next/head";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import FallbackLoading from "../components/FallbackLoading";
import ErrorBoundary from "../components/ErrorBoundary";
import LaunchAnnouncementModal from "../components/LaunchAnnouncementModal";

// Dynamic imports with error handling
const Layout = dynamic(() => import("../components/Layout").catch(err => {
  console.error("Failed to load Layout:", err);
  return ({ children }) => <div className="min-h-screen bg-black p-4">{children}</div>;
}), {
  loading: () => <FallbackLoading message="Loading application layout..." />
});

const LandingPage = dynamic(() => import("../components/LandingPage").catch(err => {
  console.error("Failed to load LandingPage:", err);
  return () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
      <h1 className="text-2xl font-bold mb-4">Welcome to SOLARA & TESOLA</h1>
      <p className="text-gray-300">There was a problem loading the landing page content.</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-purple-600 rounded-lg">
        Refresh Page
      </button>
    </div>
  );
}), {
  loading: () => <FallbackLoading message="Loading homepage content..." />
});

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
      
      {/* Wrap the main content in ErrorBoundary */}
      <ErrorBoundary>
        <Suspense fallback={<FallbackLoading />}>
          <Layout>
            <LandingPage />
            <LaunchAnnouncementModal />
          </Layout>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}