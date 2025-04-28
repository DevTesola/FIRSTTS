import { PublicKey } from '@solana/web3.js';
import { purchaseNFT } from '../../utils/purchaseNFT';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { wallet } = req.body;
    if (!wallet || typeof wallet !== 'string') {
      throw new Error('Invalid wallet address');
    }

    const publicKey = new PublicKey(wallet);
    if (!PublicKey.isOnCurve(publicKey.toBuffer())) {
      throw new Error('Invalid wallet address: Not on curve');
    }

    const result = await purchaseNFT(publicKey);
    res.status(200).json(result);
  } catch (err) {
    console.error('Purchase NFT error:', err);
    res.status(500).json({ error: err.message });
  }
}