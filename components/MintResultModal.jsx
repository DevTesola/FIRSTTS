import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getDirectGatewayUrl, isIPFSUrl } from '../utils/mediaUtils';

export default function MintResultModal({ result, onClose }) {
  const { publicKey } = useWallet();
  const [rewardProcessing, setRewardProcessing] = useState(false);
  const [rewardReceived, setRewardReceived] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Check if reward already received on component mount
    const checkExistingReward = async () => {
      if (!result || !publicKey) return;
      
      try {
        const checkRes = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
        if (checkRes.ok) {
          const { rewardHistory } = await checkRes.json();
          
          // Only check for mint_tweet rewards
          const alreadyRewarded = rewardHistory.some(reward => 
            reward.reference_id === `mint_${result.filename}` && 
            reward.reward_type === 'mint_tweet'
          );
          
          if (alreadyRewarded) {
            setRewardReceived(true);
          }
        }
      } catch (error) {
        // Error handling - silently continue
        console.error("Error checking existing rewards:", error);
      }
    };
    
    checkExistingReward();
  }, [result, publicKey]);

  if (!result) return null;
  
  const { metadata, filename } = result;
  const formattedId = String(filename).padStart(4, '0');
  // Extract tier information
  let tier = "No information";
  if (metadata.attributes && Array.isArray(metadata.attributes)) {
    const tierAttr = metadata.attributes.find(attr => attr.trait_type === "Tier");
    if (tierAttr && tierAttr.value) {
      tier = tierAttr.value;
    }
  }
  
  // Simple direct gateway URL approach
  const originalImageUrl = metadata.image || "";
  
  // Use more direct approach for handling IPFS URLs
  let imageUrl = originalImageUrl;
  
  // If it's an IPFS URL, convert to HTTP gateway using simple conversion
  if (originalImageUrl.startsWith('ipfs://')) {
    const ipfsPath = originalImageUrl.replace('ipfs://', '');
    imageUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsPath}`;
  } else if (originalImageUrl.includes('/ipfs/')) {
    // Already a gateway URL, ensure it uses our preferred gateway
    const ipfsPath = originalImageUrl.split('/ipfs/')[1];
    imageUrl = `https://tesola.mypinata.cloud/ipfs/${ipfsPath}`;
  }
  
  // Add cache busting to ensure fresh content
  imageUrl = imageUrl.includes('?') ? 
    `${imageUrl}&_cb=${Date.now()}` : 
    `${imageUrl}?_cb=${Date.now()}`;
  
  // Ensure the URL is valid by logging
  console.log("Original NFT Image URL:", originalImageUrl);
  console.log("Direct Gateway URL:", imageUrl);
  
  // Extract mint address from metadata if available
  const mintAddress = metadata.mintAddress || metadata.mint || "";
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  
  // Create meaningful links
  // Solscan link for the transaction
  const solscanUrl = `https://solscan.io/token/${mintAddress}?cluster=${network}`;
  
  // Magic Eden link if we have a mint address
  const magicEdenUrl = `https://magiceden.io/item-details/${mintAddress}?cluster=${network}`;
  
  // Tesola website URL
  const tesolaUrl = `https://tesola.xyz/solara/${filename}`;
  
  // Create tweet text with proper links to Solscan, Magic Eden and tesola.xyz
  const tweetText = encodeURIComponent(
    `I just minted SOLARA #${formattedId} – ${tier} tier from the GEN:0 collection! 🚀\n\n` +
    `View on Solscan: ${solscanUrl}\n` +
    `View on Magic Eden: ${magicEdenUrl}\n` +
    `Visit: ${tesolaUrl}\n\n` +
    `#SOLARA #NFT #Solana`
  );
  
  // No URL needed since links are in the text
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
  
  // Tweet share and reward handler
  const handleTweetShare = async () => {
    // Check if already rewarded
    try {
      const checkRes = await fetch(`/api/getRewards?wallet=${publicKey.toString()}`);
      if (checkRes.ok) {
        const { rewardHistory } = await checkRes.json();
        
        // Only check for mint_tweet rewards
        const alreadyRewarded = rewardHistory.some(reward => 
          reward.reference_id === `mint_${filename}` && 
          reward.reward_type === 'mint_tweet'
        );
        
        if (alreadyRewarded) {
          alert("You've already received rewards for sharing this NFT!");
          setRewardReceived(true);
          return;
        }
      }
    } catch (error) {
      // Error handling - continue anyway
      console.error("Error checking rewards:", error);
    }
    
    // User guidance
    alert('After tweeting, click "Confirm" to receive 5 TESOLA tokens as reward!');
    
    // Open tweet window
    window.open(twitterShareUrl, '_blank');
    
    setRewardProcessing(true);
    
    // User confirmation and reward processing
    const confirmed = window.confirm('Did you complete sharing the tweet?');
    if (confirmed && publicKey) {
      try {
        // Call reward API with enhanced logging
        console.log('Sending tweet reward request:', {
          wallet: publicKey.toString(),
          reference_id: `mint_${filename}`,
          reward_type: 'mint_tweet',
          nft_id: filename,
          mint_address: mintAddress || null
        });
        
        // API call
        const response = await fetch('/api/recordTweetReward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wallet: publicKey.toString(),
            reference_id: `mint_${filename}`,
            reward_type: 'mint_tweet',
            nft_id: filename,
            mint_address: mintAddress || null
          })
        });
        
        // Check response
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error processing tweet reward');
        }
        
        const responseData = await response.json();
        console.log('Tweet reward response:', responseData);
        
        setRewardReceived(true);
        alert('Congratulations! 5 TESOLA tokens have been added to your rewards.');
      } catch (error) {
        console.error('Tweet reward error:', error);
        alert(`Error: ${error.message}`);
      }
    }
    
    setRewardProcessing(false);
  };

  // Handle image loading/error
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.warn("Image loading failed:", imageUrl);
    setImageError(true);
    
    // Try alternate approach if first load fails
    if (!originalImageUrl.includes("tesola.mypinata.cloud")) {
      // Get NFT ID from filename
      const nftId = formattedId;
      
      // Create direct URL to collection
      const COLLECTION_IPFS_HASH = 'QmZxNmoVrJR1qyCLY1fUXPRNfdMNeu7vKLMdgY7LXXHbZ3';
      const fallbackUrl = `https://tesola.mypinata.cloud/ipfs/${COLLECTION_IPFS_HASH}/${nftId}.png?_fb=1`;
      
      console.log("Trying fallback URL:", fallbackUrl);
      
      // Create a new image element to test the fallback
      const testImg = new Image();
      testImg.onload = () => {
        // If fallback loads successfully, update the image URL
        console.log("Fallback image loaded successfully");
        const imgElement = document.querySelector('.modal-nft-image');
        if (imgElement) {
          imgElement.src = fallbackUrl;
          setImageLoaded(true);
          setImageError(false);
        }
      };
      testImg.src = fallbackUrl;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Congratulations! SOLARA #{formattedId} Minted!
          </h2>
          <p className="text-purple-300 text-lg font-semibold">{metadata.name || `SOLARA #${filename}`}</p>
          <p className="text-gray-400">Tier: {tier}</p>
        </div>
        
        <div className="relative">
          {imageUrl && (
            <div className="relative mb-4">
              {/* Loading indicator */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              )}
              
              {/* Image */}
              <div className="w-full rounded-lg border-2 border-purple-500 shadow-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={metadata.name || "Solara NFT"}
                  className={`modal-nft-image w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="eager" 
                  crossOrigin="anonymous"
                />
              </div>
              
              {/* Reward badge */}
              {!rewardReceived && (
                <div className="absolute -top-5 -right-5 bg-yellow-500 text-black font-bold px-3 py-1 rounded-full transform rotate-12 shadow-lg animate-pulse z-10">
                  Share for +5 TESOLA!
                </div>
              )}
            </div>
          )}
          
          {/* Error fallback */}
          {imageError && (
            <div className="mb-4 bg-gray-800 rounded-lg border-2 border-purple-500 p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Image unavailable</p>
                <p className="text-sm">Your NFT was minted successfully</p>
              </div>
            </div>
          )}
          
          {/* Links to Solscan, Magic Eden and TESOLA.xyz */}
          <div className="flex flex-col gap-2 mb-4">
            {mintAddress && (
              <>
                <a 
                  href={solscanUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View on Solscan
                </a>
                <a 
                  href={magicEdenUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View on Magic Eden
                </a>
                <a 
                  href={tesolaUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12L20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 4H20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View on TESOLA.xyz
                </a>
              </>
            )}
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm mb-4">{metadata.description || "A unique SOLARA NFT from the GEN:0 collection."}</p>
            
            {/* Reward information card - Added reward policy details */}
            <div className="bg-purple-900/40 p-4 rounded-lg mb-4 border border-purple-500/50">
              <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Earn TESOLA Rewards
              </h3>
              <p className="text-white text-sm mb-2">
                Share your new SOLARA NFT and earn <span className="text-yellow-400 font-bold">TESOLA tokens</span>:
              </p>
              <ul className="text-xs text-white space-y-1 ml-5 list-disc">
                <li>Share on Twitter now: <span className="text-yellow-400 font-bold">+5 TESOLA</span></li>
                <li>Share again from My Collection: <span className="text-yellow-400 font-bold">+5 TESOLA</span></li>
                <li>Share from Transactions page: <span className="text-yellow-400 font-bold">+5 TESOLA</span></li>
                <li>Share on Telegram: <span className="text-yellow-400 font-bold">+5 TESOLA</span></li>
              </ul>
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