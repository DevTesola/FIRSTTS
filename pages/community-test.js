import React from "react";
import Head from "next/head";
import Layout from "../components/Layout";

export default function CommunityTestPage() {
  return (
    <>
      <Head>
        <title>TESOLA - Community Test</title>
        <meta name="description" content="Simple test page" />
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-white mb-5">Community Test Page</h1>
          <p className="text-gray-300">This is a simple test page to verify rendering works correctly.</p>
          
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-xl font-bold text-white mb-3">News & Events</h2>
              <p className="text-gray-400">Project updates and announcements</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-xl font-bold text-white mb-3">Garage</h2>
              <p className="text-gray-400">Memes and fun content</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-5">
              <h2 className="text-xl font-bold text-white mb-3">Community</h2>
              <p className="text-gray-400">User discussion forum</p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}