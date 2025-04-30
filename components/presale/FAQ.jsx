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
  
  // FAQ data
  const faqItems = [
    {
      id: 1,
      question: "What is TESOLA token?",
      answer: "TESOLA is a utility token built on the Solana blockchain designed to power a wide range of DeFi applications, governance systems, and ecosystem rewards. With a total supply of 1 billion tokens, TESOLA aims to become a cornerstone of the Solana ecosystem."
    },
    {
      id: 2,
      question: "How can I participate in the presale?",
      answer: "To participate in the TESOLA presale, you need a Solana wallet (like Phantom, Solflare, or Backpack) with SOL for the purchase. Simply connect your wallet on our presale page, select the amount of tokens you wish to purchase, and complete the transaction. The minimum purchase amount is 1,000 TESOLA tokens."
    },
    {
      id: 3,
      question: "What is the presale token price?",
      answer: "During the presale, TESOLA tokens are available at a special discounted price of 0.000005 SOL per token. This represents a significant discount compared to the planned listing price after the public launch."
    },
    {
      id: 4,
      question: "Is there a whitelist for the presale?",
      answer: "Yes, the initial phase of our presale is available exclusively to whitelisted addresses. To get whitelisted, you can participate in our community activities on Twitter and Discord. After the whitelist phase ends, the presale will open to the public if tokens remain available."
    },
    {
      id: 5,
      question: "When will I receive my tokens?",
      answer: "TESOLA tokens purchased during the presale will be distributed to your wallet at the Token Generation Event (TGE), which will occur shortly after the presale concludes. You'll receive an email notification when your tokens are ready to be claimed."
    },
    {
      id: 6,
      question: "Is there a vesting period for presale tokens?",
      answer: "Yes, presale tokens have a vesting schedule designed to support long-term price stability. 25% of your purchased tokens will be unlocked at the TGE, with the remaining 75% unlocked over the following 3 months (25% each month)."
    },
    {
      id: 7,
      question: "What can I do with TESOLA tokens?",
      answer: "TESOLA tokens serve multiple purposes within our ecosystem: governance rights for protocol decisions, staking rewards, reduced fees on the platform, access to premium features, and participation in exclusive events. As the ecosystem grows, more utility will be added based on community feedback."
    },
    {
      id: 8,
      question: "Which exchanges will list TESOLA after the presale?",
      answer: "We're currently in discussions with several major DEXs and CEXs for listing. Initial liquidity will be provided on Jupiter and Raydium on Solana, with more exchange listings to follow. We'll announce all confirmed listings through our official channels."
    },
    {
      id: 9,
      question: "Has the smart contract been audited?",
      answer: "Yes, the TESOLA token contract has been audited by CertiK, one of the leading blockchain security firms. The audit report is available on our website under the 'Documents' section."
    },
    {
      id: 10,
      question: "What happens to unsold tokens?",
      answer: "Any tokens unsold during the presale will be added to the ecosystem development fund and locked for a minimum of 12 months. They will be gradually used for development, marketing, and community incentives as governed by TESOLA token holders."
    },
    {
      id: 11,
      question: "How do I report issues during the presale?",
      answer: "If you encounter any issues during the presale, please reach out to our support team via Discord or email at support@tesola.xyz. Our team is available 24/7 during the presale period to assist with any questions or technical difficulties."
    },
    {
      id: 12,
      question: "Where can I learn more about the project?",
      answer: "You can find comprehensive information about TESOLA in our whitepaper, which details our tokenomics, roadmap, and vision. Additionally, our Medium blog features regular updates and deep dives into different aspects of our project. Follow us on Twitter and join our Discord for the latest announcements."
    }
  ];

  return (
    <div className="bg-gray-800/40 rounded-xl p-6 border border-purple-500/20 shadow-xl">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        Frequently Asked Questions
      </h2>
      
      <div className="grid gap-4 mb-6">
        {faqItems.map((item) => (
          <div key={item.id} className="border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-4 text-left bg-gray-700 hover:bg-gray-600 transition-colors flex justify-between items-center"
            >
              <span className="font-medium text-white">{item.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-300 transition-transform ${openItems[item.id] ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openItems[item.id] && (
              <div className="px-6 py-4 bg-gray-800 animate-fade-in">
                <p className="text-gray-300">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-5 bg-gray-700 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Still have questions?</h3>
        <p className="text-gray-300 mb-4">
          Our team is ready to help you with any additional questions you may have about the TESOLA token presale.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a 
            href="https://discord.gg/tesola" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
            </svg>
            Join our Discord
          </a>
          <a 
            href="mailto:support@tesola.xyz" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;