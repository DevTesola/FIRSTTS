import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import CommunityPage from '../components/community/CommunityPage';

/**
 * Community Hub page
 * This page uses the Layout component for consistent site navigation/footer
 * and the CommunityPage component for the main content
 */
export default function Community() {
  return (
    <>
      <Head>
        <title>TESOLA - Community Hub</title>
        <meta name="description" content="Join the TESOLA community for the latest news, memes, and discussions about our NFT ecosystem." />
      </Head>

      <Layout>
        <CommunityPage />
      </Layout>
    </>
  );
}