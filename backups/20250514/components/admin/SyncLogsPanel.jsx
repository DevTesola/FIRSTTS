import { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ArrowPathIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

/**
 * SyncLogsPanel component for displaying staking synchronization logs
 * Used in the admin dashboard to show recent sync operations
 */
export default function SyncLogsPanel({ adminKey }) {
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('logs'); // 'logs', 'errors', 'stats'
  const [filter, setFilter] = useState({
    operation: '',
    status: '',
    days: 7
  });

  // Load sync logs
  const loadSyncLogs = async () => {
    if (!adminKey) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'get_sync_logs',
          limit: 50,
          operation: filter.operation || null,
          status: filter.status || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load sync logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load sync errors
  const loadSyncErrors = async () => {
    if (!adminKey) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'get_sync_errors',
          limit: 50,
          operation: filter.operation || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load sync errors');
      }
      
      const data = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to load sync errors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load sync statistics
  const loadSyncStats = async () => {
    if (!adminKey) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'get_sync_stats',
          days: filter.days,
          operation: filter.operation || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load sync statistics');
      }
      
      const data = await response.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to load sync statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark error as resolved
  const markErrorResolved = async (errorId) => {
    if (!adminKey || !errorId) return;
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'mark_error_resolved',
          errorId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark error as resolved');
      }
      
      // Reload errors after marking one as resolved
      loadSyncErrors();
    } catch (error) {
      console.error('Failed to mark error as resolved:', error);
    }
  };

  // Load data when tab changes or filter changes
  useEffect(() => {
    if (adminKey) {
      if (selectedTab === 'logs') {
        loadSyncLogs();
      } else if (selectedTab === 'errors') {
        loadSyncErrors();
      } else if (selectedTab === 'stats') {
        loadSyncStats();
      }
    }
  }, [selectedTab, filter, adminKey]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Format duration in milliseconds
  const formatDuration = (ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  // Parse JSON string safely
  const parseJson = (jsonStr) => {
    try {
      return typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    } catch (e) {
      return jsonStr;
    }
  };

  if (!adminKey) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-gray-50">
        <p className="text-gray-500 text-center">Please authenticate to view synchronization logs.</p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
      <h2 className="mb-6 text-xl font-semibold flex items-center text-indigo-700">
        <DocumentTextIcon className="w-6 h-6 mr-2" />
        스테이킹 동기화 로그
      </h2>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setSelectedTab('logs')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'logs'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          동기화 로그
        </button>
        <button
          onClick={() => setSelectedTab('errors')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'errors'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          오류 로그
        </button>
        <button
          onClick={() => setSelectedTab('stats')}
          className={`px-4 py-2 font-medium ${
            selectedTab === 'stats'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          통계
        </button>
      </div>
      
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {selectedTab !== 'stats' && (
          <>
            <select
              value={filter.operation}
              onChange={(e) => setFilter({ ...filter, operation: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">모든 작업</option>
              <option value="sync_nft">단일 NFT 동기화</option>
              <option value="sync_wallet">지갑 동기화</option>
              <option value="sync_all">전체 동기화</option>
              <option value="cron_sync_all">크론 전체 동기화</option>
              <option value="cron_sync_wallet">크론 지갑 동기화</option>
              <option value="update_metadata">메타데이터 업데이트</option>
            </select>
            
            {selectedTab === 'logs' && (
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">모든 상태</option>
                <option value="success">성공</option>
                <option value="error">오류</option>
                <option value="partial">부분 성공</option>
              </select>
            )}
          </>
        )}
        
        {selectedTab === 'stats' && (
          <select
            value={filter.days}
            onChange={(e) => setFilter({ ...filter, days: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={1}>지난 1일</option>
            <option value={7}>지난 7일</option>
            <option value={14}>지난 14일</option>
            <option value={30}>지난 30일</option>
          </select>
        )}
        
        <button
          onClick={() => {
            if (selectedTab === 'logs') loadSyncLogs();
            else if (selectedTab === 'errors') loadSyncErrors();
            else if (selectedTab === 'stats') loadSyncStats();
          }}
          disabled={loading}
          className="px-3 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" /> 로딩 중...
            </>
          ) : (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-1" /> 새로고침
            </>
          )}
        </button>
      </div>
      
      {/* Logs Tab */}
      {selectedTab === 'logs' && (
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? '로그 로딩 중...' : '일치하는 로그가 없습니다.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대상
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지속시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    세부정보
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {log.operation}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {log.status === 'success' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" /> 성공
                        </span>
                      )}
                      {log.status === 'error' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ExclamationCircleIcon className="w-3 h-3 mr-1" /> 오류
                        </span>
                      )}
                      {log.status === 'partial' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          부분 성공
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {log.mint_address ? (
                        <div className="truncate max-w-xs">
                          <span className="font-mono">{log.mint_address.substring(0, 10)}...</span>
                        </div>
                      ) : log.wallet_address ? (
                        <div className="truncate max-w-xs">
                          <span className="font-mono">{log.wallet_address.substring(0, 10)}...</span>
                        </div>
                      ) : (
                        '전체'
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(log.duration_ms)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <details className="cursor-pointer">
                        <summary className="text-indigo-600 hover:text-indigo-800">
                          세부정보 보기
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs overflow-x-auto max-h-32">
                          <pre>{JSON.stringify(parseJson(log.details), null, 2)}</pre>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Errors Tab */}
      {selectedTab === 'errors' && (
        <div className="overflow-x-auto">
          {errors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? '오류 로딩 중...' : '일치하는 오류가 없습니다.'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대상
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    오류
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errors.map((error) => (
                  <tr key={error.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(error.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {error.operation}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {error.mint_address ? (
                        <div className="truncate max-w-xs">
                          <span className="font-mono">{error.mint_address.substring(0, 10)}...</span>
                        </div>
                      ) : error.wallet_address ? (
                        <div className="truncate max-w-xs">
                          <span className="font-mono">{error.wallet_address.substring(0, 10)}...</span>
                        </div>
                      ) : (
                        '전체'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      <details className="cursor-pointer">
                        <summary className="text-red-600 hover:text-red-800">
                          {error.error_message?.substring(0, 30) || '오류 세부정보 보기'}...
                        </summary>
                        <div className="mt-2 p-2 bg-red-50 rounded-md text-xs overflow-x-auto max-h-32">
                          <p className="font-bold">Message:</p>
                          <p>{error.error_message}</p>
                          {error.error_stack && (
                            <>
                              <p className="font-bold mt-2">Stack:</p>
                              <pre>{error.error_stack}</pre>
                            </>
                          )}
                          {error.context && (
                            <>
                              <p className="font-bold mt-2">Context:</p>
                              <pre>{JSON.stringify(parseJson(error.context), null, 2)}</pre>
                            </>
                          )}
                        </div>
                      </details>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {error.resolved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" /> 해결됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ExclamationCircleIcon className="w-3 h-3 mr-1" /> 미해결
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {!error.resolved && (
                        <button
                          onClick={() => markErrorResolved(error.id)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100"
                        >
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          해결됨으로 표시
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Stats Tab */}
      {selectedTab === 'stats' && (
        <div>
          {!stats ? (
            <div className="p-8 text-center text-gray-500">
              {loading ? '통계 로딩 중...' : '통계 데이터가 없습니다.'}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <ArrowPathIcon className="w-5 h-5 text-indigo-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">총 동기화</h3>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
                  <div className="mt-2 text-sm text-gray-500">최근 {filter.days}일</div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">성공</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{stats.success}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    {stats.total > 0 ? `${Math.round((stats.success / stats.total) * 100)}%` : '0%'}
                  </div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">오류</h3>
                  </div>
                  <div className="text-3xl font-bold text-red-600">{stats.errors}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    해결됨: {stats.resolvedErrors || 0}
                  </div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <ClockIcon className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">평균 소요시간</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatDuration(stats.averageDuration)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">작업 당</div>
                </div>
              </div>

              {/* Daily Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">일별 통계</h3>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          총 동기화
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          성공
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          실패
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          오류
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.daily && Object.entries(stats.daily).map(([date, dayStat]) => (
                        <tr key={date} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {date}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {dayStat.total}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                            {dayStat.success}
                            {dayStat.total > 0 && (
                              <span className="ml-1 text-xs text-gray-500">
                                ({Math.round((dayStat.success / dayStat.total) * 100)}%)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                            {dayStat.failed}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600">
                            {dayStat.errors}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* By Operation */}
              {stats.operations && Object.keys(stats.operations).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">작업별 통계</h3>
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작업
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            총 동기화
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            성공
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            실패
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            부분 성공
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            오류
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            평균 소요시간
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(stats.operations).map(([operation, opStat]) => (
                          <tr key={operation} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {operation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {opStat.total}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                              {opStat.success}
                              {opStat.total > 0 && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({Math.round((opStat.success / opStat.total) * 100)}%)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                              {opStat.failed}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-600">
                              {opStat.partial}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600">
                              {opStat.errors}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                              {formatDuration(opStat.averageDuration)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}