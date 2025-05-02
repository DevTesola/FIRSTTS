import React from 'react';
import Head from 'next/head';

export default function TestPage() {
  return (
    <>
      <Head>
        <title>Test Page</title>
      </Head>
      <div className="bg-black text-white min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Test Page</h1>
        <p>This is a simple test page without any complex components.</p>
      </div>
    </>
  );
}