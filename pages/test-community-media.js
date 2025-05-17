import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function TestCommunityMedia() {
  const newsData = [
    {
      id: 1,
      title: "Meme Battle Governance Launched!",
      date: "May 5, 2025",
      author: "MemeLord",
      video: "/ss/s1.mp4",
      posterImage: "/ss/optimized/s1.webp",
      summary: "The most fun governance system in crypto!",
      link: "/blog/meme-battle-governance-launched",
      featured: true
    },
    {
      id: 6,
      title: "Upcoming Gaming Partnership",
      date: "April 10, 2025",
      author: "TESOLA Team",
      video: "/ss/s2.mp4",
      posterImage: "/ss/optimized/s2.webp",
      summary: "Get ready for a massive announcement!",
      link: "/blog/upcoming-gaming-partnership"
    }
  ];

  return (
    <Layout>
      <Head>
        <title>Test Community Media | TESOLA</title>
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Community Media Test</h1>
        
        <div className="space-y-8">
          {newsData.map(item => (
            <div key={item.id} className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">{item.title}</h2>
              <div className="mb-4">
                <p className="text-gray-400">ID: {item.id}</p>
                <p className="text-gray-400">Video: {item.video}</p>
                <p className="text-gray-400">Poster: {item.posterImage}</p>
                <p className="text-gray-400">Featured: {item.featured ? 'Yes' : 'No'}</p>
              </div>
              
              <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
                <video
                  key={item.video}
                  src={item.video}
                  poster={item.posterImage}
                  controls
                  className="w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              <div className="mt-4">
                <img 
                  src={item.posterImage} 
                  alt={`${item.title} poster`}
                  className="w-32 h-20 object-cover rounded"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-900/30 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-2">Debug Information</h3>
          <pre className="text-xs text-gray-300">{JSON.stringify(newsData, null, 2)}</pre>
        </div>
      </div>
    </Layout>
  );
}