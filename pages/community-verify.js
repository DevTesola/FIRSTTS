import React from 'react';
import Head from 'next/head';
import CommunityPage from '../components/community/CommunityPage';

/**
 * Verification page for the Community component
 * This page renders the CommunityPage component directly without the Layout wrapper
 * for testing purposes
 */
export default function CommunityVerify() {
  return (
    <>
      <Head>
        <title>TESOLA - Community Verification</title>
        <meta name="description" content="Testing the Community component rendering" />
      </Head>

      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-white text-2xl font-bold mb-6">Component Verification</h1>
          <div className="bg-gray-900 rounded-lg p-4 mb-8">
            <p className="text-gray-300">This page is for testing CommunityPage rendering without the Layout component wrapper.</p>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            {/* Render the CommunityPage component directly */}
            <CommunityPage />
          </div>
        </div>
      </div>
    </>
  );
}