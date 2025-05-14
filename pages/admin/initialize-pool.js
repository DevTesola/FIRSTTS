import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  Keypair
} from '@solana/web3.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../../components/admin/AdminLayout';

export default function InitializePool() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [poolState, setPoolState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [rewardRate, setRewardRate] = useState(100); // 기본값 100
  const [emergencyFee, setEmergencyFee] = useState(5); // 기본값 5 (5%)
  const [detailedPoolInfo, setDetailedPoolInfo] = useState(null);
  
  const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';
  const POOL_SEED = Buffer.from("pool_state"); // 수정: 올바른 시드 값 사용

  // 무한 루프 방지
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  
  useEffect(() => {
    // Connection이 있을 때만 풀 상태 확인
    if (connection && publicKey && !loadedOnce) {
      checkPoolState();
    }
  }, [connection, publicKey, loadedOnce]);
  
  // 풀 상태 자동 새로고침 방지
  useEffect(() => {
    // 불필요한 자동 새로고침을 방지하기 위한 코드
    const preventAutoRefresh = () => {
      const now = Date.now();
      // 마지막 확인 후 5초 이내에 다시 확인하지 않음
      if (now - lastCheckTime < 5000) {
        console.log('풀 상태 확인 요청이 너무 빈번합니다. 무시합니다.');
        return;
      }
      setLastCheckTime(now);
    };
    
    // 풀 상태 확인 페이지 방문 시 한 번만 실행
    if (connection && publicKey && loadedOnce) {
      preventAutoRefresh();
    }
  }, [connection, publicKey, lastCheckTime, loadedOnce]);

  const checkPoolState = async () => {
    if (!connection || !publicKey) return;

    try {
      setCheckLoading(true);
      
      // 현재 저장된 pool_state 계정 주소 가져오기
      // YBZdU27VdXY7AHpzFDkphMFX1GHQ888ivU4Kgua5uCu - 성공적으로 초기화된 계정
      const poolStateAddress = 'YBZdU27VdXY7AHpzFDkphMFX1GHQ888ivU4Kgua5uCu';
      
      // 백엔드를 통해 상세 정보 가져오기
      const response = await fetch(`/api/admin/check-pool?address=${poolStateAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        setDetailedPoolInfo(data);
        
        // 기본 정보 업데이트
        setPoolState({
          address: data.address,
          exists: data.exists,
          data: data.dataLength > 0 ? `${data.dataLength} bytes` : null,
          owner: data.owner
        });
      } else {
        toast.error('풀 상태 확인 실패: ' + (data.error || '알 수 없는 오류'));
        setPoolState({
          address: poolStateAddress,
          exists: false,
          data: null,
          owner: null
        });
      }
      
      setLoadedOnce(true);
    } catch (error) {
      console.error('풀 상태 확인 오류:', error);
      toast.error('풀 상태 확인 중 오류 발생: ' + error.message);
      setLoadedOnce(true);
    } finally {
      setCheckLoading(false);
    }
  };

  const handleInitializePool = async () => {
    if (!publicKey || !signTransaction || !connection) {
      toast.error('지갑이 연결되지 않았습니다');
      return;
    }

    try {
      setIsLoading(true);
      
      toast.info('초기화 트랜잭션 생성 중...');
      
      // 풀 상태 확인 (이미 초기화되었어도 재초기화 가능하도록 수정)
      const programId = new PublicKey(PROGRAM_ID);
      const [poolStatePDA] = PublicKey.findProgramAddressSync(
        [POOL_SEED],
        programId
      );

      const poolStateAccount = await connection.getAccountInfo(poolStatePDA);
      if (poolStateAccount) {
        if (poolStateAccount.owner.equals(new PublicKey(PROGRAM_ID))) {
          // 풀이 이미 초기화되어 있음을 알림만 제공하고 계속 진행
          toast.info('기존 풀 상태를 재초기화합니다');
          console.log('기존 풀 상태 정보:', {
            address: poolStatePDA.toString(),
            owner: poolStateAccount.owner.toString(),
            dataSize: poolStateAccount.data.length
          });
        } else {
          console.log('Pool state account exists but is owned by:', poolStateAccount.owner.toString());
          console.log('Expected owner:', PROGRAM_ID);
        }
      }

      // API에 초기화 트랜잭션 요청
      const response = await fetch('/api/admin/initialize-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': publicKey.toString()
        },
        body: JSON.stringify({
          adminWallet: publicKey.toString(),
          rewardRate: rewardRate,
          emergencyFee: emergencyFee
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '초기화 트랜잭션 생성 실패');
      }
      
      const { transactionBase64, poolStateAccount: poolStatePubkey, poolStateBump } = await response.json();

      // 트랜잭션 직렬화 버퍼로 변환
      const transactionBuffer = Buffer.from(transactionBase64, 'base64');

      // 트랜잭션 객체로 변환
      const transaction = Transaction.from(transactionBuffer);

      // 풀 상태 PDA 정보 로깅 (키페어가 아닌 PDA 사용으로 변경)
      console.log('Pool state PDA:', poolStatePubkey);
      console.log('Pool state bump:', poolStateBump);
      
      toast.info('트랜잭션 서명 중...');
      console.log('트랜잭션 정보:', {
        feePayer: transaction.feePayer.toString(),
        recentBlockhash: transaction.recentBlockhash,
        signers: transaction.signatures.map(s => s.publicKey.toString())
      });
      
      // 관리자 지갑으로 트랜잭션 서명
      const signedTransaction = await signTransaction(transaction);
      
      // 트랜잭션 전송
      toast.info('트랜잭션 전송 중...');
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      
      toast.info(`트랜잭션 제출됨: ${signature}`);
      
      // 트랜잭션 확인
      toast.info('트랜잭션 확인 중...');
      try {
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          console.error('트랜잭션 오류:', confirmation.value.err);
          toast.error('풀 초기화 실패: 트랜잭션 오류');
        } else {
          toast.success('트랜잭션 성공!');
          
          // 풀 상태 다시 확인
          setLoadedOnce(false); // 다시 로드 허용
          setTimeout(async () => {
            await checkPoolState();
            toast.success('풀 초기화 완료!');
          }, 2000);
        }
      } catch (confirmError) {
        console.error('트랜잭션 확인 오류:', confirmError);
        toast.warn('트랜잭션이 제출되었으나 확인할 수 없습니다. 계속 진행됐을 수 있습니다.');
        
        // 확인 불가능한 경우에도 상태 다시 체크
        setLoadedOnce(false);
        setTimeout(checkPoolState, 5000);
      }
    } catch (error) {
      console.error('풀 초기화 오류:', error);
      toast.error(`풀 초기화 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="스테이킹 풀 관리">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">풀 상태</h2>
          <button
            onClick={checkPoolState}
            disabled={checkLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            {checkLoading ? '확인 중...' : '상태 다시 확인'}
          </button>
        </div>
        
        {poolState ? (
          <div className="space-y-2">
            <p><span className="font-semibold text-gray-400">주소:</span> {poolState.address}</p>
            <p>
              <span className="font-semibold text-gray-400">상태:</span>
              {poolState.exists && poolState.owner === PROGRAM_ID ? 
                <span className="text-green-400 ml-2">✓ 초기화됨</span> : 
                <span className="text-yellow-400 ml-2">✗ 초기화되지 않음</span>
              }
            </p>
            {poolState.exists && (
              <>
                <p><span className="font-semibold text-gray-400">데이터 크기:</span> {poolState.data}</p>
                <p><span className="font-semibold text-gray-400">소유자:</span> {poolState.owner}</p>
                <p><span className="font-semibold text-gray-400">예상 소유자:</span> {PROGRAM_ID}</p>
                <p><span className="font-semibold text-gray-400">소유자 일치:</span> {
                  poolState.owner === PROGRAM_ID ?
                    <span className="text-green-400">✓ 일치</span> :
                    <span className="text-red-400">✗ 불일치 (초기화 필요)</span>
                }</p>
                {detailedPoolInfo && detailedPoolInfo.poolData && detailedPoolInfo.poolData.admin && (
                  <p><span className="font-semibold text-gray-400">풀 관리자:</span> {detailedPoolInfo.poolData.admin}</p>
                )}
                
                {/* 풀 상태 계정 확인 정보 */}
                {detailedPoolInfo && (
                  <>
                    <p><span className="font-semibold text-gray-400">PoolState 계정 여부:</span> {
                      detailedPoolInfo.isPoolStateAccount ? 
                        <span className="text-green-400">✓ PoolState 구조 확인됨</span> : 
                        <span className="text-red-400">✗ PoolState 구조 아님</span>
                    }</p>
                    
                    {/* Discriminator 정보 표시 */}
                    {detailedPoolInfo.rawData && (
                      <p><span className="font-semibold text-gray-400">Discriminator:</span> {
                        JSON.stringify(detailedPoolInfo.rawData.discriminator)
                      }</p>
                    )}
                    
                    {/* PoolState 데이터가 파싱된 경우 표시 */}
                    {detailedPoolInfo.isPoolStateAccount && detailedPoolInfo.poolData && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="font-semibold text-gray-300">PoolState 데이터:</p>
                        <ul className="pl-4 text-sm">
                          <li><span className="font-semibold text-gray-400">관리자:</span> {detailedPoolInfo.poolData.admin}</li>
                          <li><span className="font-semibold text-gray-400">보상 비율:</span> {detailedPoolInfo.poolData.reward_rate}</li>
                          <li><span className="font-semibold text-gray-400">긴급 수수료(%):</span> {detailedPoolInfo.poolData.emergency_fee_percent}</li>
                          <li><span className="font-semibold text-gray-400">일시 중지:</span> {detailedPoolInfo.poolData.paused ? '예' : '아니오'}</li>
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            
            {detailedPoolInfo && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="font-semibold text-gray-300 mb-2">상세 정보:</p>
                <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(detailedPoolInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p>풀 상태 로딩 중...</p>
        )}
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">풀 초기화</h2>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              보상 비율 (Reward Rate)
            </label>
            <input
              type="number"
              value={rewardRate}
              onChange={(e) => setRewardRate(parseInt(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
              min="1"
              max="1000"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              1초당 획득하는 토큰 양 (기본값: 100)
            </p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">
              긴급 인출 수수료 (%)
            </label>
            <input
              type="number"
              value={emergencyFee}
              onChange={(e) => setEmergencyFee(parseInt(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
              min="0"
              max="100"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              스테이킹 기간 중 조기 인출 시 수수료 비율 (0-100%, 기본값: 5%)
            </p>
          </div>
        </div>

        {poolState && poolState.exists && poolState.owner === new PublicKey(PROGRAM_ID).toString() ? (
          <div className="mb-4">
            <p className="text-green-400 mb-2">✓ 풀이 이미 초기화되어 있습니다.</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleInitializePool}
                disabled={isLoading}
                className={`px-4 py-2 rounded font-semibold ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                } transition-colors`}
              >
                {isLoading ? '초기화 중...' : '풀 재초기화'}
              </button>
              <p className="text-xs text-yellow-400 mt-2">
                * 풀 재초기화는 기존 설정을 덮어씁니다. 필요한 경우에만 사용하세요.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-yellow-400 mb-2">✗ 풀이 초기화되지 않았습니다. 위 옵션을 설정하고 초기화하세요.</p>
            <button
              onClick={handleInitializePool}
              disabled={isLoading}
              className={`px-4 py-2 rounded font-semibold ${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isLoading ? '초기화 중...' : '풀 초기화'}
            </button>
          </div>
        )}
        
        {isLoading && (
          <p className="text-sm text-gray-400 mt-2">
            처리 중입니다. 지갑을 통해 트랜잭션에 서명해주세요.
          </p>
        )}
      </div>
      
      <ToastContainer position="bottom-right" theme="dark" />
    </AdminLayout>
  );
}