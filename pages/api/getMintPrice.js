// pages/api/getMintPrice.js
export default async function handler(req, res) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    try {
      const price = process.env.NFT_PRICE_LAMPORTS
        ? `${parseFloat(process.env.NFT_PRICE_LAMPORTS) / 1e9} SOL`
        : "1.5 SOL";
      return res.status(200).json({ price });
    } catch (error) {
      console.error("[getMintPrice] Error:", error);
      return res.status(500).json({ error: "서버 내부 오류" });
    }
  }