// MintResultModal.jsx updated version
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function MintResultModal({ result, onClose }) {
  const { publicKey } = useWallet();
  const [rewardProcessing, setRewardProcessing] = useState(false);
  const [rewardReceived, setRewardReceived] = useState(false);

  if (!result) return null;
  
  const { metadata, filename } = result;
  
  // Extract tier information
  let tier = "No information";
  if (metadata.attributes && Array.isArray(metadata.attributes)) {
    const tierAttr = metadata.attributes.find(attr => attr.trait_type === "Tier");
    if (tierAttr && tierAttr.value) {
      tier = tierAttr.value;
    }
  }
  
  // Process image URL
  let imageUrl = metadata.image || "";
  if (imageUrl.startsWith('ipfs://')) {
    imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Create tweet URL
  const tweetText = encodeURIComponent(
    `I just minted SOLARA #${filename} – ${tier} tier from the GEN:0 collection! 🚀 #SOLARA #NFT #Solana`
  );
  const tweetUrl = encodeURIComponent(`https://tesola.xyz/solara/${filename}`);
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
  
  // Tweet share and reward handler
  const handleTweetShare = async () => {
    // User guidance
    alert('After tweeting, click "Confirm" to receive 5 TESOLA tokens as reward!');
    
    // Open tweet window
    window.open(twitterShareUrl, '_blank');
    
    setRewardProcessing(true);
    
    // User confirmation and reward processing
    const confirmed = window.confirm('Did you complete sharing the tweet?');
    if (confirmed && publicKey) {
      try {
        // Call reward API
        const response = await fetch('/api/recordTweetReward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: publicKey.toString(),
            reference_id: `mint_${filename}`,
            reward_type: 'mint_tweet'
          })
        });
        
        if (!response.ok) {
          throw new Error('Error processing tweet reward');
        }
        
        setRewardReceived(true);
        alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
      } catch (error) {
        console.error('Tweet reward error:', error);
        alert(`Error: ${error.message}`);
      }
    }
    
    setRewardProcessing(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Congratulations! SOLARA #{filename} Minted!
          </h2>
          <p className="text-purple-300 text-lg font-semibold">{metadata.name || `SOLARA #${filename}`}</p>
          <p className="text-gray-400">Tier: {tier}</p>
        </div>
        
        <div className="relative">
          {imageUrl && (
            <div className="relative mb-4">
              <img
                src={imageUrl}
                alt={metadata.name || "Solara NFT"}
                className="w-full rounded-lg border-2 border-purple-500 shadow-lg"
              />
              {!rewardReceived && (
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full transform rotate-12 shadow-lg animate-pulse">
                  Share for +5 TESOLA!
                </div>
              )}
            </div>
          )}
          
          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm mb-4">{metadata.description || "A unique SOLARA NFT from the GEN:0 collection."}</p>
            
            {/* Reward info card */}
            <div className="bg-purple-900/40 p-4 rounded-lg mb-4 border border-purple-500/50">
              <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Earn TESOLA Rewards
              </h3>
              <p className="text-white text-sm">
                Share your new SOLARA NFT on Twitter and earn <span className="text-yellow-400 font-bold">5 TESOLA tokens</span> instantly!
              </p>
              {rewardReceived && (
                <div className="mt-2 bg-green-900/50 p-2 rounded border border-green-500 text-green-400 text-sm">
                  ✓ You've earned 5 TESOLA tokens for sharing!
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4 justify-center">
          <button
            onClick={onClose}
            className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700 transition"
          >
            Close
          </button>
          
          {/* Tweet share button */}
          <button 
            onClick={handleTweetShare}
            disabled={rewardProcessing || rewardReceived}
            className={`bg-yellow-500 text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition flex items-center ${rewardReceived ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {rewardProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span> Processing...
              </>
            ) : rewardReceived ? (
              <>✓ Shared</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                Share & Earn 5 TESOLA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}