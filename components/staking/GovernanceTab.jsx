import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import ErrorMessage from '../ErrorMessage';
import LoadingSkeleton from '../LoadingSkeleton';
import EnhancedProgressiveImage from '../EnhancedProgressiveImage';
import { createPlaceholder } from '../../utils/mediaUtils';
import { debugLog, debugError } from '../../utils/debugUtils';

/**
 * Governance Tab Component
 * Allows users to view their voting power and participate in governance proposals
 */
const GovernanceTab = ({ governanceData, isLoading: parentIsLoading, onRefresh }) => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [error, setError] = useState(null);
  const [mockDataLoaded, setMockDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(parentIsLoading);
  const [proposalFormVisible, setProposalFormVisible] = useState(false);
  const [proposalFormData, setProposalFormData] = useState({ title: '', description: '' });

  // Extract values from governanceData or use defaults
  const votingPower = governanceData?.votingPower || 0;
  const canCreateProposal = governanceData?.canCreateProposal || false;
  const proposalCreateThreshold = governanceData?.proposalCreateThreshold || 10;
  const activeProposals = governanceData?.recentProposals || [];

  // Update isLoading when parent isLoading changes
  useEffect(() => {
    setIsLoading(parentIsLoading);
  }, [parentIsLoading]);
  
  // Load proposal data when component mounts or wallet changes
  useEffect(() => {
    if (publicKey && !mockDataLoaded) {
      loadProposalData();
    }
  }, [publicKey, mockDataLoaded]);
  
  // Add voting history tracking
  const [votingHistory, setVotingHistory] = useState([]);
  
  // Add a vote to the history
  const addVoteToHistory = (proposalTitle, vote, timestamp = new Date()) => {
    const newVote = {
      id: `vote-${Date.now()}`,
      proposalTitle,
      vote,
      timestamp
    };
    
    setVotingHistory(prevHistory => [newVote, ...prevHistory].slice(0, 10)); // Keep last 10 votes
  };

  // Handler for voting on proposals
  const handleVote = async (proposalPublicKey, support, proposalTitle) => {
    setError(null);
    
    if (!publicKey) {
      setError("Please connect your wallet to vote");
      return;
    }
    
    if (votingPower <= 0) {
      setError("You need to stake NFTs to gain voting power before voting");
      return;
    }
    
    try {
      // Set loading state
      setIsLoading(true);
      
      // Prepare vote transaction
      const response = await fetch('/api/governance/prepareVote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          proposalPublicKey,
          support
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to prepare vote transaction');
      }
      
      // Decode the transaction
      const transactionBuffer = Buffer.from(data.transactionBase64, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send the transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Add to voting history
      addVoteToHistory(
        proposalTitle, 
        support ? 'For' : 'Against'
      );
      
      // Cache-busting timestamp for refresh
      const timestamp = Date.now();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Your vote has been cast successfully! Using ${votingPower} voting power to vote ${support ? 'for' : 'against'}.</span>
        </div>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => {
        successMessage.remove();
      }, 5000);
      
      // Refresh proposal data with slight delay to allow blockchain state to update
      setTimeout(async () => {
        await loadProposalData();
        
        // Also refresh parent data if available
        if (onRefresh) {
          await onRefresh({
            timestamp,
            voteSignature: signature,
            proposalPublicKey
          });
        }
      }, 1500);
      
    } catch (err) {
      debugError("GovernanceTab", "Error casting vote:", err);
      setError(`Failed to cast your vote: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time remaining for proposals
  const formatTimeRemaining = (endTimeStr) => {
    const endTime = new Date(endTimeStr);
    const now = new Date();
    const diffMs = endTime - now;
    
    if (diffMs <= 0) return 'Ended';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m remaining`;
    }
  };

  // Render voting power section
  const renderVotingPower = () => (
    <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl overflow-hidden mb-6">
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Your Governance Power
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">{isLoading ? '...' : votingPower}</div>
            <p className="text-sm text-gray-300">Voting Power</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {isLoading ? '...' : canCreateProposal ? 'Yes' : 'No'}
            </div>
            <p className="text-sm text-gray-300">Can Create Proposals</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {isLoading ? '...' : activeProposals.length}
            </div>
            <p className="text-sm text-gray-300">Active Proposals</p>
          </div>
        </div>
        
        {!isLoading && votingPower < proposalCreateThreshold && (
          <div className="mt-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p>
                You need at least {proposalCreateThreshold} voting power to create proposals. 
                Currently, you have {votingPower} voting power.
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-300">
          <p>Your voting power is determined by the number, tier, and staking period of your NFTs. 
          Stake more NFTs or choose longer staking periods to increase your governance influence.</p>
        </div>
      </div>
    </div>
  );

  // Calculate percentages for proposals
  const getProposalPercentages = (proposal) => {
    // If the proposal already has percentages, use them
    if (proposal.forPercentage && proposal.againstPercentage) {
      return {
        forPercentage: proposal.forPercentage,
        againstPercentage: proposal.againstPercentage
      };
    }
    
    // Otherwise calculate them
    const totalVotes = proposal.forVotes + proposal.againstVotes;
    if (totalVotes === 0) return { forPercentage: 0, againstPercentage: 0 };
    
    return {
      forPercentage: Math.round((proposal.forVotes / totalVotes) * 100),
      againstPercentage: Math.round((proposal.againstVotes / totalVotes) * 100)
    };
  };

  // Function to load real proposal data
  const loadProposalData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the proposals API
      const response = await fetch(`/api/governance/getProposals${publicKey ? `?wallet=${publicKey.toString()}` : ''}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Call onRefresh with the data
      if (onRefresh && data.proposals) {
        // Format the proposals data to match expected structure
        const formattedProposals = data.proposals.map(p => ({
          id: p.id,
          publicKey: p.publicKey,
          title: p.title,
          description: p.description,
          forVotes: p.forVotes,
          againstVotes: p.againstVotes,
          quorum: p.quorum,
          endTime: p.endTime,
          status: p.status,
          voted: p.voted || false,
          yourVote: p.yourVote || null
        }));
        
        // Pass the formatted proposals to the parent component
        onRefresh({ recentProposals: formattedProposals });
      }
      
      setMockDataLoaded(true);
    } catch (error) {
      debugError("GovernanceTab", "Error loading proposals:", error);
      setError(`Failed to load proposals: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render proposals section
  const renderProposals = () => (
    <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl overflow-hidden mb-6">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Active Proposals
          </h3>
          
          <button
            onClick={loadProposalData}
            disabled={isLoading}
            className="text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-2 py-1 rounded flex items-center disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            <LoadingSkeleton height="150px" />
            <LoadingSkeleton height="150px" />
          </div>
        ) : activeProposals.length === 0 ? (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-400 mb-2">No Active Proposals</h4>
            <p className="text-gray-500 text-sm mb-4">There are currently no active governance proposals to vote on.</p>
            <button 
              onClick={loadProposalData} 
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load Proposals'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeProposals.map(proposal => {
              const { forPercentage, againstPercentage } = getProposalPercentages(proposal);
              
              return (
                <div 
                  key={proposal.id} 
                  className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700"
                >
                  <div className="p-4">
                    <div className="flex mb-3">
                      {/* 제안서 관련 NFT 이미지 - 모든 컴포넌트와 동일한 로직 사용 */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden mr-3 border border-gray-700 flex-shrink-0">
                        <EnhancedProgressiveImage
                          src={(() => {
                            // NFT ID는 proposal.id에서 숫자를 추출하거나 해시를 사용
                            let nftId = null;

                            // 1. proposal.id에서 숫자 추출 시도 (가장 높은 우선순위)
                            if (proposal.id) {
                              const match = String(proposal.id).match(/(\d+)/);
                              if (match && match[1]) {
                                nftId = match[1];
                              }
                            }

                            // 2. 문자열 해시 생성
                            if (!nftId && proposal.title) {
                              let hash = 0;
                              const str = proposal.title;
                              for (let i = 0; i < str.length; i++) {
                                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                                hash = hash & hash;
                              }
                              nftId = Math.abs(hash) % 999 + 1;
                            }

                            // 모든 상황에서 항상 직접 IPFS URL 생성
                            const formattedId = String(nftId).padStart(4, '0');
                            // 최신 환경 변수 사용 (하드코딩 제거)
                            const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                            const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                            const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_cb=stable`;

                            // 로그로 생성된 URL 확인
                            debugLog("GovernanceTab", `Proposal: IPFS URL 생성: ${gatewayUrl}`);

                            return gatewayUrl;
                          })()}
                          alt={`Proposal ${proposal.id}`}
                          placeholder={createPlaceholder(`Proposal ${proposal.id}`)}
                          className="w-full h-full object-cover"
                          id={proposal.id || proposal.publicKey}
                          lazyLoad={true}
                          priority={false}
                          highQuality={true}
                          blur={true}
                          preferRemote={true}
                          useCache={false}
                          _source="GovernanceTab-proposal"
                          maxRetries={1}
                          retryInterval={1000}
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{proposal.title}</h4>
                        <p className="text-sm text-gray-400">{proposal.description}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400">For: {proposal.forVotes}</span>
                        <span className="text-gray-400">Quorum: {proposal.quorum}</span>
                        <span className="text-red-400">Against: {proposal.againstVotes}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div 
                            className="bg-green-500 h-full"
                            style={{width: `${forPercentage}%`}}
                          ></div>
                          <div 
                            className="bg-red-500 h-full"
                            style={{width: `${againstPercentage}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-300">
                        {formatTimeRemaining(proposal.endTime)}
                      </span>
                      
                      {proposal.voted ? (
                        <span className={`text-xs px-2 py-1 rounded ${
                          proposal.yourVote === 'for' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                          You voted {proposal.yourVote}
                        </span>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVote(proposal.publicKey, true, proposal.title)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Vote For
                          </button>
                          <button
                            onClick={() => handleVote(proposal.publicKey, false, proposal.title)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Vote Against
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Handler for creating proposal
  const handleCreateProposal = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!publicKey) {
      setError("Please connect your wallet to create a proposal");
      return;
    }
    
    if (votingPower < proposalCreateThreshold) {
      setError(`Insufficient voting power. You need at least ${proposalCreateThreshold} voting power.`);
      return;
    }
    
    const { title, description } = proposalFormData;
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare create proposal transaction
      const response = await fetch('/api/governance/prepareCreateProposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          title: title.trim(),
          description: description.trim()
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to prepare proposal creation transaction');
      }
      
      // Decode the transaction
      const transactionBuffer = Buffer.from(data.transactionBase64, 'base64');
      const transaction = Transaction.from(transactionBuffer);
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send the transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Reset form and hide it
      setProposalFormData({ title: '', description: '' });
      setProposalFormVisible(false);
      
      // Add to history - track proposal creation
      addVoteToHistory(
        title.trim(),
        'Created Proposal'
      );
      
      // Cache-busting timestamp for refresh
      const timestamp = Date.now();
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fadeIn';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Your proposal has been created successfully!</span>
        </div>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => {
        successMessage.remove();
      }, 5000);
      
      // Refresh proposal data with slight delay to allow blockchain state to update
      setTimeout(async () => {
        await loadProposalData();
        
        // Also refresh parent data if available
        if (onRefresh) {
          await onRefresh({
            timestamp,
            proposalSignature: signature,
            proposalPublicKey: data.proposalPublicKey,
            proposalId: data.proposalId
          });
        }
      }, 1500);
    } catch (err) {
      debugError("GovernanceTab", "Error creating proposal:", err);
      setError(`Failed to create proposal: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create New Proposal Section
  const renderCreateProposal = () => (
    <div className="bg-green-900/30 border border-green-500/30 rounded-xl overflow-hidden">
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Create New Proposal
        </h3>
        
        {canCreateProposal ? (
          <div className="space-y-4">
            {proposalFormVisible ? (
              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div>
                  <label htmlFor="proposal-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    id="proposal-title"
                    type="text"
                    value={proposalFormData.title}
                    onChange={(e) => setProposalFormData({...proposalFormData, title: e.target.value})}
                    disabled={isLoading}
                    maxLength={100}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Brief title for your proposal"
                    required
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{proposalFormData.title.length}/100</div>
                </div>
                
                <div>
                  <label htmlFor="proposal-description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    id="proposal-description"
                    value={proposalFormData.description}
                    onChange={(e) => setProposalFormData({...proposalFormData, description: e.target.value})}
                    disabled={isLoading}
                    maxLength={1000}
                    rows={5}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Detailed description of your proposal and its purpose"
                    required
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{proposalFormData.description.length}/1000</div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Submit Proposal
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposalFormVisible(false)}
                    disabled={isLoading}
                    className="py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-gray-300">
                  As a valued community member with sufficient voting power, you can create new governance proposals for the community to vote on.
                </p>
                <button
                  onClick={() => setProposalFormVisible(true)}
                  disabled={isLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create New Proposal
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-300 mb-1">Insufficient Voting Power</h4>
                <p className="text-sm text-gray-400">
                  You need at least {proposalCreateThreshold} voting power to create proposals. 
                  Currently, you have {votingPower} voting power.
                  Stake more NFTs or choose longer staking periods to increase your governance influence.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Format a date for the voting history
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleString();
  };
  
  // Render recent voting history
  const renderVotingHistory = () => {
    if (votingHistory.length === 0) return null;
    
    return (
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </h3>
        
        <div className="space-y-2">
          {votingHistory.map((vote) => (
            <div 
              key={vote.id}
              className="flex justify-between items-center bg-gray-900/40 p-3 rounded-lg text-sm border border-gray-800"
            >
              <div className="flex items-center">
                {/* 투표 기록에 대한 NFT 이미지 미리보기 */}
                <div className="w-8 h-8 rounded overflow-hidden mr-2 border border-gray-700 flex-shrink-0">
                  <EnhancedProgressiveImage
                    src={(() => {
                      // NFT ID는 vote.id 또는 proposalTitle에서 해시 생성
                      let nftId = null;
                      
                      // 해시 생성 (간단한 문자열 해싱)
                      if (vote.proposalTitle) {
                        let hash = 0;
                        const str = vote.proposalTitle;
                        for (let i = 0; i < str.length; i++) {
                          hash = ((hash << 5) - hash) + str.charCodeAt(i);
                          hash = hash & hash;
                        }
                        nftId = Math.abs(hash) % 999 + 1;
                      } else {
                        // 고유한 ID에서 숫자 생성
                        nftId = parseInt(vote.id.replace(/\D/g, '')) % 999 + 1 || 1;
                      }
                      
                      // 모든 상황에서 항상 직접 IPFS URL 생성
                      const formattedId = String(nftId).padStart(4, '0');
                      // 최신 환경 변수 사용 (하드코딩 제거)
                      const IMAGES_CID = process.env.NEXT_PUBLIC_IMAGES_CID || 'bafybeihq6qozwmf4t6omeyuunj7r7vdj26l4akuzmcnnu5pgemd6bxjike';
                      const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://tesola.mypinata.cloud';
                      const gatewayUrl = `${IPFS_GATEWAY}/ipfs/${IMAGES_CID}/${formattedId}.png?_cb=stable`;
                      
                      return gatewayUrl;
                    })()}
                    alt={`Vote for ${vote.proposalTitle}`}
                    placeholder={createPlaceholder(`Vote ${vote.id}`)}
                    className="w-full h-full object-cover"
                    id={vote.id}
                    placeholderText="Pixels on strike"
                    lazyLoad={true}
                    priority={false}
                    highQuality={true}
                    preferRemote={true}
                    useCache={false}
                    maxRetries={1}
                    retryInterval={1000}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    vote.vote === 'For' 
                      ? 'bg-green-500' 
                      : vote.vote === 'Against' 
                        ? 'bg-red-500' 
                        : 'bg-blue-500'
                  }`}></span>
                  <span className="text-gray-300 truncate max-w-[200px]">{vote.proposalTitle}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                  vote.vote === 'For' 
                    ? 'bg-green-900/50 text-green-300' 
                    : vote.vote === 'Against' 
                      ? 'bg-red-900/50 text-red-300' 
                      : 'bg-blue-900/50 text-blue-300'
                }`}>
                  {vote.vote}
                </span>
                <span className="text-gray-400 text-xs">{formatDate(vote.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // New component for Meme Contest
  const renderMemeContest = () => (
    <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl overflow-hidden">
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Create New Memes
        </h3>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-900/50 to-yellow-900/50 rounded-lg p-4 relative overflow-hidden border border-amber-500/20">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <h4 className="font-bold text-amber-300 text-lg mb-2">Meme Contest is Live!</h4>
              <p className="text-gray-300 text-sm mb-4">
                Use your governance power to create and vote on memes. Win TESOLA tokens and exclusive NFTs by participating in our community meme contest.
              </p>
              <ul className="text-sm space-y-2 mb-4 text-gray-300">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create and submit your favorite TESOLA & SOLARA memes</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Vote for your favorite memes using your staking power</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Win up to 1,000,000 TESOLA tokens + Legendary NFTs</span>
                </li>
              </ul>
              <a
                href="/contest"
                className="block w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white rounded-lg font-bold transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-600/20 text-center relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Join Meme Contest
                </span>
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {error && (
        <ErrorMessage 
          message={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}
      
      {renderVotingPower()}
      {renderProposals()}
      
      {/* Grid layout for Create Proposal and Meme Contest sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCreateProposal()}
        {renderMemeContest()}
      </div>
      
      {votingHistory.length > 0 && renderVotingHistory()}
      
      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default GovernanceTab;