// pages/api/admin/initialize-pool.js
import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { INSTRUCTION_DISCRIMINATORS } from '../../../shared/constants/discriminators';
import { POOL_SEED, SEED_STRINGS } from '../../../shared/constants/seeds';

// 프로그램 ID
const PROGRAM_ID = '4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs';

// IDL에서 initialize 명령 식별자 사용
const INITIALIZE_DISCRIMINATOR = INSTRUCTION_DISCRIMINATORS.INITIALIZE;

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

    // Pool State PDA 계산 - IDL에서는 PDA를 사용합니다
    const [poolStatePDA, poolStateBump] = PublicKey.findProgramAddressSync(
      [POOL_SEED],
      new PublicKey(PROGRAM_ID)
    );
    console.log('Pool state PDA:', poolStatePDA.toString());
    console.log('Pool state bump:', poolStateBump);
    console.log('Pool seed used:', SEED_STRINGS.POOL_SEED_STR);

    // PDA 계정이 이미 존재하는지 확인 (정보 표시용)
    const existingAccount = await connection.getAccountInfo(poolStatePDA);
    if (existingAccount) {
      console.log('풀 상태 계정이 이미 존재합니다:');
      console.log(' - 주소:', poolStatePDA.toString());
      console.log(' - 소유자:', existingAccount.owner.toString());
      console.log(' - 데이터 크기:', existingAccount.data.length);

      if (existingAccount.owner.equals(new PublicKey(PROGRAM_ID))) {
        console.log(' - 상태: 이미 초기화되어 있음 (재초기화 진행)');
      } else {
        console.log(' - 상태: 다른 프로그램이 소유 중');
      }
    }

    // PoolState 계정 크기 계산 - IDL의 구조 기반 (실제 데이터 크기 + 8바이트 discriminator)
    // 참고: Anchor 프로그램은 PDA 공간을 자동으로 할당하므로 우리는 크기를 계산할 필요가 없습니다.
    // 하지만 로깅을 위해 계산해 둡니다.
    const POOL_STATE_SIZE = 200; // 실제 크기보다 충분히 여유를 두고 설정

    // 명령 데이터 구성
    // initialize 명령은 reward_rate(u64)와 emergency_fee(u8) 매개변수가 필요합니다
    const rewardRateBuf = Buffer.alloc(8); // u64
    rewardRateBuf.writeBigUInt64LE(BigInt(rewardRate));
    
    const emergencyFeeBuf = Buffer.from([emergencyFee]); // u8

    // 디버깅을 위해 값을 출력
    console.log('Initializing with reward rate:', rewardRate);
    console.log('Initializing with emergency fee:', emergencyFee);

    // IDL discriminator 사용
    console.log('IDL Discriminator (hex):', Buffer.from(INITIALIZE_DISCRIMINATOR).toString('hex'));

    // 명령어 데이터 구성
    const instructionData = Buffer.concat([
      INITIALIZE_DISCRIMINATOR, // 8바이트 명령어 식별자 (IDL에서 직접 가져온 값)
      rewardRateBuf,           // 8바이트 reward_rate (u64)
      emergencyFeeBuf          // 1바이트 emergency_fee (u8)
    ]);

    // 계정 배열 구성 - 정확한 순서와 속성으로 구성
    // IDL(idl/nft_staking.json)에서 initialize 지시에 필요한 계정 목록과 정확히 일치해야 함
    const accounts = [
      { pubkey: adminPubkey, isSigner: true, isWritable: true },     // admin (payer)
      { pubkey: poolStatePDA, isSigner: false, isWritable: true },   // pool_state (PDA 방식)
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false } // system_program
    ];

    // 디버깅: 계정 정보 출력
    console.log('계정 정보:');
    const accountNames = ["admin", "pool_state", "system_program"];
    accounts.forEach((acc, idx) => {
      console.log(`${idx}. ${accountNames[idx]}: ${acc.pubkey.toString()} (isSigner: ${acc.isSigner}, isWritable: ${acc.isWritable})`);
    });

    // 파일 상단에서 선언한 discriminator 사용 (중복 선언 제거)
    console.log('인스트럭션 데이터에 사용된 discriminator:', Buffer.from(INITIALIZE_DISCRIMINATOR).toString('hex'));
    console.log('인스트럭션 데이터 길이:', instructionData.length, '바이트');
    console.log('초기화 매개변수:');
    console.log(' - 보상률:', rewardRate);
    console.log(' - 긴급 출금 수수료:', emergencyFee + '%');
    
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
        poolStateAccount: poolStatePDA.toString(),
        adminAccount: adminPubkey.toString(),
        data: Buffer.from(instructionData).toString('hex'),
        dataLength: instructionData.length
      });

      // 시뮬레이션 실행
      const simulation = await connection.simulateTransaction(tx);
      console.log('시뮬레이션 결과:', JSON.stringify(simulation.value, null, 2));

      // 오류 확인 및 분석
      if (simulation.value.err) {
        console.error('시뮬레이션 오류:', simulation.value.err);
        // 자세한 오류 분석
        const errorInfo = typeof simulation.value.err === 'object' ?
          JSON.stringify(simulation.value.err) : simulation.value.err.toString();
        console.error('오류 상세 정보:', errorInfo);
      }

      // 로그 확인
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
        } else {
          console.log('풀 초기화 관련 로그가 없습니다.');
        }

        // 필요한 계정이 생성되었는지 확인
        const accountCreationLogs = simulation.value.logs.filter(log =>
          log.includes('created') || log.includes('system') || log.includes('space'));

        if (accountCreationLogs.length > 0) {
          console.log('계정 생성 관련 로그:', accountCreationLogs);
        }
      }
    } catch (simError) {
      console.error('시뮬레이션 실행 오류:', simError);
    }
    
    // 트랜잭션 직렬화 - 관리자 지갑 서명만 필요함
    const serializedTransaction = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    // 응답 반환 - poolStateSecretKey 제거하고 PDA 정보만 포함
    return res.status(200).json({
      transactionBase64: serializedTransaction.toString('base64'),
      poolStateAccount: poolStatePDA.toString(),
      poolStateSeed: SEED_STRINGS.POOL_SEED_STR,
      poolStateBump,
      programId: PROGRAM_ID,
      rewardRate: rewardRate,
      emergencyFee: emergencyFee,
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