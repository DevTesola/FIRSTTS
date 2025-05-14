// pages/api/prepareUnstaking.js
// Proxy endpoint to forward requests to the enhanced V3 version

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Simply forward the request to our new V3 endpoint
    const { wallet, mintAddress, stakingId } = req.body;
    
    if (!wallet || !mintAddress || !stakingId) {
      return res.status(400).json({ 
        error: "Wallet address, mint address, and staking ID are required",
        success: false 
      });
    }
    
    // Log the proxy operation
    console.log(`[PROXY] Forwarding prepareUnstaking request to V3 endpoint for NFT ${mintAddress.slice(0, 8)}...`);
    
    // Manually forward the request to the V3 endpoint
    // This approach does not require an actual HTTP request and is more efficient
    // Use dynamic import instead of require to ensure module is found
    const { default: v3Handler } = await import("./prepareUnstaking_v3");
    
    // Call the V3 handler directly with the same request and response objects
    return await v3Handler(req, res);
  } catch (error) {
    console.error("Error in prepareUnstaking proxy:", error);
    return res.status(500).json({ 
      error: "Failed to prepare unstaking transaction: " + (error.message || "Unknown error"),
      success: false
    });
  }
}