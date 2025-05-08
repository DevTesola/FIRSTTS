import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useWallet } from '@solana/wallet-adapter-react';
import { isAdminWallet } from '../../utils/adminAuth';
// 아이콘 추가
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ShieldCheckIcon, 
  WrenchScrewdriverIcon,
  ArrowPathRoundedSquareIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// 스테이킹 데이터 동기화를 위한 관리자 페이지
export default function SyncStaking() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [adminKey, setAdminKey] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({});
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedMint, setSelectedMint] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 블록체인과 데이터베이스 상태 불일치 목록
  const [discrepancies, setDiscrepancies] = useState([]);
  const [checkingDiscrepancies, setCheckingDiscrepancies] = useState(false);
  
  // 관리자 키로 API 인증 확인
  const verifyAdminKey = async () => {
    if (!adminKey) {
      setError('관리자 키를 입력하세요');
      return false;
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
        setError(null);
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.error || '인증 실패');
      }
    } catch (err) {
      setError(`관리자 키 인증 실패: ${err.message}`);
      return false;
    }
  };
  
  // 지갑 연결과 관리자 권한 확인
  const isAdmin = connected && publicKey && isAdminWallet(publicKey.toString());

  // 스테이킹 데이터 불일치 검사
  const checkDiscrepancies = async () => {
    if (!isAuthenticated) {
      const authenticated = await verifyAdminKey();
      if (!authenticated) return;
    }

    setCheckingDiscrepancies(true);
    setError(null);
    setLoadingStep('블록체인 스테이킹 데이터 확인 중...');
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'check_discrepancies'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      setDiscrepancies(data.discrepancies || []);
      setSyncStatus({
        totalChecked: data.totalChecked,
        missingInDatabase: data.missingInDatabase?.length || 0,
        missingOnChain: data.missingOnChain?.length || 0,
        imageUrlMissing: data.imageUrlMissing?.length || 0,
        lastChecked: new Date().toISOString()
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingDiscrepancies(false);
      setLoadingStep('');
    }
  };

  // 특정 NFT 스테이킹 데이터 동기화
  const syncNFT = async (mint) => {
    if (!isAuthenticated) {
      const authenticated = await verifyAdminKey();
      if (!authenticated) return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(`NFT ${mint.substring(0, 8)}... 동기화 중`);
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'sync_nft',
          mintAddress: mint
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      // 동기화 성공 후 다시 불일치 목록 업데이트
      await checkDiscrepancies();

      setResults({
        ...results,
        syncNFT: data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // 특정 지갑의 모든 스테이킹 데이터 동기화
  const syncWallet = async (wallet) => {
    if (!isAuthenticated) {
      const authenticated = await verifyAdminKey();
      if (!authenticated) return;
    }

    if (!wallet) {
      setError('지갑 주소를 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(`지갑 ${wallet.substring(0, 8)}... 동기화 중`);
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'sync_wallet',
          wallet
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      // 동기화 성공 후 다시 불일치 목록 업데이트
      await checkDiscrepancies();

      setResults({
        ...results,
        syncWallet: data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // 모든 스테이킹 데이터 동기화
  const syncAll = async () => {
    if (!isAuthenticated) {
      const authenticated = await verifyAdminKey();
      if (!authenticated) return;
    }

    if (!confirm('모든 스테이킹 데이터를 동기화하시겠습니까? 이 작업은 시간이 많이 소요될 수 있습니다.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep('모든 스테이킹 데이터 동기화 중...');
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'sync_all'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      // 동기화 성공 후 다시 불일치 목록 업데이트
      await checkDiscrepancies();

      setResults({
        ...results,
        syncAll: data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  // 특정 민트 주소의 메타데이터 및 이미지 정보 수동 추가/수정
  const updateNFTMetadata = async () => {
    if (!isAuthenticated) {
      const authenticated = await verifyAdminKey();
      if (!authenticated) return;
    }

    if (!selectedMint) {
      setError('NFT 민트 주소를 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep(`NFT ${selectedMint.substring(0, 8)}... 메타데이터 업데이트 중`);
    
    try {
      const response = await fetch('/api/admin/sync-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'update_nft_metadata',
          mintAddress: selectedMint
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      setResults({
        ...results,
        updateMetadata: data
      });
      
      // 메타데이터 업데이트 후 불일치 목록 다시 확인
      await checkDiscrepancies();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <AdminLayout title="스테이킹 데이터 동기화">
      <Head>
        <title>스테이킹 데이터 동기화</title>
      </Head>

      <div className="mb-6 p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
          <ShieldCheckIcon className="w-6 h-6 mr-2" />
          관리자 인증
        </h2>
        <label className="block mb-2 text-sm font-medium text-gray-700">관리자 키</label>
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-grow p-3 mb-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="관리자 키를 입력하세요"
          />
          <button
            onClick={verifyAdminKey}
            disabled={loading || !adminKey}
            className="px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 shadow-sm flex items-center transition duration-200"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 인증 중...
              </>
            ) : (
              '인증'
            )}
          </button>
        </div>
        {isAuthenticated && (
          <div className="p-3 mt-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
            인증 완료: API 호출 권한이 부여되었습니다.
          </div>
        )}
      </div>

      {/* 데이터 불일치 검사 섹션 */}
      <div className="p-6 mb-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
          <DocumentMagnifyingGlassIcon className="w-6 h-6 mr-2" />
          블록체인과 데이터베이스 상태 확인
        </h2>
        <button
          onClick={checkDiscrepancies}
          disabled={checkingDiscrepancies || loading}
          className="px-5 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 shadow-sm flex items-center transition duration-200"
        >
          {checkingDiscrepancies ? (
            <>
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 검사 중...
            </>
          ) : (
            <>
              <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2" /> 불일치 확인
            </>
          )}
        </button>

        {syncStatus.lastChecked && (
          <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-lg mb-3 text-gray-800">동기화 상태 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600">확인된 전체 NFT</div>
                <div className="font-bold text-xl text-gray-800">{syncStatus.totalChecked || 0}</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
                <div className="text-sm text-gray-600">데이터베이스에서 누락됨</div>
                <div className="font-bold text-xl text-orange-600">{syncStatus.missingInDatabase || 0}</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                <div className="text-sm text-gray-600">블록체인에서 누락됨</div>
                <div className="font-bold text-xl text-red-600">{syncStatus.missingOnChain || 0}</div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                <div className="text-sm text-gray-600">이미지 URL 누락</div>
                <div className="font-bold text-xl text-yellow-600">{syncStatus.imageUrlMissing || 0}</div>
              </div>
            </div>
            
            <div className="mt-3 text-right text-sm text-gray-500 italic">
              마지막 검사: {formatDate(syncStatus.lastChecked)}
            </div>
          </div>
        )}
      </div>

      {/* 불일치 목록 표시 */}
      {discrepancies.length > 0 && (
        <div className="p-6 mb-6 border border-gray-200 rounded-lg shadow-sm bg-white">
          <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
            <ExclamationCircleIcon className="w-6 h-6 mr-2" />
            불일치 NFT 목록
          </h2>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-indigo-50 text-left">
                  <th className="p-3 font-medium text-gray-700 border-b">NFT</th>
                  <th className="p-3 font-medium text-gray-700 border-b">지갑</th>
                  <th className="p-3 font-medium text-gray-700 border-b">문제</th>
                  <th className="p-3 font-medium text-gray-700 border-b">액션</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition duration-150">
                    <td className="p-3">
                      <div className="font-medium">{item.nft_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{item.mint_address}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs">
                        <button 
                          onClick={() => {
                            setSelectedWallet(item.wallet_address);
                            syncWallet(item.wallet_address);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {item.wallet_address ? item.wallet_address.substring(0, 8) + '...' + item.wallet_address.substring(item.wallet_address.length - 6) : 'Unknown'}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      {item.issue === 'missing_in_db' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          데이터베이스에 누락됨
                        </span>
                      )}
                      {item.issue === 'missing_on_chain' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          블록체인에 누락됨
                        </span>
                      )}
                      {item.issue === 'missing_image_url' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          이미지 URL 누락
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => syncNFT(item.mint_address)}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1.5 text-xs text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 shadow-sm transition duration-150"
                        >
                          <ArrowPathIcon className="w-3 h-3 mr-1" />
                          동기화
                        </button>
                        {item.issue === 'missing_image_url' && (
                          <button 
                            onClick={() => {
                              setSelectedMint(item.mint_address);
                              updateNFTMetadata();
                            }}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition duration-150"
                          >
                            <WrenchScrewdriverIcon className="w-3 h-3 mr-1" />
                            메타데이터 수정
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NFT 동기화 섹션 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
          <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
            <ArrowPathRoundedSquareIcon className="w-6 h-6 mr-2" />
            단일 NFT 동기화
          </h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">NFT 민트 주소</label>
            <input
              type="text"
              className="w-full p-3 mb-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedMint}
              onChange={(e) => setSelectedMint(e.target.value)}
              placeholder="NFT 민트 주소 입력"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => syncNFT(selectedMint)}
                disabled={loading || !selectedMint}
                className="px-4 py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 shadow-sm flex items-center justify-center transition duration-200"
              >
                {loading && loadingStep.includes(selectedMint) ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 동기화 중...
                  </>
                ) : (
                  <>
                    <ArrowPathRoundedSquareIcon className="w-5 h-5 mr-2" /> NFT 동기화
                  </>
                )}
              </button>
              <button
                onClick={updateNFTMetadata}
                disabled={loading || !selectedMint}
                className="px-4 py-2.5 text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 shadow-sm flex items-center justify-center transition duration-200"
              >
                {loading && loadingStep.includes('메타데이터') ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 업데이트 중...
                  </>
                ) : (
                  <>
                    <WrenchScrewdriverIcon className="w-5 h-5 mr-2" /> 메타데이터 업데이트
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg shadow-sm bg-white">
          <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
            <ArrowPathRoundedSquareIcon className="w-6 h-6 mr-2" />
            지갑 동기화
          </h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">지갑 주소</label>
            <input
              type="text"
              className="w-full p-3 mb-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              placeholder="지갑 주소 입력"
            />
            <button
              onClick={() => syncWallet(selectedWallet)}
              disabled={loading || !selectedWallet}
              className="w-full px-4 py-2.5 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 shadow-sm flex items-center justify-center transition duration-200"
            >
              {loading && loadingStep.includes(selectedWallet) ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 동기화 중...
                </>
              ) : (
                <>
                  <ArrowPathRoundedSquareIcon className="w-5 h-5 mr-2" /> 지갑 동기화
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 전체 동기화 섹션 */}
      <div className="p-6 mt-6 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
          <ArrowPathRoundedSquareIcon className="w-6 h-6 mr-2" />
          전체 스테이킹 데이터 동기화
        </h2>
        <div className="mb-4">
          <button
            onClick={syncAll}
            disabled={loading}
            className="px-5 py-3 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 shadow-sm flex items-center transition duration-200"
          >
            {loading && loadingStep.includes('모든') ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> 동기화 중...
              </>
            ) : (
              <>
                <ArrowPathRoundedSquareIcon className="w-5 h-5 mr-2" /> 모든 스테이킹 데이터 동기화
              </>
            )}
          </button>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
            <ExclamationCircleIcon className="w-5 h-5 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">이 작업은 모든 스테이킹 데이터를 블록체인에서 읽어와 데이터베이스와 동기화합니다. 상당한 시간이 소요될 수 있으며, 시스템 부하가 증가할 수 있습니다.</p>
          </div>
        </div>
      </div>

      {/* 로딩 상태 표시 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowPathIcon className="w-10 h-10 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">데이터 처리 중...</h3>
              <p className="text-sm text-gray-500 mb-4 text-center">{loadingStep || '요청한 작업을 처리하고 있습니다. 잠시만 기다려 주세요.'}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 오류 표시 */}
      {error && (
        <div className="p-4 mt-6 text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-sm flex items-start">
          <ExclamationCircleIcon className="w-6 h-6 mr-3 text-red-600 flex-shrink-0" />
          <div>
            <h2 className="mb-1 font-semibold">오류가 발생했습니다</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* 결과 표시 - 좀 더 사용자 친화적인 포맷 */}
      {results && (
        <div className="p-6 mt-6 border border-gray-200 rounded-lg shadow-sm bg-white">
          <h2 className="mb-4 text-xl font-semibold flex items-center text-indigo-700">
            <CheckCircleIcon className="w-6 h-6 mr-2" />
            실행 결과
          </h2>
          
          {results.syncNFT && (
            <div className="p-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-emerald-600" />
                <h3 className="font-medium text-emerald-800">NFT 동기화 결과</h3>
              </div>
              <div className="mt-3 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-md border border-emerald-100">
                    <div className="text-sm text-gray-600 mb-1">상태</div>
                    <div className="font-medium">
                      {results.syncNFT.success ? (
                        <span className="text-emerald-600 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> 성공
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ExclamationCircleIcon className="w-4 h-4 mr-1" /> 실패
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-emerald-100">
                    <div className="text-sm text-gray-600 mb-1">메시지</div>
                    <div className="font-medium">{results.syncNFT.message}</div>
                  </div>
                </div>
                {results.syncNFT.onchainData && (
                  <details className="mt-2 bg-white p-3 rounded-lg border border-emerald-100">
                    <summary className="cursor-pointer text-sm text-blue-600 font-medium flex items-center">
                      <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" /> 블록체인 데이터 상세 보기
                    </summary>
                    <pre className="mt-3 p-3 text-xs overflow-auto bg-gray-50 rounded-md border border-gray-100 max-h-60">
                      {JSON.stringify(results.syncNFT.onchainData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
          
          {results.syncWallet && (
            <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
                <h3 className="font-medium text-blue-800">지갑 동기화 결과</h3>
              </div>
              <div className="mt-3 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">상태</div>
                    <div className="font-medium">
                      {results.syncWallet.success ? (
                        <span className="text-blue-600 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> 성공
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ExclamationCircleIcon className="w-4 h-4 mr-1" /> 실패
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">메시지</div>
                    <div className="font-medium">{results.syncWallet.message}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">동기화된 NFT</div>
                    <div className="font-medium text-lg">{results.syncWallet.count || 0}</div>
                  </div>
                </div>
                {results.syncWallet.results && results.syncWallet.results.length > 0 && (
                  <details className="mt-3 bg-white p-3 rounded-lg border border-blue-100">
                    <summary className="cursor-pointer text-sm text-blue-600 font-medium flex items-center">
                      <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" /> NFT 동기화 상세 보기 ({results.syncWallet.results.length}개)
                    </summary>
                    <div className="mt-3 max-h-60 overflow-y-auto rounded-md shadow-sm">
                      <table className="w-full text-xs border-collapse bg-white">
                        <thead>
                          <tr className="bg-blue-50 text-blue-800">
                            <th className="p-2 border-b font-medium text-left">민트 주소</th>
                            <th className="p-2 border-b font-medium text-left">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.syncWallet.results.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50 transition duration-150">
                              <td className="p-2">
                                <span className="truncate max-w-xs inline-block">{item.mint}</span>
                              </td>
                              <td className="p-2">
                                {item.status === 'synchronized' && 
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircleIcon className="w-3 h-3 mr-1" /> 동기화 성공
                                  </span>
                                }
                                {item.status === 'skipped' && 
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    스킵됨 ({item.reason})
                                  </span>
                                }
                                {item.status === 'error' && 
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <ExclamationCircleIcon className="w-3 h-3 mr-1" /> 오류 ({item.error})
                                  </span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
          
          {results.syncAll && (
            <div className="p-4 mb-4 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-purple-600" />
                <h3 className="font-medium text-purple-800">전체 동기화 결과</h3>
              </div>
              <div className="mt-3 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-600 mb-1">상태</div>
                    <div className="font-medium">
                      {results.syncAll.success ? (
                        <span className="text-purple-600 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> 성공
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ExclamationCircleIcon className="w-4 h-4 mr-1" /> 실패
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-600 mb-1">메시지</div>
                    <div className="font-medium">{results.syncAll.message}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-600 mb-1">전체 계정</div>
                    <div className="font-medium text-lg">{results.syncAll.total || 0}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-purple-100">
                    <div className="text-sm text-gray-600 mb-1">처리된 계정</div>
                    <div className="font-medium text-lg">{results.syncAll.processed || 0}</div>
                  </div>
                </div>
                {results.syncAll.results && results.syncAll.results.length > 0 && (
                  <details className="mt-3 bg-white p-3 rounded-lg border border-purple-100">
                    <summary className="cursor-pointer text-sm text-purple-600 font-medium flex items-center">
                      <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" /> 상세 결과 보기
                    </summary>
                    <pre className="mt-3 p-3 text-xs overflow-auto bg-gray-50 rounded-md border border-gray-100 max-h-60">
                      {JSON.stringify(results.syncAll.results, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
          
          {results.updateMetadata && (
            <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-amber-600" />
                <h3 className="font-medium text-amber-800">메타데이터 업데이트 결과</h3>
              </div>
              <div className="mt-3 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="bg-white p-3 rounded-md border border-amber-100">
                    <div className="text-sm text-gray-600 mb-1">상태</div>
                    <div className="font-medium">
                      {results.updateMetadata.success ? (
                        <span className="text-amber-600 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> 성공
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ExclamationCircleIcon className="w-4 h-4 mr-1" /> 실패
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-amber-100">
                    <div className="text-sm text-gray-600 mb-1">메시지</div>
                    <div className="font-medium">{results.updateMetadata.message}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-amber-100">
                    <div className="text-sm text-gray-600 mb-1">NFT ID</div>
                    <div className="font-medium">{results.updateMetadata.nftId}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-amber-100">
                    <div className="text-sm text-gray-600 mb-1">이미지 URL</div>
                    <div className="font-medium text-sm truncate">{results.updateMetadata.imageUrl}</div>
                  </div>
                </div>
                <details className="mt-3 bg-white p-3 rounded-lg border border-amber-100">
                  <summary className="cursor-pointer text-sm text-amber-600 font-medium flex items-center">
                    <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" /> 상세 결과 보기
                  </summary>
                  <pre className="mt-3 p-3 text-xs overflow-auto bg-gray-50 rounded-md border border-gray-100 max-h-60">
                    {JSON.stringify(results.updateMetadata, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
          
          {/* 결과 데이터 원본 (디버깅용) */}
          <details className="mt-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <summary className="cursor-pointer text-sm text-gray-600 font-medium flex items-center">
              <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-1" /> 원본 응답 데이터 보기
            </summary>
            <pre className="mt-3 p-4 overflow-auto text-xs whitespace-pre-wrap bg-gray-50 rounded-md border border-gray-100 max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </AdminLayout>
  );
}