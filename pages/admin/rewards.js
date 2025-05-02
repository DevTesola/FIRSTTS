// pages/admin/rewards.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { isAdminWallet } from '../../utils/adminAuth'; // Import admin auth utility

// Dynamically load wallet button
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function AdminRewards() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processLoading, setProcessLoading] = useState({});
  
  // Check admin privileges using the utility function instead of hardcoded array
  const isAdmin = connected && publicKey && isAdminWallet(publicKey.toString());
  
  useEffect(() => {
    // Redirect if not admin
    if (connected && publicKey && !isAdmin) {
      alert('You do not have permission to access this page.');
      router.push('/');
    }
  }, [connected, publicKey, isAdmin, router]);
  
  useEffect(() => {
    const fetchClaims = async () => {
      if (!connected || !isAdmin) return;
      
      setLoading(true);
      try {
        const res = await fetch('/api/admin/getPendingClaims', {
          headers: {
            'X-Wallet-Address': publicKey.toString() // Add wallet address to header
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch claims');
        
        const data = await res.json();
        setClaims(data.claims || []);
      } catch (err) {
        console.error('Error fetching claims:', err);
        alert('Failed to load pending claims');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaims();
  }, [connected, isAdmin, publicKey]);
  
  // Process claim handler
  const handleProcessClaim = async (claimId, action) => {
    if (!connected || !isAdmin) return;
    
    setProcessLoading(prev => ({ ...prev, [claimId]: true }));
    try {
      const res = await fetch('/api/admin/processClaim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': publicKey.toString() // Add wallet address to header
        },
        body: JSON.stringify({
          claimId,
          action, // 'approve' or 'reject'
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process claim');
      }
      
      // Success message
      alert(`Claim ${action}d successfully!`);
      
      // Remove claim from list
      setClaims(claims.filter(claim => claim.id !== claimId));
    } catch (err) {
      console.error(`Error ${action}ing claim:`, err);
      alert(`Failed to ${action} claim: ${err.message}`);
    } finally {
      setProcessLoading(prev => ({ ...prev, [claimId]: false }));
    }
  };
  
  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Reward Management</h1>
        <div className="text-center py-12">
          <p className="text-xl mb-4">Please connect your admin wallet</p>
          <div className="mt-4 flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }
  
  if (connected && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="text-xl text-center text-red-500">You do not have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Reward Management</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4">Pending Reward Claims</h2>
          
          {claims.length === 0 ? (
            <p className="text-center py-6 text-gray-400">No pending claims</p>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(claim.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-mono">{claim.wallet_address}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-yellow-400 font-bold">{claim.amount} TESOLA</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProcessClaim(claim.id, 'approve')}
                            disabled={processLoading[claim.id]}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white disabled:opacity-50"
                          >
                            {processLoading[claim.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleProcessClaim(claim.id, 'reject')}
                            disabled={processLoading[claim.id]}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}