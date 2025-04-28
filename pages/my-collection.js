// pages/my-collection.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';

// 지갑 버튼 동적 로딩
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function MyCollection() {
  const { publicKey, connected } = useWallet();
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!connected || !publicKey) return;
      
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching NFTs for wallet:', publicKey.toString());
        
        // 긴 타임아웃 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
        
        // 서버에서 사용자 NFT 가져오기
        const res = await fetch(`/api/getNFTs?wallet=${publicKey.toString()}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('API Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error response:', errorText);
          throw new Error(`Failed to fetch NFTs: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('API Data received:', data);
        
        setOwnedNFTs(data.nfts || []);
        console.log('NFTs count:', data.nfts ? data.nfts.length : 0);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnedNFTs();
  }, [publicKey, connected]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">My SOLARA Collection</h1>
        
        {!connected && (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Connect your wallet to see your SOLARA NFTs</p>
            <div className="mt-4 flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="ml-4">Loading your NFTs...</p>
          </div>
        )}
        
        {connected && !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedNFTs.length === 0 ? (
              <p className="text-xl col-span-full text-center py-12">You don't own any SOLARA NFTs yet</p>
            ) : (
              ownedNFTs.map((nft) => (
                <div key={nft.mint} className="border border-purple-500 rounded-lg overflow-hidden">
          {nft.image ? (
  <img 
    src={nft.image} 
    alt={nft.name} 
    className="w-full h-auto" 
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = '/placeholder-nft.png'; // 대체 이미지
      console.log('Image load error for:', nft.name);
    }} 
  />
) : (
  <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
    <p className="text-gray-400">이미지 없음</p>
  </div>
)}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}