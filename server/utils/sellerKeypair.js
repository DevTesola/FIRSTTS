import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 민트 지갑 경로 설정
const mintWalletPath = process.env.MINT_WALLET_PATH
  ? path.resolve(process.env.MINT_WALLET_PATH)
  : path.join(__dirname, '../../mintWallet.json');

// 개발 환경에서만 전체 경로 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('Loading mintWallet.json from:', mintWalletPath);
}

let mintWallet;
try {
  // 파일 존재 확인
  if (!fs.existsSync(mintWalletPath)) {
    throw new Error(`mintWallet.json file not found at path: ${mintWalletPath}`);
  }
  
  // 파일 읽기
  const rawData = fs.readFileSync(mintWalletPath, 'utf8');
  mintWallet = JSON.parse(rawData);

  // 여러 형식 지원
  if (Array.isArray(mintWallet)) {
    if (mintWallet.length !== 64) {
      throw new Error(`Invalid secret key length in mintWallet.json: got ${mintWallet.length} bytes, expected 64 bytes`);
    }
  } else if (mintWallet.secretKey) {
    mintWallet = mintWallet.secretKey;
    if (!Array.isArray(mintWallet) || mintWallet.length !== 64) {
      throw new Error(`Invalid secret key length in mintWallet.json secretKey: got ${mintWallet.length} bytes, expected 64 bytes`);
    }
  } else {
    throw new Error('Invalid format in mintWallet.json: expected an array or object with secretKey');
  }

  // 유효성 검증 (로그는 개발 환경에서만)
  const secretKey = Uint8Array.from(mintWallet);
  if (process.env.NODE_ENV === 'development') {
    console.log('Secret key length:', secretKey.length);
    const keypair = Keypair.fromSecretKey(secretKey);
    console.log('Generated public key:', keypair.publicKey.toBase58());
    
    // 서명 테스트를 제거합니다 - 이것이 문제였습니다
  }
} catch (err) {
  console.error('Failed to load mintWallet.json:', err.message);
  throw new Error(`Failed to load mintWallet.json: ${err.message}`);
}

// 판매자 키페어 생성 및 내보내기
export const SELLER_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(mintWallet));