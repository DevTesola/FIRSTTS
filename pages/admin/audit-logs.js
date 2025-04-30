// pages/admin/audit-logs.js
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAdminWallet } from '../../utils/adminAuth';
import { getAdminActionTypes, detectSuspiciousActivity } from '../../utils/adminLogger';
import dynamic from 'next/dynamic';

// Dynamically load wallet button
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function AdminAuditLogs() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  const [filters, setFilters] = useState({
    admin: '',
    action: '',
    startDate: '',
    endDate: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [suspiciousActivity, setSuspiciousActivity] = useState(null);
  
  // Check if user is admin
  const isAdmin = connected && publicKey && isAdminWallet(publicKey.toString());
  
  // Redirect if not admin
  useEffect(() => {
    if (connected && publicKey) {
      console.log('Connected wallet:', publicKey.toString());
      console.log('Is admin?', isAdmin);
      console.log('Admin wallets:', process.env.ADMIN_WALLET_ADDRESSES);
      
      if (!isAdmin) {
        alert('You do not have permission to access this page. Your wallet: ' + publicKey.toString());
        router.push('/');
      }
    }
  }, [connected, publicKey, isAdmin, router]);
  
  // Fetch logs based on filters and pagination
  const fetchLogs = async () => {
    if (!connected || !isAdmin) return;
    
    setLoading(true);
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      if (filters.admin) queryParams.append('admin', filters.admin);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      // Fetch logs
      const res = await fetch(`/api/admin/logs?${queryParams.toString()}`, {
        headers: {
          'X-Wallet-Address': publicKey.toString()
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch logs: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      alert('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    if (connected && isAdmin) {
      fetchLogs();
      
      // Also check for suspicious activity
      const checkSuspiciousActivity = async () => {
        const result = await detectSuspiciousActivity({
          timeWindowMinutes: 60,
          actionThreshold: 30
        });
        
        if (result && !result.error) {
          setSuspiciousActivity(result);
        }
      };
      
      checkSuspiciousActivity();
    }
  }, [connected, isAdmin, publicKey]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    setPagination(prev => ({
      ...prev,
      page: 1 // Reset to page 1 when filters change
    }));
    fetchLogs();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      admin: '',
      action: '',
      startDate: '',
      endDate: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    // Reset pagination to page 1
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    
    // Fetch with reset filters
    fetchLogs();
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    
    // This will trigger the useEffect to fetch new data
  };
  
  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Format metadata
  const formatMetadata = (metadata) => {
    if (!metadata) return 'N/A';
    try {
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }
      return Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium">{key}:</span>{' '}
          {typeof value === 'object' ? JSON.stringify(value) : value}
        </div>
      ));
    } catch (e) {
      return String(metadata);
    }
  };
  
  // Not connected
  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Head>
          <title>Admin Audit Logs | SOLARA</title>
        </Head>
        <h1 className="text-3xl font-bold mb-6">Admin Audit Logs</h1>
        <div className="text-center py-12">
          <p className="text-xl mb-4">Please connect your admin wallet</p>
          <div className="mt-4 flex justify-center">
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }
  
  // Connected but not admin
  if (connected && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Head>
          <title>Access Denied | SOLARA</title>
        </Head>
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="text-xl text-center text-red-500">You do not have permission to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <Head>
        <title>Admin Audit Logs | SOLARA</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6">Admin Audit Logs</h1>
      
      {/* Suspicious activity alert */}
      {suspiciousActivity && suspiciousActivity.suspicious && (
        <div className="mb-6 bg-red-900/50 border border-red-500 text-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-300 mb-2">
            Suspicious Activity Detected!
          </h2>
          <p className="mb-2">
            High volume of actions detected in the last {suspiciousActivity.timeWindow.minutes} minutes:
          </p>
          <ul className="list-disc pl-6 mb-2">
            {suspiciousActivity.admins.map((admin, index) => (
              <li key={index}>
                Admin {admin.admin_wallet.slice(0, 4)}...{admin.admin_wallet.slice(-4)} - {admin.count} actions
              </li>
            ))}
          </ul>
          <p className="text-sm text-red-300">
            Threshold: {suspiciousActivity.threshold} actions within {suspiciousActivity.timeWindow.minutes} minutes
          </p>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Admin Wallet
            </label>
            <input
              type="text"
              name="admin"
              value={filters.admin}
              onChange={handleFilterChange}
              placeholder="Admin wallet address"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Action Type
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">All Actions</option>
              {getAdminActionTypes().map((action) => (
                <option key={action} value={action}>
                  {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sort By
            </label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="created_at">Date</option>
              <option value="admin_wallet">Admin</option>
              <option value="action">Action</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sort Order
            </label>
            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          
          <div className="lg:col-span-3 flex items-center space-x-4 mt-3">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {/* Logs table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {logs.length === 0 ? (
            <div className="text-center py-10 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No audit logs found with the current filters.</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Target ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                            {log.admin_wallet.slice(0, 6)}...{log.admin_wallet.slice(-4)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action.includes('approve') ? 'bg-green-900/50 text-green-300' :
                            log.action.includes('reject') || log.action.includes('deny') ? 'bg-red-900/50 text-red-300' :
                            'bg-blue-900/50 text-blue-300'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {log.target_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {formatMetadata(log.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 rounded-md bg-gray-700 text-white disabled:bg-gray-600 disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        // Calculate which page numbers to show
                        let pageNum;
                        if (pagination.pages <= 5) {
                          // Show all pages if 5 or fewer
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          // Near the start
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          // Near the end
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          // In the middle
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-md ${
                              pagination.page === pageNum
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 rounded-md bg-gray-700 text-white disabled:bg-gray-600 disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}