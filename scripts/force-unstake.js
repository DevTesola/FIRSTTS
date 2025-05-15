/**
 * 강제 언스테이킹 스크립트
 * 
 * 온체인에서 직접 언스테이킹을 시도합니다.
 * 문제가 있는 NFT를 강제로 언스테이킹할 수 있습니다.
 */

const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// 설정
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('4SfUyQkbeyz9jeJDsR5XiUf8DATVZJXtGG4JUsYsWzTs');

// 지갑 주소 (사용자가 입력)
const WALLET_ADDRESS = process.argv[2];
if (!WALLET_ADDRESS) {
  console.error('사용법: node force-unstake.js <지갑주소> <민트주소>');
  process.exit(1);
}

// 민트 주소 (언스테이킹할 NFT)
const MINT_ADDRESS = process.argv[3];
if (!MINT_ADDRESS) {
  console.error('사용법: node force-unstake.js <지갑주소> <민트주소>');
  process.exit(1);
}

// PDA 찾기 함수들
function findPoolStatePDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool_state')],
    PROGRAM_ID
  );
}

function findStakeInfoPDA(mintPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('stake_info'), mintPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function findEscrowAuthorityPDA(mintPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), mintPubkey.toBuffer()],
    PROGRAM_ID
  );
}

function findUserStakingInfoPDA(walletPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_staking_info'), walletPubkey.toBuffer()],
    PROGRAM_ID
  );
}

async function getAssociatedTokenAddress(
  mint,
  owner,
  allowOwnerOffCurve = false,
) {
  if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer())) {
    throw new Error('Owner cannot sign: not on curve');
  }
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

// 언스테이킹 인스트럭션 데이터 생성
function createUnstakeNftInstructionData() {
  // Format: [1 byte discriminator, ...other data]
  const discriminator = Buffer.from([2]); // 0x02 = unstake
  return discriminator;
}

// 혹은 응급 언스테이킹 데이터
function createEmergencyUnstakeNftInstructionData() {
  // Format: [1 byte discriminator, ...other data]
  const discriminator = Buffer.from([5]); // 0x05 = emergency_unstake
  return discriminator;
}

// 메인 함수
async function main() {
  try {
    // Solana 네트워크 연결
    console.log(`Solana 네트워크에 연결 중: ${SOLANA_RPC_ENDPOINT}`);
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    
    // 지갑 및 NFT 민트 주소 파싱
    const walletPubkey = new PublicKey(WALLET_ADDRESS);
    const mintPubkey = new PublicKey(MINT_ADDRESS);
    
    console.log('사용자 지갑:', walletPubkey.toString());
    console.log('언스테이킹할 NFT:', mintPubkey.toString());
    
    // PDA 계산
    const [poolStatePDA] = findPoolStatePDA();
    const [stakeInfoPDA] = findStakeInfoPDA(mintPubkey);
    const [escrowAuthorityPDA] = findEscrowAuthorityPDA(mintPubkey);
    const [userStakingInfoPDA] = findUserStakingInfoPDA(walletPubkey);
    
    console.log('계산된 PDA 주소:');
    console.log('- Pool State PDA:', poolStatePDA.toString());
    console.log('- Stake Info PDA:', stakeInfoPDA.toString());
    console.log('- Escrow Authority PDA:', escrowAuthorityPDA.toString());
    console.log('- User Staking Info PDA:', userStakingInfoPDA.toString());
    
    // 토큰 계정 확인 및 생성
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );
    
    const escrowTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      escrowAuthorityPDA,
      true
    );
    
    console.log('토큰 계정:');
    console.log('- 사용자 토큰 계정:', userTokenAccount.toString());
    console.log('- Escrow 토큰 계정:', escrowTokenAccount.toString());
    
    // 데이터와 인스트럭션 생성
    console.log('인스트럭션 생성 중...');
    
    // 응급 언스테이킹 데이터 사용 (더 확실한 해제를 위해)
    const instructionData = createEmergencyUnstakeNftInstructionData();
    console.log('인스트럭션 데이터 (10진수):', Array.from(instructionData));
    console.log('인스트럭션 데이터 (16진수):', Buffer.from(instructionData).toString('hex'));
    
    // 필요한 계정 목록
    const accounts = [
      { pubkey: walletPubkey, isSigner: true, isWritable: true },
      { pubkey: mintPubkey, isSigner: false, isWritable: false },
      { pubkey: stakeInfoPDA, isSigner: false, isWritable: true },
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
      { pubkey: escrowAuthorityPDA, isSigner: false, isWritable: false },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userStakingInfoPDA, isSigner: false, isWritable: true },
      { pubkey: poolStatePDA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];
    
    // 인스트럭션 생성
    const instruction = new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_ID,
      data: instructionData
    });
    
    console.log('인스트럭션 생성 완료');
    
    // 인스트럭션 로그 출력 (디버깅용)
    console.log('언스테이킹 인스트럭션:');
    console.log('- 프로그램 ID:', instruction.programId.toString());
    console.log('- 데이터 길이:', instruction.data.length);
    console.log('- 계정 수:', instruction.keys.length);
    
    console.log('====================================================');
    console.log('다음 단계에서 이 인스트럭션을 사용하여 트랜잭션을 만들고 서명할 수 있습니다.');
    console.log('이 정보를 페이지에 표시된 "긴급 언스테이킹" 버튼과 함께 사용하세요.');
    console.log('====================================================');
    
    // 이 정보는 페이지에서 언스테이킹할 때 유용합니다.
    // 아래 정보를 복사하여 브라우저 개발자 콘솔에서 사용할 수 있습니다.
    console.log(`
직접 API 호출 정보:

fetch('/api/staking/prepareEmergencyUnstaking', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    wallet: "${WALLET_ADDRESS}",
    mintAddress: "${MINT_ADDRESS}"
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));
    `);
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

main();