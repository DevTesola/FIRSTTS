import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import SyncLogsPanel from '../../components/admin/SyncLogsPanel';

/**
 * Admin page for viewing staking synchronization logs
 * Displays logs, errors, and statistics about sync operations
 */
export default function SyncLogs() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check admin authentication
  const verifyAdminKey = async () => {
    if (!adminKey) {
      alert('Please enter admin key');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'test_auth'
        })
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      alert(`Authentication failed: ${err.message}`);
    }
  };
  
  return (
    <AdminLayout title="스테이킹 동기화 로그">
      <Head>
        <title>스테이킹 동기화 로그</title>
      </Head>
      
      {/* Admin Authentication Section */}
      <div className="mb-6 p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h2 className="mb-4 text-xl font-semibold">API 인증</h2>
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="관리자 키를 입력하세요"
          />
          <button
            onClick={verifyAdminKey}
            disabled={!adminKey}
            className="px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 shadow-sm flex items-center transition duration-200"
          >
            인증
          </button>
        </div>
        {isAuthenticated && (
          <div className="p-3 mt-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center">
            인증 완료: 로그 조회 권한이 부여되었습니다.
          </div>
        )}
      </div>
      
      {/* Logs Panel */}
      <SyncLogsPanel adminKey={isAuthenticated ? adminKey : null} />
    </AdminLayout>
  );
}