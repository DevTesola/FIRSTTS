/**
 * 토큰 계정 검증 개선 테스트 스크립트
 * 
 * 이 스크립트는 NFT 토큰 계정 검증 시스템의 개선 사항을 테스트합니다.
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const { validateTokenAccount, checkReinitializationNeeded } = require('../shared/utils/token-validator');

// 연결 설정
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

// 테스트 지갑 로드
async function loadTestWallet() {
  try {
    // 테스트 월렛 로드 시도
    const walletData = JSON.parse(fs.readFileSync('./mintWallet.json', 'utf8'));
    const secretKey = Uint8Array.from(walletData);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.log('테스트 지갑 로드 실패, 임시 지갑 생성');
    // 테스트용 지갑 생성
    return Keypair.generate();
  }
}

// 테스트 NFT 민트 정보 로드 - 사용자에게 제공받은 민트 테스트를 위해
async function promptNFTMint() {
  if (process.argv.length > 2) {
    return process.argv[2];
  }
  
  console.log('\n테스트할 NFT 민트 주소를 제공하세요:');
  console.log('사용법: node tests/token-validation-test.js <mint-address>');
  
  // 샘플 민트 주소 제공 - 실제 환경에서 의미 없음
  return "11111111111111111111111111111111";
}

// 토큰 계정 검증 상세 테스트
async function testTokenAccountValidation(walletPubkey, mintPubkey) {
  console.log(`\n=== 향상된 토큰 계정 검증 테스트 ===`);
  console.log(`지갑 주소: ${walletPubkey.toString()}`);
  console.log(`민트 주소: ${mintPubkey.toString()}`);
  
  try {
    console.log('\n1. 강화된 토큰 계정 검증 함수 호출 중...');
    const validationResult = await validateTokenAccount(connection, walletPubkey, mintPubkey);
    
    console.log('\n2. 검증 결과 분석:');
    console.log(JSON.stringify(validationResult, null, 2));
    
    console.log('\n3. 재초기화 필요 확인:');
    const reinitInfo = checkReinitializationNeeded(validationResult);
    console.log(JSON.stringify(reinitInfo, null, 2));
    
    if (validationResult.isValid) {
      console.log('\n✅ 토큰 계정 검증 성공! 스테이킹 준비 완료.');
    } else {
      console.log('\n❌ 토큰 계정 검증 실패. 이유: ' + reinitInfo.message);
      
      if (reinitInfo.needsInitialization) {
        console.log('토큰 계정 초기화가 필요합니다.');
      }
    }
    
    return validationResult;
  } catch (error) {
    console.error('토큰 계정 검증 중 오류 발생:', error);
    return null;
  }
}

// 메인 함수
async function main() {
  console.log('=== NFT 토큰 계정 검증 개선 테스트 시작 ===');
  
  // 테스트 지갑 로드
  const wallet = await loadTestWallet();
  console.log('테스트 지갑 주소:', wallet.publicKey.toString());
  
  // 테스트 민트 주소 가져오기
  const mintAddressStr = await promptNFTMint();
  let mintPubkey;
  
  try {
    mintPubkey = new PublicKey(mintAddressStr);
  } catch (error) {
    console.error('유효하지 않은 민트 주소:', mintAddressStr);
    return;
  }
  
  // 토큰 계정 검증 테스트 실행
  await testTokenAccountValidation(wallet.publicKey, mintPubkey);
  
  console.log('\n=== 테스트 완료 ===');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testTokenAccountValidation,
  loadTestWallet
};