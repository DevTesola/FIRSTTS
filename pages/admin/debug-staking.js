import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Simple admin dashboard for debugging staking issues
export default function DebugStaking() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkStakingInfo = async () => {
    if (!mintAddress.trim()) {
      setError('민트 주소를 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/debug-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'check_staking_info',
          mintAddress
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStakingInfo = async () => {
    if (!walletAddress.trim()) {
      setError('지갑 주소를 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/debug-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'check_user_staking_info',
          wallet: walletAddress
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const listStakedNFTs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/debug-staking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin_key': adminKey
        },
        body: JSON.stringify({
          action: 'list_staked_nfts'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <Head>
        <title>스테이킹 디버깅 도구</title>
      </Head>

      <h1 className="mb-6 text-2xl font-bold">스테이킹 디버깅 도구</h1>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">관리자 키</label>
        <input
          type="password"
          className="w-full p-2 mb-2 border rounded"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="관리자 키를 입력하세요"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h2 className="mb-4 text-xl font-semibold">NFT 스테이킹 정보 확인</h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">NFT 민트 주소</label>
            <input
              type="text"
              className="w-full p-2 mb-2 border rounded"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="NFT 민트 주소 입력"
            />
            <button
              onClick={checkStakingInfo}
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '로딩 중...' : '확인'}
            </button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="mb-4 text-xl font-semibold">사용자 스테이킹 정보 확인</h2>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">지갑 주소</label>
            <input
              type="text"
              className="w-full p-2 mb-2 border rounded"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="지갑 주소 입력"
            />
            <button
              onClick={checkUserStakingInfo}
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? '로딩 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={listStakedNFTs}
          disabled={loading}
          className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? '로딩 중...' : '스테이킹된 NFT 목록 가져오기'}
        </button>
      </div>

      {error && (
        <div className="p-4 mt-6 text-red-700 bg-red-100 border border-red-200 rounded">
          <h2 className="mb-2 font-semibold">오류</h2>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 mt-6 border rounded">
          <h2 className="mb-2 text-xl font-semibold">결과</h2>
          <pre className="p-4 overflow-auto whitespace-pre-wrap bg-gray-100 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}