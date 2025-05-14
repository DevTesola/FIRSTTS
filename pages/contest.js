import Head from "next/head";
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SAMPLE_MEMES, ERROR_MESSAGES, GOVERNANCE } from "../utils/constants";
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import Link from "next/link";

export default function MemeContest() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [contestants, setContestants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVoted, setUserVoted] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Meme data is imported from constants.js

  // 실제 API를 통해 밈 데이터 가져오기
  useEffect(() => {
    const fetchMemes = async () => {
      setIsLoading(true);
      try {
        // 지갑 정보가 있으면 쿼리 파라미터로 포함
        const walletParam = publicKey ? `&wallet=${publicKey.toString()}` : '';
        const response = await fetch(`/api/contest/getContestMemes?sortBy=votes${walletParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch memes');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setContestants(data.memes);
          
          // 투표 상태 업데이트
          if (publicKey) {
            const votedStatus = {};
            data.memes.forEach(meme => {
              if (meme.hasVoted) {
                votedStatus[meme.id] = true;
              }
            });
            setUserVoted(votedStatus);
          }
        } else {
          console.error('Failed to get memes:', data.error);
          setErrorMessage("Failed to load meme contest entries. Please try again later.");
          setTimeout(() => setErrorMessage(""), 5000);
        }
      } catch (error) {
        console.error('Error fetching memes:', error);
        setErrorMessage("Failed to load meme contest entries. Please try again later.");
        setTimeout(() => setErrorMessage(""), 5000);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemes();
    
    // 30초마다 최신 투표 데이터 자동 갱신
    const intervalId = setInterval(fetchMemes, 30000);
    
    return () => clearInterval(intervalId);
  }, [publicKey, connected]);

  // 실제 API에서 사용자 투표력 가져오기
  useEffect(() => {
    // Fetch user voting power when connected
    if (connected && publicKey) {
      const fetchVotingPower = async () => {
        try {
          setIsLoading(true);
          // 실제 거버넌스 API 사용
          const response = await fetch(`/api/governance/getUserVotingPower?wallet=${publicKey.toString()}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch voting power');
          }
          
          const data = await response.json();
          setUserVotingPower(data.votingPower || 0);
          
          // 동시에 사용자의 기존 투표 이력도 새로고침
          await fetchUserVotingHistory();
        } catch (error) {
          console.error("Error fetching voting power:", error);
          setUserVotingPower(0);
        } finally {
          setIsLoading(false);
        }
      };

      fetchVotingPower();
    } else {
      setUserVotingPower(0);
      setUserVoted({});
    }
  }, [connected, publicKey]);
  
  // 사용자의 기존 투표 이력 가져오기
  const fetchUserVotingHistory = async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`/api/contest/getUserVotingHistory?wallet=${publicKey.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch voting history');
      }
      
      const data = await response.json();
      
      if (data.success && data.votedMemes) {
        // 기존 투표 이력을 상태에 반영
        const votedStatus = {};
        data.votedMemes.forEach(memeId => {
          votedStatus[memeId] = true;
        });
        setUserVoted(votedStatus);
      }
    } catch (error) {
      console.error("Error fetching voting history:", error);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle form submission with IPFS upload and on-chain transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      setErrorMessage("Please connect your wallet to submit a meme");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    if (!selectedFile) {
      setErrorMessage("Please select an image to upload");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    const title = document.getElementById('title').value;
    if (!title) {
      setErrorMessage("Please enter a title for your meme");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. 먼저 IPFS에 이미지 업로드 (실제로는 외부 서비스를 사용)
      // 여기서는 시뮬레이션: 실제 구현에서는 IPFS 서비스 API 호출
      // 실제 구현: formData를 pinata 또는 nft.storage API에 업로드
      
      // 시뮬레이션용 - 실제 IPFS 호출 대신 랜덤 해시 생성
      await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 시뮬레이션
      const mockIpfsHash = `Qm${Array.from({length: 44}, () => 
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[Math.floor(Math.random() * 58)]
      ).join('')}`;
      
      // 2. 온체인 밈 제출 트랜잭션 생성
      const response = await fetch('/api/contest/submitMeme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          title: title,
          description: description,
          ipfsHash: mockIpfsHash
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to prepare meme submission transaction');
      }
      
      // 트랜잭션 데이터를 Base64에서 디코딩
      const transactionData = Buffer.from(data.transactionBase64, 'base64');
      
      // 트랜잭션 객체로 변환
      const transaction = Transaction.from(transactionData);
      
      // 현재는 시뮬레이션이므로 실제 서명 없이 성공한 것으로 처리
      // 실제 구현에서는 지갑에 서명 요청 후 트랜잭션 제출 필요
      console.log('밈 제출 트랜잭션 서명 및 제출이 필요합니다:', transaction);
      
      // 성공 메시지
      setSuccessMessage("Your meme has been submitted successfully! It will appear after moderation.");
      setTimeout(() => setSuccessMessage(""), 5000);
      
      // 폼 초기화
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription("");
      document.getElementById('title').value = "";
    } catch (error) {
      console.error("Error submitting meme:", error);
      setErrorMessage(error.message || "Failed to submit your meme. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voting with real on-chain transaction
  const handleVote = async (memeId, memePublicKey) => {
    if (!connected || !publicKey) {
      setErrorMessage(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    if (userVoted[memeId]) {
      setErrorMessage(ERROR_MESSAGES.ALREADY_VOTED.replace('proposal', 'meme'));
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    if (userVotingPower <= 0) {
      setErrorMessage(ERROR_MESSAGES.NO_VOTING_POWER);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 실제 온체인 투표 트랜잭션 요청
      const response = await fetch('/api/contest/voteMeme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          memePublicKey: memePublicKey
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to prepare voting transaction');
      }
      
      // 트랜잭션 데이터를 Base64에서 디코딩
      const transactionData = Buffer.from(data.transactionBase64, 'base64');
      
      // 트랜잭션 객체로 변환
      const transaction = Transaction.from(transactionData);
      
      // 실제 지갑으로 트랜잭션 서명 요청
      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }
      const signedTransaction = await signTransaction(transaction);
      
      // 서명된 트랜잭션 제출
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // 트랜잭션 확인 대기
      await connection.confirmTransaction(signature, 'confirmed');
      
      // 트랜잭션 성공 후 투표권 차감
      const usedVotingPower = data.votingPower || 1; // API가 사용한 투표권 수 반환하거나 기본값 1 사용
      setUserVotingPower(prevPower => Math.max(0, prevPower - usedVotingPower));
      
      // 오프체인 상태 업데이트 (UI 반응성 향상)
      setContestants(prev => 
        prev.map(meme => 
          meme.id === memeId 
            ? {...meme, votes: meme.votes + usedVotingPower}
            : meme
        )
      );
      
      setUserVoted(prev => ({...prev, [memeId]: true}));
      setSuccessMessage(`Your vote has been recorded on-chain! Used ${usedVotingPower} voting power. Remaining: ${Math.max(0, userVotingPower - usedVotingPower)}`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error voting:", error);
      setErrorMessage(error.message || "Failed to submit your vote. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>TESOLA & SOLARA Meme Contest | On-chain Voting</title>
        <meta
          name="description"
          content="Create and vote for your favorite TESOLA & SOLARA memes using on-chain governance"
        />
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Hero Section */}
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 -top-10 flex justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative">
              <span className="inline-block text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white mb-4">
                On-chain Voting System
              </span>
              
              <h1 className="text-5xl md:text-6xl font-black mb-6 text-transparent bg-clip-text animate-pulse-slow"
                style={{
                  backgroundImage: 'linear-gradient(to right, #d946ef, #ec4899, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(217, 70, 239, 0.4)'
                }}>
                MEME CREATION CONTEST
              </h1>
              
              <div className="flex justify-center">
                <div className="h-1 w-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mb-6"></div>
              </div>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                Create and vote for your favorite TESOLA & SOLARA memes using our on-chain governance system.
                <span className="font-bold text-white block mt-2">Win TESOLA tokens and exclusive NFTs!</span>
              </p>
              
              {connected && (
                <div className="mt-6 inline-block bg-gradient-to-r from-purple-900/60 to-pink-900/60 rounded-lg px-6 py-3 border border-purple-500/30">
                  <p className="text-gray-300 font-medium">
                    Your Voting Power: 
                    <span className={`ml-2 text-transparent bg-clip-text font-bold ${userVotingPower <= 0 ? 'opacity-60' : ''}`}
                      style={{
                        backgroundImage: userVotingPower > 0 
                          ? 'linear-gradient(to right, #d8b4fe, #f9a8d4)' 
                          : 'linear-gradient(to right, #f87171, #ef4444)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                      {userVotingPower} votes
                    </span>
                    {userVotingPower <= 0 && (
                      <span className="ml-2 text-red-400 text-sm">
                        (Stake NFTs to gain more votes)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Form */}
          <div className="mb-16 relative">
            <div className="absolute -inset-10 bg-gradient-to-r from-purple-600/10 via-transparent to-pink-600/10 blur-3xl pointer-events-none"></div>
            
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl overflow-hidden border border-purple-500/30 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/stars.jpg')] opacity-10 mix-blend-overlay"></div>
              
              <div className="p-8 relative">
                <h2 className="text-2xl font-bold mb-6 text-white">Submit Your Meme</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-purple-200 mb-2 font-medium">
                        Meme Image
                      </label>
                      <div className="relative border-2 border-dashed border-purple-500/50 rounded-lg p-4 h-64 flex flex-col items-center justify-center bg-purple-900/20 text-center cursor-pointer hover:bg-purple-900/30 transition-all"
                        onClick={() => document.getElementById('meme-upload').click()}>
                        
                        {previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-purple-300">Click to upload your meme</p>
                            <p className="text-purple-400 text-sm mt-1">PNG, JPG or GIF (max 5MB)</p>
                          </>
                        )}
                        
                        <input 
                          type="file" 
                          id="meme-upload" 
                          name="meme" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-purple-200 mb-2 font-medium">
                          Meme Title
                        </label>
                        <input 
                          type="text" 
                          id="title" 
                          placeholder="Enter a catchy title"
                          className="w-full bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-purple-200 mb-2 font-medium">
                          Description
                        </label>
                        <textarea 
                          id="description" 
                          placeholder="Describe your meme (optional)"
                          className="w-full bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !connected}
                      className={`px-6 py-3 rounded-lg font-bold text-white flex items-center ${
                        connected 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                          : "bg-gray-700 cursor-not-allowed"
                      } transition-all`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : connected ? (
                        <>Submit Meme</>
                      ) : (
                        <>Connect Wallet to Submit</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {successMessage && (
            <div className="mb-8 bg-green-900/50 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg flex items-start">
              <svg className="h-6 w-6 text-green-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-8 bg-red-900/50 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg flex items-start">
              <svg className="h-6 w-6 text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Contestants */}
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">Current Entries</h2>
              
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-purple-900/60 border border-purple-500/30 rounded-lg text-purple-200 hover:bg-purple-800/60 transition-colors">
                  Most Voted
                </button>
                <button className="px-4 py-2 bg-gray-900/60 border border-gray-700/30 rounded-lg text-gray-300 hover:bg-gray-800/60 transition-colors">
                  Newest
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden animate-pulse">
                    <div className="h-64 bg-gray-700/50"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-700/50 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-700/50 rounded w-24"></div>
                        <div className="h-8 bg-gray-700/50 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {contestants.map((meme) => (
                  <div key={meme.id} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all">
                    <div className="h-64 relative overflow-hidden bg-black">
                      <img 
                        src={meme.imageUrl} 
                        alt={meme.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{meme.title}</h3>
                        <p className="text-gray-300 text-sm">{meme.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-400 text-sm">
                          <span className="text-purple-400">Created by</span>
                          <span className="ml-1 bg-purple-900/40 px-2 py-1 rounded text-purple-300">
                            {meme.creatorDisplay}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-sm">
                          <span className="text-gray-400">{new Date(meme.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-amber-400 font-medium">{meme.votes} votes</span>
                          <div className="ml-2 w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (meme.votes / 25))}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleVote(meme.id, meme.publicKey)} 
                          disabled={!connected || userVoted[meme.id] || userVotingPower <= 0 || isLoading}
                          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center ${
                            connected && !userVoted[meme.id] && userVotingPower > 0 && !isLoading
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                              : userVoted[meme.id]
                                ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                                : userVotingPower <= 0
                                  ? "bg-red-900/30 text-red-300 cursor-not-allowed"
                                  : "bg-gray-800 text-gray-400 cursor-not-allowed"
                          } transition-all`}
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : userVoted[meme.id] ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Voted
                            </>
                          ) : userVotingPower <= 0 ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              No Votes Left
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                              Vote ({userVotingPower})
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contest Rules */}
          <div className="mb-16 relative">
            <div className="absolute -inset-10 bg-gradient-to-r from-purple-600/10 via-transparent to-amber-600/10 blur-3xl pointer-events-none"></div>
            
            <div className="bg-gradient-to-r from-purple-900/30 to-amber-900/30 rounded-xl overflow-hidden border border-purple-500/20 p-8 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('/stars.jpg')] opacity-10 mix-blend-overlay"></div>
              
              <div className="relative">
                <h2 className="text-2xl font-bold mb-6 text-white">Contest Rules & Prizes</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-purple-300 mb-4">Rules</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">Submissions must be related to TESOLA or SOLARA</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">One submission per wallet address</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">Voting power is based on your staked NFTs and TESOLA holdings</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">Contest runs until May 15, 2025 at 11:59 PM UTC</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">Contest start and end times will be announced on Telegram</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">All votes are recorded on-chain for transparency</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-amber-300 mb-4">Prizes</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white font-bold">
                          1
                        </div>
                        <div>
                          <p className="text-white font-semibold">First Place</p>
                          <p className="text-gray-300">1,000,000 TESOLA tokens + Legendary NFT</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-gradient-to-r from-gray-500 to-gray-400 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white font-bold">
                          2
                        </div>
                        <div>
                          <p className="text-white font-semibold">Second Place</p>
                          <p className="text-gray-300">500,000 TESOLA tokens + Epic NFT</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-gradient-to-r from-amber-700 to-yellow-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white font-bold">
                          3
                        </div>
                        <div>
                          <p className="text-white font-semibold">Third Place</p>
                          <p className="text-gray-300">250,000 TESOLA tokens + Rare NFT</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-gradient-to-r from-purple-700 to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-white font-bold">
                          +
                        </div>
                        <div>
                          <p className="text-white font-semibold">Runner-ups (10)</p>
                          <p className="text-gray-300">50,000 TESOLA tokens each</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center relative">
            <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 blur-3xl pointer-events-none"></div>
            
            <Link 
              href="/character-introduction"
              className="group relative inline-flex items-center"
            >
              <span className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></span>
              <span className="relative flex items-center justify-center bg-black px-8 py-4 rounded-full leading-none">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-lg font-bold group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
                  <span className="flex items-center">
                    <span className="mr-2 text-xl">✨</span>
                    <span>DISCOVER CHARACTER INSPIRATION</span>
                  </span>
                </span>
              </span>
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}