import React, { useState } from 'react';

const FAQ = () => {
  // State to track which FAQ items are open
  const [openItems, setOpenItems] = useState({});
  
  // Toggle FAQ item open/closed
  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // FAQ data - updated based on the tesola markdown files
  const faqItems = [
    {
      id: 1,
      question: "What is TESOLA token?",
      answer: "TESOLA is a utility token built on the Solana blockchain that powers a 3-phase ecosystem of rewards - from HOLD-TO-EARN to GAME DRIVE-TO-EARN and ultimately REAL DRIVE-TO-EARN. With a total supply of 1 billion tokens, TESOLA aims to connect the Solana community with real-world electric vehicle ownership benefits."
    },
    {
      id: 2,
      question: "What is the 3-Phase Strategy?",
      answer: "TESOLA implements a 3-phase strategy: First, HOLD-TO-EARN rewards SOLARA NFT holders with daily TESOLA token rewards. Second, GAME DRIVE-TO-EARN introduces a play-to-earn racing game with additional token rewards. Finally, REAL DRIVE-TO-EARN will connect with real Tesla ownership, rewarding eco-friendly driving behaviors with tokens."
    },
    {
      id: 3,
      question: "How is the TESOLA token allocated?",
      answer: "The 1 billion TESOLA tokens are allocated as follows: 40% for the DRIVE[HOLD]-TO-EARN ecosystem rewards, 20% for Liquidity & Exchanges, 15% for the Team & Advisors, 15% for Development & Marketing, and 10% for Presale participants."
    },
    {
      id: 4,
      question: "How can I participate in the presale?",
      answer: "To participate in the TESOLA presale, you need a Solana wallet (like Phantom, Solflare, or Backpack) with SOL for the purchase. Connect your wallet on our presale page, select the amount of tokens you wish to purchase, and complete the transaction. The minimum purchase amount is 1,000 TESOLA tokens."
    },
    {
      id: 5,
      question: "What is the presale token price?",
      answer: "During the presale, TESOLA tokens are available at 0.000006 SOL per token. This represents a significant discount compared to the planned listing price of 0.000008 SOL after the public launch on DEXs."
    },
    {
      id: 6,
      question: "Is there a whitelist for the presale?",
      answer: "Yes, the initial phase of our presale is available exclusively to SOLARA NFT holders with additional benefits based on NFT rarity level. After the NFT holder phase completes, remaining tokens will be available to the public."
    },
    {
      id: 7,
      question: "What are the NFT holder presale benefits?",
      answer: "SOLARA NFT holders receive special purchase limits based on NFT rarity: Legendary NFT holders can purchase up to 10 SOL worth, Epic up to 5 SOL, Rare up to 3 SOL, and Common up to 1 SOL. Additionally, NFT holders receive a better exchange rate of 300,000 TESOLA per SOL compared to 200,000 TESOLA per SOL for public participants."
    },
    {
      id: 8,
      question: "When will I receive my tokens?",
      answer: "TESOLA tokens purchased during the presale will be distributed at the Token Generation Event (TGE), which occurs shortly after the presale concludes. 25% of your purchased tokens will be unlocked immediately, with the remaining 75% vesting over 3 months (25% each month)."
    },
    {
      id: 9,
      question: "How does the HOLD-TO-EARN system work?",
      answer: "The HOLD-TO-EARN system rewards SOLARA NFT holders with daily TESOLA token distributions. Rewards vary by NFT rarity tier (Legendary: 4x, Epic: 2x, Rare: 1.5x, Common: 1x) and increase with staking duration (30 days: +10%, 90 days: +25%, 180 days: +40%, 365 days: +100%)."
    },
    {
      id: 10,
      question: "When will the GAME DRIVE-TO-EARN launch?",
      answer: "The GAME DRIVE-TO-EARN racing game is scheduled for beta release in Q4 2025 (3-4 months after token launch), with a full release in early 2026. SOLARA NFT holders will receive free NFT car airdrops for the game based on their NFT rarity level."
    },
    {
      id: 11,
      question: "Which exchanges will list TESOLA after the presale?",
      answer: "Initial liquidity will be provided on Jupiter and Raydium on Solana with 70% of the presale funds. We're also in discussions with several CEXs for secondary listings following our DEX launch. All confirmed listings will be announced through our official channels."
    },
    {
      id: 12,
      question: "How is TESOLA ensuring long-term value?",
      answer: "TESOLA implements several value protection mechanisms: token burns from game revenue, buyback programs using ecosystem profits, long-term vesting schedules for team tokens (36 months), and lockups for ecosystem rewards. Additionally, staking incentives help reduce circulating supply while providing sustainable rewards."
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/30 rounded-xl p-8 border border-purple-500/40 shadow-[0_0_30px_rgba(139,92,246,0.35)] relative overflow-hidden backdrop-blur-sm">
      {/* Animated background elements */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
      
      <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-8 animate-shimmer">
        Frequently Asked Questions
      </h2>
      
      <div className="grid gap-4 mb-8">
        {faqItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/40 transition-all duration-500 shadow-lg hover:shadow-[0_5px_20px_rgba(139,92,246,0.25)] mb-2 group"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-7 py-5 text-left bg-gradient-to-r from-gray-800/90 to-gray-700/90 hover:from-purple-900/40 hover:to-indigo-900/40 transition-all flex justify-between items-center"
              aria-expanded={openItems[item.id]}
              aria-controls={`faq-answer-${item.id}`}
            >
              <span className="font-semibold text-white text-lg group-hover:text-purple-200 transition-colors">{item.question}</span>
              <div className={`flex-shrink-0 ml-4 w-8 h-8 rounded-lg border border-purple-500/50 flex items-center justify-center transition-all duration-300 ${openItems[item.id] ? 'bg-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-transparent'}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-purple-300 transition-transform duration-300 ${openItems[item.id] ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <div 
              id={`faq-answer-${item.id}`}
              className={`transition-all duration-500 ease-in-out overflow-hidden ${openItems[item.id] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-7 py-5 bg-gradient-to-br from-gray-800/40 to-purple-900/10 border-t border-purple-500/20">
                <p className="text-indigo-100 leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl p-8 border border-purple-500/30 text-center backdrop-blur-sm shadow-[0_10px_30px_rgba(139,92,246,0.2)] mt-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/stars.jpg')] opacity-10 mix-blend-lighten"></div>
        
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 mb-4 relative z-10">Still have questions?</h3>
        <p className="text-indigo-100 mb-6 max-w-2xl mx-auto relative z-10">
          Our team is ready to assist with any additional questions about the TESOLA token ecosystem or presale process.
        </p>
        <div className="flex flex-wrap justify-center gap-5 relative z-10">
          <a 
            href="https://discord.gg/tesola" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
            </svg>
            Join our Discord
          </a>
          <a 
            href="mailto:support@tesola.xyz" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[0_0_15px_rgba(192,38,211,0.5)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Support
          </a>
          <a 
            href="https://twitter.com/tesola_xyz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[0_0_15px_rgba(14,165,233,0.5)]"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
            </svg>
            Follow on Twitter
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;