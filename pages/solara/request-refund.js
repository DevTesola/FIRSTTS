import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Head from 'next/head';
import Link from 'next/link';

export default function RequestRefund() {
  const { publicKey, connected } = useWallet();
  const [txSignature, setTxSignature] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [reason, setReason] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      alert('Please connect your wallet first.');
      return;
    }
    
    if (!txSignature || !reason) {
      alert('Transaction signature and reason are required.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/requestRefund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          mintAddress,
          txSignature,
          reason,
          contactInfo
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitResult({
          success: true,
          message: 'Your refund request has been submitted successfully. We will review it and get back to you within 7 days.'
        });
        // Clear form
        setTxSignature('');
        setMintAddress('');
        setReason('');
        setContactInfo('');
      } else {
        setSubmitResult({
          success: false,
          message: `Error: ${result.message || 'Failed to submit refund request'}`
        });
      }
    } catch (error) {
      console.error('Error submitting refund request:', error);
      setSubmitResult({
        success: false,
        message: `Error: ${error.message || 'An unexpected error occurred'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Request Refund | SOLARA NFT</title>
        <meta name="description" content="Submit a refund request for your SOLARA NFT purchase." />
      </Head>
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          SOLARA NFT Refund Request
        </h1>
        
        <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 shadow-lg">
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Before submitting a refund request, please make sure you have read and understood our{' '}
              <Link href="/solara/refund-policy" className="text-purple-400 hover:underline">
                refund policy
              </Link>.
            </p>
            
            <div className="bg-purple-900/30 p-4 rounded border border-purple-800">
              <h2 className="font-semibold text-purple-300 mb-2">Important Notes:</h2>
              <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                <li>Refund requests must be submitted within 48 hours of minting</li>
                <li>Only technical issues qualify for refund consideration</li>
                <li>Network fees (gas) are non-refundable</li>
                <li>All decisions are at the discretion of the SOLARA team</li>
              </ul>
            </div>
          </div>
          
          {!connected ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">Please connect your wallet to submit a refund request</p>
              <div className="inline-block">
                <WalletMultiButton />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="wallet" className="block text-sm font-medium text-gray-300 mb-1">
                  Your Wallet
                </label>
                <input
                  type="text"
                  id="wallet"
                  value={publicKey?.toString() || ''}
                  disabled
                  className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-gray-300"
                />
              </div>
              
              <div>
                <label htmlFor="txSignature" className="block text-sm font-medium text-gray-300 mb-1">
                  Transaction Signature/Hash (required)
                </label>
                <input
                  type="text"
                  id="txSignature"
                  value={txSignature}
                  onChange={(e) => setTxSignature(e.target.value)}
                  required
                  placeholder="e.g. 5KtPn1..."
                  className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-gray-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  The transaction signature of your mint transaction
                </p>
              </div>
              
              <div>
                <label htmlFor="mintAddress" className="block text-sm font-medium text-gray-300 mb-1">
                  NFT Mint Address (optional)
                </label>
                <input
                  type="text"
                  id="mintAddress"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  placeholder="e.g. DYbH9U..."
                  className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-gray-300"
                />
              </div>
              
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">
                  Reason for Refund Request (required)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="Please describe the issue you encountered..."
                  className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-gray-300"
                />
              </div>
              
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-300 mb-1">
                  Contact Information (optional)
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Telegram username or other contact info"
                  className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-gray-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  How we can contact you if we need more information
                </p>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 ${
                    loading 
                      ? 'bg-purple-700 cursor-wait' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  {loading ? 'Submitting...' : 'Submit Refund Request'}
                </button>
              </div>
              
              {submitResult && (
                <div className={`mt-4 p-4 rounded ${
                  submitResult.success ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'
                }`}>
                  <p className={submitResult.success ? 'text-green-200' : 'text-red-200'}>
                    {submitResult.message}
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link href="/solara" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition duration-200">
            Return to SOLARA Mint Page
          </Link>
        </div>
      </div>
    </>
  );
}