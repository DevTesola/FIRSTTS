import React, { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { BlogHeroMediaHybrid } from '../../components/BlogMediaHybrid';

export default function CommunityAMASummary() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <Head>
        <title>Community AMA Summary - Key Insights from the Founding Team | TESOLA</title>
        <meta name="description" content="Read the highlights from our recent Ask Me Anything session with the founding team. Get insights on TESOLA's future plans, tokenomics, and more." />
        <meta property="og:title" content="Community AMA Summary - TESOLA" />
        <meta property="og:description" content="Key insights from our recent AMA session with the founding team" />
        <meta property="og:image" content="/ss/s5.png" />
      </Head>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <article className="prose prose-invert max-w-none">
          {/* Article Header */}
          <div className="bg-gradient-to-br from-gray-900/50 to-purple-900/20 rounded-xl p-6 mb-8 border border-purple-500/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Community AMA Summary
                </h1>
                <p className="text-gray-400 text-sm">
                  April 15, 2025 • Community Manager
                </p>
              </div>
              <Link href="/community?tab=news" className="mt-4 sm:mt-0 text-purple-400 hover:text-purple-300 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to News
              </Link>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H5.414l-2.707 2.707A1 1 0 012 11V5z" />
                  <path d="M9 3.828A6 6 0 0016 9v2a2 2 0 002 2V5a4 4 0 00-4-4H9v3.828z" />
                </svg>
                423 participants
              </span>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                157 questions answered
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <BlogHeroMediaHybrid
              src="/ss/s5.png"
              alt="TESOLA Community AMA"
              className="rounded-xl shadow-2xl border border-purple-500/20"
            >
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-20">
                <p className="text-white text-lg font-bold">Highlights from our April 2025 AMA Session</p>
              </div>
            </BlogHeroMediaHybrid>
          </div>

          {/* Article Content */}
          <section className="space-y-8">
            {/* Introduction */}
            <div className="bg-purple-900/10 border-l-4 border-purple-500 p-6 rounded-lg">
              <p className="text-lg text-gray-300 leading-relaxed">
                On April 15th, 2025, the TESOLA founding team hosted an exciting Ask Me Anything (AMA) session 
                with our vibrant community. We received over 200 questions and had the opportunity to share 
                our vision, roadmap, and answer your most burning questions about the project.
              </p>
            </div>

            {/* Key Highlights */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Key Highlights
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">1. Evolution System Launch Timeline</h3>
                  <p className="text-gray-300">
                    The most asked question was about the Evolution System. We're thrilled to confirm that 
                    Phase 1 will launch in <strong className="text-white">Q3 2025</strong> with the top 
                    100 TESOLA holders receiving exclusive early access.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">2. Tokenomics Transparency</h3>
                  <p className="text-gray-300">
                    We addressed concerns about team allocation. Our 15% team tokens are subject to a 
                    <strong className="text-white"> 12-month cliff and 36-month linear vesting</strong>. 
                    This ensures long-term commitment to the project.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-5 rounded-lg border border-purple-500/30">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">3. Staking APY Sustainability</h3>
                  <p className="text-gray-300">
                    Many asked about our APY model. We maintain <strong className="text-white">73-219% APY</strong> 
                    through a sustainable rewards pool, dynamic adjustment mechanisms, and deflationary token burns.
                  </p>
                </div>
              </div>
            </div>

            {/* Q&A Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Top Community Questions
              </h2>

              <div className="space-y-6">
                {/* Q1 */}
                <div className="border-l-2 border-purple-500 pl-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">
                    Q: "When will Evolution NFTs be available to all holders?"
                  </h3>
                  <p className="text-gray-300 mb-3">
                    <strong className="text-white">A:</strong> Evolution will roll out in phases:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    <li>Top 100 holders: Q3 2025 (Early Access)</li>
                    <li>Top 500 holders: Q4 2025</li>
                    <li>All holders: Q1 2026</li>
                  </ul>
                </div>

                {/* Q2 */}
                <div className="border-l-2 border-purple-500 pl-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">
                    Q: "Will there be additional NFT collections?"
                  </h3>
                  <p className="text-gray-300">
                    <strong className="text-white">A:</strong> Yes! We're planning Gen:1 collection for Q4 2025, 
                    featuring racing-themed designs for our upcoming gaming platform. Gen:0 holders will receive 
                    priority access and minting discounts.
                  </p>
                </div>

                {/* Q3 */}
                <div className="border-l-2 border-purple-500 pl-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">
                    Q: "What about the Tesla partnership rumors?"
                  </h3>
                  <p className="text-gray-300">
                    <strong className="text-white">A:</strong> While we can't confirm official partnerships yet, 
                    we're actively exploring integrations with Tesla owner communities. Our Drive-to-Earn feature 
                    is designed with future automotive partnerships in mind.
                  </p>
                </div>

                {/* Q4 */}
                <div className="border-l-2 border-purple-500 pl-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">
                    Q: "What's the roadmap for social features integration?"
                  </h3>
                  <p className="text-gray-300 mb-3">
                    <strong className="text-white">A:</strong> We're building a comprehensive social ecosystem:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    <li>Twitter verification system launches Q2 2025</li>
                    <li>Beta test game with in-game chat and guild features in Q4 2025</li>
                    <li>Content creator rewards program in Q4 2025</li>
                    <li>Metaverse social hub planned for 2026</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Community Engagement Visualization */}
            <div className="my-8">
              <img
                src="/ss/s6.png"
                alt="Community Engagement Statistics"
                className="w-full h-auto rounded-xl shadow-2xl border border-purple-500/20"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">Live community participation during the AMA session</p>
            </div>

            {/* Technical Updates */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                Technical Updates
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Security Audit</h3>
                  <p className="text-gray-300 text-sm">
                    Simple security audit through partner companies has been completed. Full audit by renowned 
                    certification companies is planned.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Drive to Earn (Gaming)</h3>
                  <p className="text-gray-300 text-sm">
                    Currently under development. Beta testing begins in Q4 2025 for selected NFT holders.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Cross-Chain Bridge</h3>
                  <p className="text-gray-300 text-sm">
                    Planning for broader DeFi ecosystem integration across multiple chains.
                  </p>
                </div>

                <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Magic Eden Marketplace</h3>
                  <p className="text-gray-300 text-sm">
                    Magic Eden verification completed! Secondary trading is now available on Magic Eden's marketplace.
                  </p>
                </div>
              </div>
            </div>

            {/* Future Features Preview */}
            <div className="my-8">
              <BlogHeroMediaHybrid
                src="/ss/s9.webp"
                alt="Upcoming Features Preview"
                className="rounded-xl shadow-2xl border border-green-500/20"
              />
              <p className="text-sm text-center text-gray-400 mt-2 italic">The upcoming features discussed will be created by you.</p>
            </div>

            {/* Community Feedback */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Community Appreciation
              </h2>

              <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 p-6 rounded-lg border border-pink-500/30">
                <p className="text-gray-300 mb-4">
                  We were blown away by the enthusiasm and thoughtful questions from our community. 
                  Your feedback directly shapes our development priorities.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Lower gas optimization (in progress)</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">More staking tiers (planned for Q3)</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">Referral program (launching next month)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4.5 1.25-4.5.5 0 .875.75.875.75l1.5 3.75c0 .5.375.5.375.5z" clipRule="evenodd" />
                </svg>
                Next AMA Session
              </h2>

              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-300 mb-4">
                  Our next AMA is scheduled for <strong className="text-white">May 30th, 2025</strong>. 
                  We'll be discussing:
                </p>
                
                <ul className="list-disc pl-6 space-y-2 text-gray-300">
                  <li>Evolution System demo</li>
                  <li>Gaming platform alpha preview</li>
                  <li>Partnership announcements</li>
                  <li>Q3 roadmap details</li>
                </ul>

                <div className="mt-6">
                  <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer" 
                     className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12s5.374 12 12 12 12-5.373 12-12-5.374-12-12-12zm3.224 17.582c.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-7.306c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123.196.14.452.139.648-.002.424-.302.186-.908-.417-.908h-3.799c-.603 0-.843.606-.417.908.197.141.452.14.648-.002.985-.698 1.7-1.835 1.7-3.123 0-2.099-1.694-3.799-3.788-3.799s-3.788 1.699-3.788 3.799c0 1.288.715 2.425 1.7 3.123z"/>
                    </svg>
                    Join Our Telegram for Updates
                  </a>
                </div>
              </div>
            </div>

            {/* Closing */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-500/30">
              <p className="text-lg text-gray-300">
                Thank you to everyone who participated in this AMA! Your questions, feedback, and support 
                drive us to build the best possible ecosystem. Together, we're not just going to the moon 
                – we're building a sustainable crypto future.
              </p>
              <p className="mt-4 text-purple-400 font-bold">
                WAGMI! 🚀
              </p>
            </div>
          </section>

          {/* Social Share */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 sm:mb-0">Share this article</p>
              <div className="flex space-x-4">
                <a href={`https://twitter.com/intent/tweet?text=Check out the TESOLA Community AMA Summary&url=${encodeURIComponent('https://tesola.xyz/blog/community-ama-summary')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                  <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://t.me/tesolachat" target="_blank" rel="noopener noreferrer"
                   className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                  <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.203-.049-.313-.346-.11l-6.4 4.02-2.76-.918c-.6-.187-.612-.6.125-.89l10.782-4.156c.5-.18.94.12.78.88z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </Layout>
  );
}