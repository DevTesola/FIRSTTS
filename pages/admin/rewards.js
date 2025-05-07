// pages/admin/rewards.js
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminRewards() {
  const { publicKey, connected } = useWallet();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processLoading, setProcessLoading] = useState({});
  
  useEffect(() => {
    const fetchClaims = async () => {
      if (!connected || !publicKey) return;
      
      setLoading(true);
      try {
        const res = await fetch('/api/admin/getPendingClaims', {
          headers: {
            'X-Wallet-Address': publicKey.toString()
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch claims');
        
        const data = await res.json();
        setClaims(data.claims || []);
      } catch (err) {
        console.error('Error fetching claims:', err);
        toast.error('Failed to load pending claims');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaims();
  }, [connected, publicKey]);
  
  // Process claim handler
  const handleProcessClaim = async (claimId, action) => {
    if (!connected || !publicKey) return;
    
    setProcessLoading(prev => ({ ...prev, [claimId]: true }));
    try {
      const res = await fetch('/api/admin/processClaim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': publicKey.toString()
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
      toast.success(`Claim ${action}d successfully!`);
      
      // Remove claim from list
      setClaims(claims.filter(claim => claim.id !== claimId));
    } catch (err) {
      console.error(`Error ${action}ing claim:`, err);
      toast.error(`Failed to ${action} claim: ${err.message}`);
    } finally {
      setProcessLoading(prev => ({ ...prev, [claimId]: false }));
    }
  };
  
  return (
    <AdminLayout title="Admin Reward Management">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Pending Reward Claims</h2>
          
          {claims.length === 0 ? (
            <p className="text-center py-6 text-gray-400">No pending claims</p>
          ) : (
            <div className="rounded-lg overflow-hidden">
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
        </div>
      )}
      
      <ToastContainer position="bottom-right" theme="dark" />
    </AdminLayout>
  );
}