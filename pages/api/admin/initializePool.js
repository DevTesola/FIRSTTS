// pages/api/admin/initializePool.js
// 스테이킹 풀 초기화 API
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { PROGRAM_ID, POOL_SEED } from '../../../utils/staking-helpers/constants';
import * as bs58 from 'bs58';

// 관리자 인증 함수 (실제 구현은 프로젝트의 인증 메커니즘에 따라 다름)
function isAdmin(req) {
  const adminToken = req.headers['x-admin-token'];
  const validToken = process.env.ADMIN_API_TOKEN;
  
  if (!adminToken || !validToken || adminToken !== validToken) {
    return false;
  }
  
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // 관리자 인증
  if (!isAdmin(req)) {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }
  
  try {
    const { adminWallet } = req.body;
    
    if (!adminWallet) {
      return res.status(400).json({ error: '관리자 지갑 주소가 필요합니다' });
    }
    
    let adminPubkey;
    try {
      adminPubkey = new PublicKey(adminWallet);
    } catch (err) {
      return res.status(400).json({ error: '유효하지 않은 지갑 주소 형식입니다' });
    }
    
    // Solana 연결 설정
    const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 프로그램 ID 설정
    const programId = new PublicKey(PROGRAM_ID);
    
    // Pool State PDA 계산
    const [poolStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(POOL_SEED)],
      programId
    );
    
    console.log('Pool state PDA:', poolStatePDA.toString());
    
    // pool_state 계정이 이미 존재하는지 확인
    const poolStateAccount = await connection.getAccountInfo(poolStatePDA);
    
    if (poolStateAccount) {
      console.log('Pool state account already exists');
      return res.status(400).json({ 
        error: '풀 상태 계정이 이미 존재합니다',
        poolStatePDA: poolStatePDA.toString() 
      });
    }
    
    // 새 트랜잭션 생성
    const tx = new Transaction();
    
    // 초기화 명령 식별자 (Anchor의 "initialize_pool" 명령어에 대한 8바이트 식별자)
    // 일반적으로 Anchor에서는 명령어 이름의 SHA256 해시 첫 8바이트를 사용합니다
    // 여기서는 "initialize_pool"에 대한 임시 discriminator를 사용합니다
    const INITIALIZE_POOL_DISCRIMINATOR = Buffer.from([105, 110, 105, 116, 95, 112, 111, 111, 108]); // "init_pool"의 바이트
    
    // 초기화 명령 계정 배열
    const initPoolAccounts = [
      { pubkey: adminPubkey, isSigner: true, isWritable: true },      // 관리자/지불자
      { pubkey: poolStatePDA, isSigner: false, isWritable: true },    // 풀 상태 계정
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // 시스템 프로그램
    ];
    
    // 초기화 명령 생성
    const initPoolIx = new TransactionInstruction({
      keys: initPoolAccounts,
      programId: programId,
      data: INITIALIZE_POOL_DISCRIMINATOR
    });
    
    // 트랜잭션에 초기화 명령 추가
    tx.add(initPoolIx);
    
    // 블록해시 및 트랜잭션 속성 설정
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminPubkey;
    
    // 트랜잭션 직렬화
    const serializedTransaction = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });
    
    // 응답 반환
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64'),
      poolStatePDA: poolStatePDA.toString(),
      message: '풀 초기화 트랜잭션이 생성되었습니다. 관리자 지갑으로 서명하여 실행하세요.',
      expiresAt: new Date(Date.now() + 120000).toISOString()
    });
    
  } catch (error) {
    console.error('풀 초기화 트랜잭션 준비 중 오류:', error);
    return res.status(500).json({ 
      error: '풀 초기화 트랜잭션 준비 실패: ' + (error.message || '알 수 없는 오류'),
      errorCode: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}