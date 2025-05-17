import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ScrollableTabs from "../common/ScrollableTabs";
import LoadingSkeleton from "../LoadingSkeleton";
import { BlogMediaHybrid } from "../BlogMediaHybrid";

// Visual components
const GlowEffect = ({ color = "purple", children, className = "" }) => {
  let gradientColors = "from-purple-600/50 to-pink-600/50";
  if (color === "blue") gradientColors = "from-blue-600/50 to-indigo-600/50";
  if (color === "green") gradientColors = "from-green-600/50 to-teal-600/50";
  if (color === "pink") gradientColors = "from-pink-600/50 to-rose-600/50";
  
  return (
    <div className={`relative group ${className}`}>
      <div className={`absolute -inset-0.5 rounded-lg blur-md bg-gradient-to-r ${gradientColors} opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse-slow`}></div>
      <div className="relative bg-gray-900 rounded-lg p-5 ring-1 ring-gray-800/50">
        {children}
      </div>
    </div>
  );
};

/**
 * Community Hub Page Component - Main content for the community page
 * Features a vibrant, animated design with three content tabs
 */
export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("news");
  const [isLoading, setIsLoading] = useState(false);
  // BlogMediaHybrid handles its own loading state
  const [videoLoading, setVideoLoading] = useState({});
  const [error, setError] = useState(null);
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  
  // Handle tab change from URL params on page load
  useEffect(() => {
    const { tab } = router.query;
    if (tab && ["news", "garage", "forum"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router.query]);
  
  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/community?tab=${tab}`, undefined, { shallow: true });
  };

  // News data with actual blog links
  const newsData = [
    {
      id: 1,
      title: "Meme Battle Governance Launched!",
      date: "May 20, 2025",
      author: "DevTeam",
      image: "/ss/s2.gif",
      summary: "The most fun governance system in crypto! Vote for your favorite memes, earn rewards, and become the Meme Lord of TESOLA!",
      link: "/blog/meme-battle-governance-launched",
      featured: true
    },
    {
      id: 2,
      title: "TESOLA Token Launch Success!",
      date: "May 1, 2025",
      author: "TESOLA Team",
      image: "/ss/s17.png",
      summary: "We're excited to announce the successful launch of TESOLA token on Solana. Join our growing community and be part of the future!",
      link: "/blog/tesola-token-launch-success"
    },
    {
      id: 3,
      title: "SOLARA NFT Evolution System",
      date: "May 15, 2025",
      author: "DevTeam",
      image: "/zz/0011z.jpg",
      summary: "Discover how SOLARA NFTs evolve through staking, unlocking new visual traits and earning multipliers. Complete guide inside!",
      link: "/blog/solara-nft-evolution-guide"
    },
    {
      id: 4,
      title: "New Staking Rewards Boost Program",
      date: "April 22, 2025",
      author: "TESOLA Team",
      image: "/nft-previews/0418.png",
      summary: "Stake multiple NFTs to earn bonus multipliers on your rewards. New program starts next week!",
      link: "/staking-rewards-boost"
    },
    {
      id: 4,
      title: "Community AMA Summary",
      date: "April 15, 2025",
      author: "Community Manager",
      image: "/ss/s5.png",
      summary: "Read the highlights from our recent Ask Me Anything session with the founding team.",
      link: "/blog/community-ama-summary"
    },
    {
      id: 5,
      title: "Upcoming Gaming Partnership",
      date: "April 10, 2025",
      author: "TESOLA Team",
      image: "/ss/s1.gif",
      summary: "We're excited to announce an upcoming partnership with a major gaming studio.",
      link: "/blog/upcoming-gaming-partnership"
    }
  ];
  
  // Mock data for garage section with media
  const garageData = [
    {
      id: 1,
      type: "meme",
      title: "When your NFT earns more TESOLA than expected",
      image: "/nft-previews/0327.png",
      creator: "TES_ChampX999",
      likes: 245,
      comments: 42,
      tags: ["NFT", "TESOLA", "ToTheMoon"]
    },
    {
      id: 2,
      type: "meme",
      title: "Waiting for the blockchain to confirm my transaction",
      image: "/nft-previews/0416.png",
      creator: "SOL_Master4242",
      likes: 189,
      comments: 31,
      tags: ["Solana", "Speed", "Waiting"]
    },
    {
      id: 3,
      type: "art",
      title: "TESOLA Astronaut - Fan Art",
      image: "/nft-previews/0579.png",
      creator: "NFT_Creator7892",
      likes: 312,
      comments: 56,
      tags: ["FanArt", "Digital", "Astronaut"]
    },
    {
      id: 4,
      type: "video",
      title: "When you realize how much your SOLARA NFT is worth now",
      video: "/nft-previews/0113.mp4",
      posterImage: "/nft-previews/0113.mp4",
      creator: "MemeGod_5678",
      likes: 423,
      comments: 87,
      tags: ["Reaction", "Value", "Growth"]
    },
    {
      id: 5,
      type: "video",
      title: "My reaction to the new TESOLA features",
      video: "/nft-previews/0625.mp4",
      posterImage: "/nft-previews/0625.mp4",
      creator: "TesUser_3456",
      likes: 276,
      comments: 43,
      tags: ["Excited", "Features", "Update"]
    }
  ];
  
  // Mock data for forum section
  const forumData = [
    {
      id: 1,
      title: "Staking Strategy Discussion",
      author: "CryptoStrategist",
      replies: 37,
      views: 842,
      lastPost: "10 minutes ago",
      pinned: true,
      category: "Strategy"
    },
    {
      id: 2,
      title: "Technical Analysis: TESOLA Price Prediction",
      author: "ChartWizard",
      replies: 23,
      views: 512,
      lastPost: "2 hours ago",
      hot: true,
      category: "Market"
    },
    {
      id: 3,
      title: "Beginner's Guide to NFT Evolution",
      author: "NFTNewbie",
      replies: 18,
      views: 346,
      lastPost: "1 day ago",
      category: "Guides"
    },
    {
      id: 4,
      title: "Legendary NFT Showcase Thread",
      author: "LegendaryHolder",
      replies: 42,
      views: 678,
      lastPost: "5 hours ago",
      category: "Showcase"
    },
    {
      id: 5,
      title: "Fan Art Competition Results",
      author: "CommunityMod",
      replies: 29,
      views: 423,
      lastPost: "3 days ago",
      category: "Events"
    },
    {
      id: 6,
      title: "Suggestions for Platform Improvement",
      author: "IdeasGuy",
      replies: 31,
      views: 289,
      lastPost: "12 hours ago",
      category: "Feedback"
    },
    {
      id: 7,
      title: "Trading NFTs - Marketplace Options",
      author: "NFTTrader",
      replies: 15,
      views: 201,
      lastPost: "2 days ago",
      category: "Trading"
    }
  ];

  // Render News & Events tab content
  const renderNewsContent = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Featured News */}
      {newsData.filter(item => item.featured).map(featured => (
        <GlowEffect key={featured.id} color="purple" className="mb-8">
          <div className="md:flex">
            <div className="md:w-1/2 relative h-60 md:h-auto mb-4 md:mb-0">
              {featured.image && (
                <div className="relative h-full rounded-lg overflow-hidden">
                  <BlogMediaHybrid 
                    src={featured.image} 
                    alt={featured.title}
                    className="w-full h-full transition-transform duration-500 hover:scale-105 transform"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-1/3"></div>
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-glow-purple">
                    Featured
                  </div>
                </div>
              )}
            </div>
            <div className="md:w-1/2 md:pl-6 flex flex-col justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {featured.date} • <span className="ml-1 text-purple-400">{featured.author}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 hover:text-purple-400 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-gray-300 mb-4">{featured.summary}</p>
              </div>
              <div>
                <Link href={featured.link} className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40">
                  Read Full Article
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </GlowEffect>
      ))}

      {/* News Grid with hover effects and beautiful cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsData.filter(item => !item.featured).map(news => (
          <div 
            key={news.id} 
            className="group bg-gray-800/50 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-purple-500/20 hover:shadow-lg transform hover:-translate-y-1 flex flex-col"
          >
            {news.image && (
              <div className="relative h-48 overflow-hidden">
                <BlogMediaHybrid 
                  src={news.image} 
                  alt={news.title}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-110 transform"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-1/3"></div>
              </div>
            )}
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs">{news.date}</span>
                <span className="text-purple-400 text-xs">{news.author}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                {news.title}
              </h3>
              <p className="text-gray-300 text-sm line-clamp-3">{news.summary}</p>
            </div>
            <div className="p-5 pt-0 mt-auto">
              <a 
                href={news.link} 
                className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm font-medium group-hover:translate-x-1 transition-transform"
              >
                Read more
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter signup with animation */}
      <div className="relative mt-12 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40 z-0"></div>
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="particles-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  width: `${Math.random() * 10 + 2}px`,
                  height: `${Math.random() * 10 + 2}px`,
                  opacity: Math.random() * 0.5 + 0.25,
                  backgroundColor: i % 2 === 0 ? "#c084fc" : "#f472b6",
                }}
              ></div>
            ))}
          </div>
        </div>
        <div className="relative z-10 p-8">
          <div className="md:flex items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-2">Stay updated with TESOLA News</h3>
              <p className="text-gray-300">Get the latest news, updates, and exclusive offerings through our official Telegram channel.</p>
            </div>
            <a 
              href="https://t.me/tesolachat"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2 fill-current">
                <path d="M12 0c-6.626 0-12 5.372-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm3.224 17.871c.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-6.895c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953.188.133.43.131.618-.002.401-.286.175-.857-.394-.857h-3.592c-.57 0-.796.571-.395.857.188.133.43.131.618-.002.932-.661 1.608-1.734 1.608-2.953 0-1.984-1.602-3.592-3.58-3.592s-3.58 1.608-3.58 3.592c0 1.219.676 2.292 1.608 2.953zm-.649-5.443c.654-1.561 2.067-3.182 3.425-3.182s2.771 1.621 3.425 3.182c.146.35.681.336.682-.071 0-2.235-1.836-4.046-4.107-4.046s-4.107 1.811-4.107 4.046c0 .407.536.421.682.071z"/>
              </svg>
              Join Our Telegram Channel
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Garage (Memes) tab content with media support
  const renderGarageContent = () => (
    <div className="animate-fade-in space-y-8">
      {/* Upload button for authenticated users with animated glowing effect */}
      <div className="flex justify-end mb-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
          <button className="relative px-5 py-2.5 bg-gray-900 text-white rounded-lg flex items-center font-medium z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Share Content
          </button>
        </div>
      </div>

      {/* Mobile-optimized filter tabs with ScrollableTabs */}
      <ScrollableTabs
        tabs={[
          { id: "all", label: "All" },
          { id: "memes", label: "Memes" },
          { id: "fanart", label: "Fan Art" },
          { id: "videos", label: "Videos" },
          { id: "mostliked", label: "Most Liked" },
          { id: "new", label: "New" }
        ]}
        activeTab="all"
        onTabChange={(id) => console.log(`Filter selected: ${id}`)}
        colorFrom="pink-600"
        colorTo="purple-600"
        className="mb-6"
      />

      {/* Content grid with media support and enhanced visuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {garageData.map(item => (
          <div 
            key={item.id} 
            className="group bg-gray-800/50 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 hover:border-pink-500/30 transition-all duration-300 hover:shadow-pink-500/20 hover:shadow-lg transform hover:-translate-y-1"
          >
            {/* Video content */}
            {item.type === 'video' && (
              <div className="relative aspect-video bg-gray-900">
                {videoLoading[item.id] && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800">
                    <LoadingSkeleton height="100%" width="100%" />
                  </div>
                )}
                <video 
                  className="w-full h-full object-cover"
                  poster={item.posterImage}
                  controls
                  muted
                  loop
                  onLoadStart={() => setVideoLoading(prev => ({ ...prev, [item.id]: true }))}
                  onLoadedData={() => setVideoLoading(prev => ({ ...prev, [item.id]: false }))}
                >
                  <source src={item.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full h-8 w-8 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Image content */}
            {(item.type === 'meme' || item.type === 'art') && (
              <div className="relative aspect-square overflow-hidden bg-gray-900">
                <BlogMediaHybrid 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-110 transform"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full px-3 py-1 text-xs font-medium shadow-lg">
                  {item.type === 'meme' ? 'MEME' : 'ART'}
                </div>
              </div>
            )}
            
            {/* Content info with improved typography and layout */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-400 transition-colors line-clamp-2">{item.title}</h3>
              
              <div className="flex justify-between mb-4">
                <div className="text-gray-400 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {item.creator}
                </div>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center text-gray-400 hover:text-red-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>{item.likes}</span>
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span>{item.comments}</span>
                  </button>
                </div>
              </div>
              
              {/* Tags with hover effects */}
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-gray-900 text-gray-300 hover:bg-gray-800 px-2 py-1 rounded-md text-xs hover:text-pink-300 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button with hover animation */}
      <div className="mt-8 flex justify-center">
        <button className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-md flex items-center border border-gray-700 hover:border-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Load More
        </button>
      </div>
    </div>
  );

  // Render Community (Forum) tab content with enhanced visuals
  const renderForumContent = () => (
    <div className="animate-fade-in space-y-8">
      {/* Forum header with gradient background */}
      <GlowEffect color="blue" className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              Community Forum
            </h2>
            <p className="text-gray-400">Connect with the TESOLA community, share ideas, and get help.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search topics..." 
                  className="bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200 animate-pulse-slow"></div>
              <button className="relative px-5 py-2.5 bg-gray-900 text-white rounded-lg flex items-center font-medium z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Topic
              </button>
            </div>
          </div>
        </div>
      </GlowEffect>

      {/* Mobile-optimized categories with ScrollableTabs */}
      <ScrollableTabs
        tabs={[
          { id: "alltopics", label: "All Topics" },
          { id: "strategy", label: "Strategy" },
          { id: "market", label: "Market" },
          { id: "technical", label: "Technical" },
          { id: "guides", label: "Guides" },
          { id: "showcase", label: "Showcase" }
        ]}
        activeTab="alltopics"
        onTabChange={(id) => console.log(`Category selected: ${id}`)}
        colorFrom="blue-600"
        colorTo="indigo-600"
        className="mb-6"
      />

      {/* Forum topics with hover effects and visual indicators */}
      <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 shadow-lg">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-gray-300 text-sm font-medium">
          <div className="col-span-6">Topic</div>
          <div className="col-span-2 text-center">Category</div>
          <div className="col-span-1 text-center">Replies</div>
          <div className="col-span-1 text-center">Views</div>
          <div className="col-span-2 text-right">Last Post</div>
        </div>
        
        <div className="divide-y divide-gray-700/50">
          {forumData.map(topic => (
            <div key={topic.id} className="p-4 md:px-6 hover:bg-gray-700/20 transition-colors">
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                <div className="flex items-start">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0 shadow-glow-blue">
                    <span className="text-white font-bold">{topic.author.substring(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium flex flex-wrap items-center gap-2">
                      <span className="hover:text-blue-400 transition-colors">{topic.title}</span>
                      {topic.pinned && (
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-xs px-2 py-0.5 rounded-full text-white shadow-glow-purple">Pinned</span>
                      )}
                      {topic.hot && (
                        <span className="bg-gradient-to-r from-red-600 to-orange-600 text-xs px-2 py-0.5 rounded-full text-white shadow-glow-red">Hot</span>
                      )}
                    </h3>
                    <div className="text-gray-400 text-sm mt-1">
                      By <span className="text-blue-400">{topic.author}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">Category:</span>
                    <span className="bg-gray-900 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-500/20">{topic.category}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">Replies:</span>
                    <span className="text-white bg-gray-900 px-2 py-1 rounded-full text-xs">{topic.replies}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">Views:</span>
                    <span className="text-gray-400">{topic.views}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400 text-sm">{topic.lastPost}</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Grid View */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-4">
                <div className="col-span-6">
                  <div className="flex items-start">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0 shadow-glow-blue">
                      <span className="text-white font-bold">{topic.author.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium hover:text-blue-400 transition-colors flex items-center">
                        {topic.title}
                        {topic.pinned && (
                          <span className="ml-2 bg-gradient-to-r from-purple-600 to-pink-600 text-xs px-2 py-0.5 rounded-full text-white shadow-glow-purple">Pinned</span>
                        )}
                        {topic.hot && (
                          <span className="ml-2 bg-gradient-to-r from-red-600 to-orange-600 text-xs px-2 py-0.5 rounded-full text-white shadow-glow-red">Hot</span>
                        )}
                      </h3>
                      <div className="text-gray-400 text-sm mt-1">
                        Started by <span className="text-blue-400">{topic.author}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center justify-center">
                  <span className="bg-gray-900 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-500/20">{topic.category}</span>
                </div>
                
                <div className="col-span-1 flex justify-center items-center">
                  <span className="text-white bg-gray-900 px-2 py-1 rounded-full text-xs">{topic.replies}</span>
                </div>
                
                <div className="col-span-1 flex justify-center items-center">
                  <span className="text-gray-400">{topic.views}</span>
                </div>
                
                <div className="col-span-2 flex justify-end items-center">
                  <span className="text-gray-400 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {topic.lastPost}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination with hover effects */}
      <div className="mt-6 flex justify-center">
        <nav className="inline-flex rounded-md shadow-sm">
          <button className="relative inline-flex items-center px-3 py-2 rounded-l-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">1</button>
          <button className="relative inline-flex items-center px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">2</button>
          <button className="relative inline-flex items-center px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">3</button>
          <button className="relative inline-flex items-center px-3 py-2 rounded-r-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Connect wallet prompt for guests with animated background */}
      {!connected && (
        <div className="mt-10 relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 z-0"></div>
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="particles-container">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    width: `${Math.random() * 10 + 2}px`,
                    height: `${Math.random() * 10 + 2}px`,
                    opacity: Math.random() * 0.5 + 0.25,
                    backgroundColor: i % 2 === 0 ? "#93c5fd" : "#818cf8",
                  }}
                ></div>
              ))}
            </div>
          </div>
          <div className="relative z-10 p-8 border border-blue-500/20 rounded-xl">
            <div className="md:flex items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Connect your wallet to participate
                </h3>
                <p className="text-gray-300">Join the conversation by connecting your Solana wallet.</p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200 animate-pulse-slow"></div>
                <button className="relative px-5 py-2.5 bg-gray-900 text-white rounded-lg flex items-center font-medium z-10">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="community-page">
      {/* Hero section with animated background */}
      <div className="relative mb-16 overflow-hidden rounded-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 z-10"></div>
          <div className="absolute inset-0 -z-10">
            <Image 
              src="/stars.jpg" 
              alt="Stars background" 
              layout="fill" 
              objectFit="cover" 
              quality={90}
              className="opacity-60"
            />
          </div>
          
          {/* Animated stars */}
          <div className="stars-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Hero content */}
        <div className="relative z-20 py-12 px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4 animate-fade-down">
            TESOLA Community Hub
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8 animate-fade-up">
            Connect, share, and grow with fellow TESOLA enthusiasts. Stay updated on the latest news, share memes, and join discussions.
          </p>

          {/* Mobile-optimized scrollable tab navigation */}
          <div className="animate-fade-up flex justify-center" style={{ animationDelay: "300ms" }}>
            <div className="relative group w-full max-w-md md:max-w-2xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
              <div className="relative bg-gray-900 rounded-xl p-1">
                {/* Import the ScrollableTabs component for better mobile experience */}
                <ScrollableTabs
                  tabs={[
                    {
                      id: "news",
                      label: "News & Events",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                          <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                        </svg>
                      )
                    },
                    {
                      id: "garage",
                      label: "Garage",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      )
                    },
                    {
                      id: "forum",
                      label: "Community",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                      )
                    }
                  ]}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  colorFrom="purple-600"
                  colorTo="pink-600"
                  minTouchTarget={44}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 mb-16 max-w-6xl">
        {activeTab === "news" && renderNewsContent()}
        {activeTab === "garage" && renderGarageContent()}
        {activeTab === "forum" && renderForumContent()}
      </div>
    </div>
  );
}