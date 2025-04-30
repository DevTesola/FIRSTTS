import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up mint wallet path from environment variable
const mintWalletPath = process.env.MINT_WALLET_PATH
  ? path.resolve(process.env.MINT_WALLET_PATH)
  : path.join(__dirname, '../../mintWallet.json');

// Log path only in development AND only if explicitly enabled
const shouldLog = process.env.NODE_ENV === 'development' && process.env.LOG_SENSITIVE_INFO === 'true';

if (shouldLog) {
  console.log('Loading mintWallet.json from:', mintWalletPath);
}

let mintWallet;
try {
  // Check if file exists
  if (!fs.existsSync(mintWalletPath)) {
    throw new Error(`Wallet file not found. Please check configuration.`);
  }
  
  // Read wallet file
  const rawData = fs.readFileSync(mintWalletPath, 'utf8');
  mintWallet = JSON.parse(rawData);

  // Support multiple formats
  if (Array.isArray(mintWallet)) {
    if (mintWallet.length !== 64) {
      throw new Error(`Invalid secret key length`);
    }
  } else if (mintWallet.secretKey) {
    mintWallet = mintWallet.secretKey;
    if (!Array.isArray(mintWallet) || mintWallet.length !== 64) {
      throw new Error(`Invalid secret key format`);
    }
  } else {
    throw new Error('Invalid wallet format');
  }

  // Validate key (logs in development environment only if explicitly enabled)
  const secretKey = Uint8Array.from(mintWallet);
  if (shouldLog) {
    console.log('Secret key length:', secretKey.length);
    const keypair = Keypair.fromSecretKey(secretKey);
    console.log('Generated public key:', keypair.publicKey.toBase58());
  }
} catch (err) {
  console.error('Failed to load wallet file:', err.message);
  throw new Error(`Failed to load wallet configuration`);
}

// Create and export seller keypair
export const SELLER_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(mintWallet));