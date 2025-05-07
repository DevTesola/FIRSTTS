// pages/api/admin/initialize-pool.js
import { Connection, PublicKey, Transaction, TransactionInstruction, Keypair, SystemProgram } from '@solana/web3.js';

// 프로그램 ID와 IDL
const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';
// PDA는 사용하지 않습니다. IDL에서 pool_state는 signer여야 함

// IDL에서 initialize 명령 식별자 가져오기 (idl/nft_staking.json 파일에서 추출)
const INITIALIZE_DISCRIMINATOR = [175, 175, 109, 31, 13, 152, 155, 237]; // IDL에서 "initialize" 명령어 식별자 추출

// Anchor 프로그램은 두 가지 방식으로 discriminator를 생성할 수 있습니다:
// 1. SHA256("global:<명령어이름>") 앞 8바이트
// 2. SHA256("<명령어이름>") 앞 8바이트

const crypto = require('crypto');
const initializeHash = crypto.createHash('sha256').update('initialize').digest().slice(0, 8);
const globalInitializeHash = crypto.createHash('sha256').update('global:initialize').digest().slice(0, 8);

console.log('IDL initialize discriminator (hex):', Buffer.from(INITIALIZE_DISCRIMINATOR).toString('hex'));
console.log('SHA256("initialize") 첫 8바이트:', [...initializeHash], Buffer.from(initializeHash).toString('hex'));
console.log('SHA256("global:initialize") 첫 8바이트:', [...globalInitializeHash], Buffer.from(globalInitializeHash).toString('hex'));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { adminWallet, rewardRate, emergencyFee } = req.body;

    if (!adminWallet) {
      return res.status(400).json({ error: '관리자 지갑 주소가 필요합니다' });
    }

    if (rewardRate === undefined || emergencyFee === undefined) {
      return res.status(400).json({ error: 'rewardRate와 emergencyFee는 필수 매개변수입니다' });
    }

    // 관리자 지갑 PublicKey로 변환
    let adminPubkey;
    try {
      adminPubkey = new PublicKey(adminWallet);
    } catch (err) {
      return res.status(400).json({ error: '유효하지 않은 지갑 주소 형식입니다' });
    }

    // Solana 연결 설정
    const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

    // 프로그램 ID
    const programId = new PublicKey(PROGRAM_ID);

    // Pool State 계정 생성 (Keypair) - IDL에 따르면 signer여야 함
    const poolStateKeypair = Keypair.generate();
    console.log('Pool state keypair:', poolStateKeypair.publicKey.toString());
    
    // PoolState 계정 크기 계산 - IDL의 구조 기반 (실제 데이터 크기 + 8바이트 discriminator)
    // PoolState 데이터 구조:
    // - discriminator: 8 bytes
    // - admin: 32 bytes (PublicKey)
    // - reward_rate: 8 bytes (u64)
    // - emergency_fee_percent: 1 byte (u8)
    // - paused: 1 byte (bool)
    // - total_staked: 8 bytes (u64)
    // - common_multiplier: 8 bytes (u64)
    // - rare_multiplier: 8 bytes (u64) 
    // - epic_multiplier: 8 bytes (u64)
    // - legendary_multiplier: 8 bytes (u64)
    // - long_staking_bonus: 8 bytes (u64)
    // - max_nfts_per_user: 1 byte (u8)
    // 총: 95 bytes + 추가 공간 여유를 위해 100으로 설정
    const POOL_STATE_SIZE = 100;

    // 명령 데이터 구성
    // initialize 명령은 reward_rate(u64)와 emergency_fee(u8) 매개변수가 필요합니다
    const rewardRateBuf = Buffer.alloc(8); // u64
    rewardRateBuf.writeBigUInt64LE(BigInt(rewardRate));
    
    const emergencyFeeBuf = Buffer.from([emergencyFee]); // u8

    // 디버깅을 위해 값을 출력
    console.log('Initializing with reward rate:', rewardRate);
    console.log('Initializing with emergency fee:', emergencyFee);
    
    // 두 가지 가능한 discriminator를 모두 출력하여 비교
    console.log('IDL Discriminator (hex):', Buffer.from(INITIALIZE_DISCRIMINATOR).toString('hex'));
    console.log('SHA256 Discriminator (hex):', Buffer.from(initializeHash).toString('hex'));
    
    // IDL에서 확인한 discriminator 값 사용 (가장 신뢰할 수 있음)
    const instructionData = Buffer.concat([
      Buffer.from(INITIALIZE_DISCRIMINATOR), // 8바이트 명령어 식별자 (IDL에서 직접 추출한 값)
      rewardRateBuf,                        // 8바이트 reward_rate (u64)
      emergencyFeeBuf                       // 1바이트 emergency_fee (u8)
    ]);

    // 계정 배열 구성 - 정확한 순서와 속성으로 구성
    // IDL(idl/nft_staking.json)에서 initialize 지시에 필요한 계정 목록과 정확히 일치해야 함
    const accounts = [
      { pubkey: adminPubkey, isSigner: true, isWritable: true },        // admin (payer)
      { pubkey: poolStateKeypair.publicKey, isSigner: true, isWritable: true }, // pool_state (Keypair로 서명 가능)
      { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false } // system_program
    ];

    // 디버깅: 계정 정보 출력
    console.log('계정 정보:');
    const accountNames = ["admin", "pool_state", "system_program"];
    accounts.forEach((acc, idx) => {
      console.log(`${idx}. ${accountNames[idx]}: ${acc.pubkey.toString()} (isSigner: ${acc.isSigner}, isWritable: ${acc.isWritable})`);
    });
    
    // 파일 상단에서 선언한 discriminator 사용 (중복 선언 제거)
    console.log('인스트럭션 데이터에 사용된 discriminator:', Buffer.from(INITIALIZE_DISCRIMINATOR).toString('hex'));
    
    // 트랜잭션 명령 생성
    const initializeIx = new TransactionInstruction({
      keys: accounts,
      programId: programId,
      data: instructionData
    });

    // 새 트랜잭션 생성
    const tx = new Transaction();
    
    // Pool State 계정은 일반 키페어 계정이지만 프로그램이 초기화 과정에서 공간 할당을 처리합니다
    // 로그를 보니 '계정이 이미 사용 중'이라는 오류가 발생하는데, 이는 프로그램에서 자체적으로 
    // 계정 할당 로직이 포함되어 있기 때문입니다. 따라서 별도의 createAccount 명령은 사용하지 않습니다.
    
    // 초기화에 필요한 lamports 계산 (rent exempt)
    const rentExemptAmount = await connection.getMinimumBalanceForRentExemption(POOL_STATE_SIZE);
    console.log(`계정 공간 필요량: ${POOL_STATE_SIZE} 바이트, ${rentExemptAmount} lamports`);
    
    // initialize 명령만 추가
    tx.add(initializeIx);

    // 블록해시 및 트랜잭션 속성 설정
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminPubkey;
    
    // 시뮬레이션을 통한 디버깅
    console.log('트랜잭션 시뮬레이션 시작...');
    try {
      console.log('시뮬레이션 정보:', {
        programId: programId.toString(),
        poolStateAccount: poolStateKeypair.publicKey.toString(),
        adminAccount: adminPubkey.toString(),
        data: Buffer.from(instructionData).toString('hex'),
        dataLength: instructionData.length
      });
      
      const simulation = await connection.simulateTransaction(tx);
      console.log('시뮬레이션 결과:', JSON.stringify(simulation.value, null, 2));
      
      if (simulation.value.err) {
        console.error('시뮬레이션 오류:', simulation.value.err);
        // 자세한 오류 분석
        const errorInfo = typeof simulation.value.err === 'object' ? 
          JSON.stringify(simulation.value.err) : simulation.value.err.toString();
        console.error('오류 상세 정보:', errorInfo);
      }
      
      if (simulation.value.logs) {
        console.log('시뮬레이션 로그:');
        simulation.value.logs.forEach(log => console.log(log));
        
        // 로그에서 풀 초기화 관련 성공/실패 정보 찾기
        const initLogs = simulation.value.logs.filter(log => 
          log.includes('initialize') || 
          log.includes('PoolState') || 
          log.includes('pool_state'));
        
        if (initLogs.length > 0) {
          console.log('풀 초기화 관련 로그:', initLogs);
        }
      }
    } catch (simError) {
      console.error('시뮬레이션 실행 오류:', simError);
    }
    
    // 부분 서명 (pool_state 키페어로 서명)
    tx.partialSign(poolStateKeypair);

    // 트랜잭션 직렬화
    const serializedTransaction = tx.serialize({ 
      requireAllSignatures: false,
      verifySignatures: false 
    });

    // 응답 반환
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64'),
      poolStateAccount: poolStateKeypair.publicKey.toString(),
      poolStateSecretKey: Array.from(poolStateKeypair.secretKey), // 클라이언트가 서명 가능하도록 비밀키도 전송
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