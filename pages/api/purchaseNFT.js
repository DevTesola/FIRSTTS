// pages/api/purchaseNFT.js - Fixed Secured version
import { PublicKey } from '@solana/web3.js';
import { purchaseNFT } from '../../utils/purchaseNFT';
import { validateSolanaAddress } from '../../middleware/apiSecurity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.body;
    if (!wallet || typeof wallet !== 'string') {
      throw new Error('Invalid wallet address');
    }

    // Validate address using utility function if available
    if (typeof validateSolanaAddress === 'function') {
      const validation = validateSolanaAddress(wallet);
      if (validation.error) {
        throw new Error(validation.error);
      }
    }

    const publicKey = new PublicKey(wallet);
    // Further validation for extra security
    if (!PublicKey.isOnCurve(publicKey.toBuffer())) {
      throw new Error('Invalid wallet address: Not on curve');
    }

    const result = await purchaseNFT(publicKey);
    
    // Ensure all required fields are present in the response
    if (!result || !result.transaction || !result.mintIndex || !result.lockId) {
      throw new Error('Invalid response from purchase service');
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Purchase NFT API error:', err);
    res.status(500).json({ error: err.message });
  }
}