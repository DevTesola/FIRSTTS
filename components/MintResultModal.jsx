import React, { useState, useEffect } from 'react';
import { FaTwitter, FaTelegramPlane, FaCheck } from 'react-icons/fa';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { findMetadataPda } from '@metaplex-foundation/js';
import { Metaplex } from '@metaplex-foundation/js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { COLLECTION_ID } from '../lib/constants';

const MintResultModal = ({ isOpen, onClose, mintResult, mintName }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isTweetShared, setIsTweetShared] = useState(false);
  const [isTelegramShared, setIsTelegramShared] = useState(false);
  const [nftMintAddress, setNftMintAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && wallet.connected) {
      fetchLatestNFT();
    }
  }, [isOpen, wallet.connected]);

  const fetchLatestNFT = async () => {
    if (!wallet.publicKey) return;
    
    setIsLoading(true);
    try {
      // Metaplex 인스턴스 생성
      const metaplex = new Metaplex(connection);
      
      // 지갑에 있는 모든 NFT 가져오기
      const nfts = await metaplex.nfts().findAllByOwner({
        owner: wallet.publicKey,
      });
      
      // 특정 컬렉션의 NFT만 필터링 (COLLECTION_ID 사용)
      const collectionNfts = nfts.filter(nft => 
        nft.collection?.address.toString() === COLLECTION_ID
      );
      
      if (collectionNfts.length > 0) {
        // 가장 최근에 발행된 NFT 찾기 (여기서는 간단히 배열의 첫 번째 항목을 사용)
        // 실제로는 mintTimestamp 등을 비교해 가장 최근 항목을 찾는 것이 좋습니다
        const latestNft = collectionNfts[0];
        setNftMintAddress(latestNft.address.toString());
      } else {
        console.error('No NFTs found from the specified collection');
        // 컬렉션의 NFT를 찾지 못한 경우 fallback으로 민트 결과에서 주소 추출 시도
        if (mintResult && mintResult.signature) {
          const txDetails = await connection.getTransaction(mintResult.signature);
          if (txDetails && txDetails.meta && txDetails.meta.postTokenBalances) {
            // 민트 트랜잭션에서 새로 생성된 토큰 찾기
            const newToken = txDetails.meta.postTokenBalances.find(
              tokenBalance => !txDetails.meta.preTokenBalances.some(
                preToken => preToken.mint === tokenBalance.mint
              )
            );
            
            if (newToken) {
              setNftMintAddress(newToken.mint);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwitterShare = async () => {
    if (!nftMintAddress) {
      toast.error('NFT 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // 매직에덴 링크 생성 (메인넷)
    const magicEdenLink = `https://www.magiceden.io/item-details/${nftMintAddress}`;
    
    // 트윗 내용 구성
    const tweetText = encodeURIComponent(
      `방금 ${mintName || 'NFT'}를 구매했어요! 🎉\n\n` +
      `확인해보세요: ${magicEdenLink}\n\n` +
      `#Solana #NFT #MagicEden #${mintName?.replace(/\s+/g, '')}`
    );
    
    // 트윗 공유 URL 생성
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    
    // 새 창에서 트위터 공유 열기
    window.open(twitterShareUrl, '_blank');
    
    try {
      // 트위터 공유 보상 기록
      await axios.post('/api/recordTweetReward', {
        walletAddress: wallet.publicKey.toString(),
        mintAddress: nftMintAddress
      });
      
      setIsTweetShared(true);
      toast.success('트위터 공유 보상이 지급되었습니다!');
    } catch (error) {
      console.error('Error recording tweet reward:', error);
      toast.error('보상 지급 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleTelegramShare = async () => {
    if (!nftMintAddress) {
      toast.error('NFT 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // 솔스캔 링크 생성 (메인넷)
    const solscanLink = `https://solscan.io/token/${nftMintAddress}`;
    
    // 텔레그램 메시지 구성
    const telegramText = encodeURIComponent(
      `방금 ${mintName || 'NFT'}를 구매했어요! 🎉\n\n` +
      `솔스캔에서 확인: ${solscanLink}`
    );
    
    // 텔레그램 공유 URL 생성
    const telegramShareUrl = `https://t.me/share/url?url=${solscanLink}&text=${telegramText}`;
    
    // 새 창에서 텔레그램 공유 열기
    window.open(telegramShareUrl, '_blank');
    
    try {
      // 텔레그램 공유 보상 기록
      await axios.post('/api/recordTelegramReward', {
        walletAddress: wallet.publicKey.toString(),
        mintAddress: nftMintAddress
      });
      
      setIsTelegramShared(true);
      toast.success('텔레그램 공유 보상이 지급되었습니다!');
    } catch (error) {
      console.error('Error recording telegram reward:', error);
      toast.error('보상 지급 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-gray-900 p-6 rounded-xl w-11/12 max-w-md border border-indigo-500 shadow-lg transform transition-all">
        <h2 className="text-2xl font-bold text-white mb-4">축하합니다! 🎉</h2>
        
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-white mb-2">
            <span className="font-medium">{mintName || 'NFT'}</span>를 성공적으로 구매했습니다!
          </p>
          {mintResult && mintResult.signature && (
            <p className="text-xs text-gray-400 break-all">
              트랜잭션: {mintResult.signature}
            </p>
          )}
          {nftMintAddress && (
            <p className="text-xs text-gray-400 break-all mt-1">
              NFT 주소: {nftMintAddress}
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">공유하고 보상 받기:</h3>
          
          <div className="flex space-x-4">
            <button
              onClick={handleTwitterShare}
              disabled={isTweetShared || isLoading}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                isTweetShared
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } transition duration-200 flex-1`}
            >
              {isTweetShared ? (
                <>
                  <FaCheck className="mr-1" />
                  <span>완료</span>
                </>
              ) : (
                <>
                  <FaTwitter className="mr-1" />
                  <span>트위터</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleTelegramShare}
              disabled={isTelegramShared || isLoading}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                isTelegramShared
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } transition duration-200 flex-1`}
            >
              {isTelegramShared ? (
                <>
                  <FaCheck className="mr-1" />
                  <span>완료</span>
                </>
              ) : (
                <>
                  <FaTelegramPlane className="mr-1" />
                  <span>텔레그램</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition duration-200"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default MintResultModal;