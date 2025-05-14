/**
 * NFT 스테이킹 프로그램 계정 디스크리미네이터 검증 스크립트
 * 실제 온체인 데이터와 불러온 디스크리미네이터 값의 일치 여부를 확인합니다.
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { PROGRAM_ID, DISCRIMINATORS } = require('../utils/staking-helpers/constants');

// Solana RPC 엔드포인트
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// 지갑 주소
const WALLET_ADDRESS = process.argv[2] || null;

/**
 * 지정된 디스크리미네이터와 계정 데이터 비교
 * @param {Buffer} accountData - 계정 데이터
 * @param {Buffer} discriminator - 비교할 디스크리미네이터
 * @returns {boolean} 일치 여부
 */
function compareDiscriminator(accountData, discriminator) {
  if (accountData.length < 8) return false;
  
  const accountDiscriminator = accountData.slice(0, 8);
  return Buffer.compare(accountDiscriminator, discriminator) === 0;
}

/**
 * 디스크리미네이터 16진수 문자열로 변환
 * @param {Buffer} buffer - 디스크리미네이터 버퍼
 * @returns {string} 16진수 문자열
 */
function bufferToHexString(buffer) {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 계정 디스크리미네이터 검증
 */
async function verifyDiscriminators() {
  try {
    console.log('NFT 스테이킹 프로그램 디스크리미네이터 검증 시작...');
    console.log(`프로그램 ID: ${PROGRAM_ID}`);
    
    // Solana 연결 설정
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 풀 상태 계정 PDA 생성
    const [poolStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from([112, 111, 111, 108, 95, 115, 116, 97, 116, 101])], // "pool_state"
      new PublicKey(PROGRAM_ID)
    );
    
    console.log(`풀 상태 PDA: ${poolStatePDA.toString()}`);
    
    // 풀 상태 계정 데이터 조회
    const poolStateAccount = await connection.getAccountInfo(poolStatePDA);
    
    if (!poolStateAccount) {
      console.log('풀 상태 계정이 존재하지 않습니다.');
    } else {
      console.log('풀 상태 계정 발견!');
      console.log(`계정 데이터 크기: ${poolStateAccount.data.length} 바이트`);
      
      // 디스크리미네이터 비교
      const poolStateDiscriminator = DISCRIMINATORS.POOL_STATE;
      const actualPoolStateDiscriminator = poolStateAccount.data.slice(0, 8);
      
      console.log(`기대 디스크리미네이터(POOL_STATE): ${bufferToHexString(poolStateDiscriminator)}`);
      console.log(`실제 디스크리미네이터(POOL_STATE): ${bufferToHexString(actualPoolStateDiscriminator)}`);
      console.log(`일치 여부: ${compareDiscriminator(poolStateAccount.data, poolStateDiscriminator)}`);
    }
    
    // 사용자 지갑 주소가 제공된 경우 유저 스테이킹 계정 확인
    if (WALLET_ADDRESS) {
      try {
        const userPubkey = new PublicKey(WALLET_ADDRESS);
        
        // 유저 스테이킹 계정 PDA 생성
        const [userStakingPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from([117, 115, 101, 114, 95, 115, 116, 97, 107, 105, 110, 103]), userPubkey.toBuffer()], // "user_staking"
          new PublicKey(PROGRAM_ID)
        );
        
        console.log(`\n사용자 스테이킹 PDA: ${userStakingPDA.toString()}`);
        
        // 사용자 스테이킹 계정 데이터 조회
        const userStakingAccount = await connection.getAccountInfo(userStakingPDA);
        
        if (!userStakingAccount) {
          console.log('사용자 스테이킹 계정이 존재하지 않습니다.');
        } else {
          console.log('사용자 스테이킹 계정 발견!');
          console.log(`계정 데이터 크기: ${userStakingAccount.data.length} 바이트`);
          
          // 디스크리미네이터 비교
          const userStakingDiscriminator = DISCRIMINATORS.USER_STAKING_INFO;
          const actualUserStakingDiscriminator = userStakingAccount.data.slice(0, 8);
          
          console.log(`기대 디스크리미네이터(USER_STAKING_INFO): ${bufferToHexString(userStakingDiscriminator)}`);
          console.log(`실제 디스크리미네이터(USER_STAKING_INFO): ${bufferToHexString(actualUserStakingDiscriminator)}`);
          console.log(`일치 여부: ${compareDiscriminator(userStakingAccount.data, userStakingDiscriminator)}`);
          
          // 사용자 스테이킹 계정에서 민트 주소 추출
          if (userStakingAccount.data.length > 45) { // 최소 8(discriminator) + 32(pubkey) + 1(count) + 4(vector length)
            // Parse staked count and mints
            const stakedCount = userStakingAccount.data[40]; // 8 + 32 = 40 (discriminator + owner pubkey)
            console.log(`\n스테이킹된 NFT 개수: ${stakedCount}`);
            
            const stakedMintsVectorLength = userStakingAccount.data.readUInt32LE(41); // 40 + 1 = 41
            console.log(`스테이킹된 민트 벡터 길이: ${stakedMintsVectorLength}`);
            
            if (stakedMintsVectorLength > 0) {
              console.log('\n스테이킹된 NFT 민트 주소:');
              
              let offset = 45; // 8 + 32 + 1 + 4 = 45 (discriminator + owner + count + vector length)
              for (let i = 0; i < stakedMintsVectorLength; i++) {
                const mintPubkey = new PublicKey(userStakingAccount.data.slice(offset, offset + 32));
                console.log(`  ${i+1}. ${mintPubkey.toString()}`);
                
                // 이 민트 주소로 스테이크 계정 조회
                const [stakeInfoPDA] = PublicKey.findProgramAddressSync(
                  [Buffer.from([115, 116, 97, 107, 101]), mintPubkey.toBuffer()], // "stake"
                  new PublicKey(PROGRAM_ID)
                );
                
                console.log(`     스테이크 계정 PDA: ${stakeInfoPDA.toString()}`);
                
                // 스테이크 계정 데이터 조회
                const stakeInfoAccount = await connection.getAccountInfo(stakeInfoPDA);
                
                if (!stakeInfoAccount) {
                  console.log('     스테이크 계정이 존재하지 않습니다.');
                } else {
                  console.log(`     계정 데이터 크기: ${stakeInfoAccount.data.length} 바이트`);
                  
                  // 디스크리미네이터 비교
                  const stakeInfoDiscriminator = DISCRIMINATORS.STAKE_INFO;
                  const actualStakeInfoDiscriminator = stakeInfoAccount.data.slice(0, 8);
                  
                  console.log(`     기대 디스크리미네이터(STAKE_INFO): ${bufferToHexString(stakeInfoDiscriminator)}`);
                  console.log(`     실제 디스크리미네이터(STAKE_INFO): ${bufferToHexString(actualStakeInfoDiscriminator)}`);
                  console.log(`     일치 여부: ${compareDiscriminator(stakeInfoAccount.data, stakeInfoDiscriminator)}`);
                }
                
                offset += 32;
              }
            }
          }
        }
      } catch (error) {
        console.error(`사용자 계정 조회 오류: ${error.message}`);
      }
    } else {
      console.log('\n지갑 주소가 제공되지 않았습니다. 사용자 스테이킹 계정은 확인하지 않습니다.');
      console.log('사용법: node verify-discriminators.js <지갑주소>');
    }
    
    // 프로그램 계정 탐색
    console.log('\n프로그램 계정 조회 중...');
    
    // 프로그램이 소유한 계정 조회 (샘플링)
    const programAccounts = await connection.getProgramAccounts(
      new PublicKey(PROGRAM_ID),
      {
        dataSlice: { offset: 0, length: 8 }, // 디스크리미네이터만 가져오기
        filters: [],
        commitment: 'confirmed'
      }
    );
    
    console.log(`프로그램이 소유한 계정 수: ${programAccounts.length}`);
    
    if (programAccounts.length > 0) {
      console.log('\n발견된 계정 디스크리미네이터:');
      
      // 디스크리미네이터 빈도 분석
      const discriminatorCounts = new Map();
      
      for (const account of programAccounts) {
        const discriminator = bufferToHexString(account.account.data);
        discriminatorCounts.set(discriminator, (discriminatorCounts.get(discriminator) || 0) + 1);
      }
      
      // 디스크리미네이터 빈도별 정렬
      const sortedDiscriminators = [...discriminatorCounts.entries()]
        .sort((a, b) => b[1] - a[1]);
      
      // 디스크리미네이터와 constants.js의 값 비교
      const knownDiscriminators = new Map();
      for (const [name, value] of Object.entries(DISCRIMINATORS)) {
        knownDiscriminators.set(bufferToHexString(value), name);
      }
      
      sortedDiscriminators.forEach(([discriminator, count]) => {
        const knownAs = knownDiscriminators.get(discriminator) || 'Unknown';
        console.log(`  ${discriminator}: ${count}개 계정 (${knownAs})`);
      });
      
      // constants.js에 정의된 디스크리미네이터가 실제로 발견되지 않은 경우 경고
      console.log('\n누락된 디스크리미네이터 확인:');
      let missingFound = false;
      
      for (const [name, value] of Object.entries(DISCRIMINATORS)) {
        const hexValue = bufferToHexString(value);
        if (!discriminatorCounts.has(hexValue)) {
          console.log(`  경고: ${name} (${hexValue})이 실제 프로그램 계정에서 발견되지 않았습니다.`);
          missingFound = true;
        }
      }
      
      if (!missingFound) {
        console.log('  모든 정의된 디스크리미네이터가 실제 프로그램 계정에서 발견되었습니다.');
      }
    }
    
    console.log('\n디스크리미네이터 검증 완료!');
    
  } catch (error) {
    console.error('디스크리미네이터 검증 오류:', error);
  }
}

// 스크립트 실행
verifyDiscriminators();