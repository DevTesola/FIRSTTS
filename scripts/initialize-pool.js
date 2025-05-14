// scripts/initialize-pool.js
// 스테이킹 풀 초기화를 위한 독립 실행형 스크립트
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

// 환경 설정
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';
const POOL_SEED = Buffer.from("pool_state"); // 수정: "pool_state" 시드 사용

// Anchor 초기화 명령 식별자 - shared/constants/discriminators.js에서 임포트하는 것이 이상적
// Anchor 표준 8바이트 discriminator는 sighash("global:initialize")
// 실제 프로그램과 일치하는지 확인 필요
const INITIALIZE_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]); // 실제 프로그램의 initialize 메서드 식별자

async function main() {
  try {
    console.log('스테이킹 풀 초기화를 시작합니다...');
    
    // Solana 연결
    console.log(`Solana RPC에 연결 중: ${SOLANA_RPC_ENDPOINT}`);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 관리자 키페어 로드 (파일에서 또는 환경 변수에서)
    let adminKeypair;
    
    if (process.env.ADMIN_PRIVATE_KEY) {
      // 환경 변수에서 개인 키 사용
      const privateKeyArray = JSON.parse(process.env.ADMIN_PRIVATE_KEY);
      adminKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } else {
      // 파일에서 키페어 로드 시도
      try {
        const keypairFile = process.argv[2] || path.join(process.env.HOME, '.config/solana/id.json');
        const keyData = JSON.parse(fs.readFileSync(keypairFile, 'utf8'));
        adminKeypair = Keypair.fromSecretKey(new Uint8Array(keyData));
      } catch (err) {
        console.error('키페어 파일을 로드할 수 없습니다. 경로를 명령줄 인수로 제공하세요.');
        process.exit(1);
      }
    }
    
    console.log(`관리자 주소: ${adminKeypair.publicKey.toString()}`);
    
    // 프로그램 ID 생성
    const programId = new PublicKey(PROGRAM_ID);
    
    // Pool State PDA 계산
    const [poolStatePDA] = PublicKey.findProgramAddressSync(
      [POOL_SEED],
      programId
    );
    
    console.log('Pool state PDA:', poolStatePDA.toString());
    
    // pool_state 계정이 이미 존재하는지 확인
    const poolStateAccount = await connection.getAccountInfo(poolStatePDA);
    
    if (poolStateAccount) {
      console.log('풀 상태 계정이 이미 존재합니다.');
      console.log('계정 데이터 크기:', poolStateAccount.data.length);
      console.log('소유자:', poolStateAccount.owner.toString());
      return;
    }
    
    console.log('풀 상태 계정이 존재하지 않습니다. 초기화 트랜잭션을 생성합니다...');
    
    // 새 트랜잭션 생성
    const tx = new Transaction();
    
    // 풀 상태 계정을 위한 공간 계산
    // Anchor 계정 크기: discriminator(8바이트) + 구조체 필드 크기
    // 기본값으로 충분히 큰 크기 할당
    const POOL_STATE_SIZE = 200; // 바이트 
    
    // 계정 임대 면제를 위한 SOL 계산
    const rentExemption = await connection.getMinimumBalanceForRentExemption(POOL_STATE_SIZE);
    
    // 초기화 명령 데이터 준비
    // initialize 명령은 reward_rate(u64)와 emergency_fee(u8) 매개변수가 필요합니다
    const rewardRate = 100; // 기본 보상률
    const emergencyFee = 5; // 긴급 출금 수수료 5%

    const rewardRateBuf = Buffer.alloc(8); // u64
    rewardRateBuf.writeBigUInt64LE(BigInt(rewardRate));

    const emergencyFeeBuf = Buffer.from([emergencyFee]); // u8

    // 명령어 데이터 구성
    const instructionData = Buffer.concat([
      INITIALIZE_DISCRIMINATOR, // 8바이트 명령어 식별자
      rewardRateBuf,           // 8바이트 reward_rate (u64)
      emergencyFeeBuf          // 1바이트 emergency_fee (u8)
    ]);

    // 풀 초기화 명령 생성 - PDA 방식 사용
    const initPoolIx = new TransactionInstruction({
      keys: [
        { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: poolStatePDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId: programId,
      data: instructionData
    });

    console.log('초기화 매개변수:');
    console.log(' - 보상률:', rewardRate);
    console.log(' - 긴급 출금 수수료:', emergencyFee + '%');
    console.log(' - PDA:', poolStatePDA.toString());

    // 트랜잭션에 명령 추가
    tx.add(initPoolIx);
    
    // 트랜잭션 전송
    console.log('트랜잭션 전송 중...');
    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [adminKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log('트랜잭션 성공:', signature);
    console.log('풀이 성공적으로 초기화되었습니다!');
    
  } catch (error) {
    console.error('오류 발생:', error);
    if (error.logs) {
      console.error('프로그램 로그:', error.logs);
    }
  }
}

main().then(() => console.log('완료')).catch(err => console.error(err));