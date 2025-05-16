// pages/api/prepareUnstaking.js
// Proxy endpoint to forward requests to the staking/prepareUnstaking handler

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Simply forward the request to our staking endpoint
    const { wallet, mintAddress, stakingId } = req.body;
    
    if (!wallet || !mintAddress || !stakingId) {
      return res.status(400).json({ 
        error: "Wallet address, mint address, and staking ID are required",
        success: false 
      });
    }
    
    // Log the proxy operation
    console.log(`[PROXY] Forwarding prepareUnstaking request to staking endpoint for NFT ${mintAddress.slice(0, 8)}...`);
    
    // Manually forward the request to the staking endpoint
    // This approach does not require an actual HTTP request and is more efficient
    // Use dynamic import to import the unified version
    const stakingHandler = await import("./staking/prepareUnstaking.js");
    
    // Call the staking handler directly with the same request and response objects
    return await stakingHandler.default(req, res);
  } catch (error) {
    console.error("Error in prepareUnstaking proxy:", error);
    return res.status(500).json({ 
      error: "Failed to prepare unstaking transaction: " + (error.message || "Unknown error"),
      success: false
    });
  }
}