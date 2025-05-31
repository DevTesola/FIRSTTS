import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log path only in development AND only if explicitly enabled
const shouldLog = process.env.NODE_ENV === 'development' && process.env.LOG_SENSITIVE_INFO === 'true';

let mintWallet;
try {
  // Try environment variable first (for Vercel deployment)
  if (process.env.SELLER_PRIVATE_KEY_BASE64) {
    if (shouldLog) {
      console.log('Loading wallet from environment variable (base64)');
    }
    
    const base64Key = process.env.SELLER_PRIVATE_KEY_BASE64;
    const buffer = Buffer.from(base64Key, 'base64');
    mintWallet = Array.from(buffer);
    
    if (mintWallet.length !== 64) {
      throw new Error(`Invalid secret key length from environment: ${mintWallet.length}`);
    }
  } else {
    // Fallback to file (for local development)
    const mintWalletPath = process.env.MINT_WALLET_PATH
      ? path.resolve(process.env.MINT_WALLET_PATH)
      : path.join(__dirname, '../../mintWallet.json');

    if (shouldLog) {
      console.log('Loading mintWallet.json from:', mintWalletPath);
    }

    // Check if file exists
    if (!fs.existsSync(mintWalletPath)) {
      throw new Error(`Wallet file not found and no environment variable set. Please check configuration.`);
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
  }

  // Validate key but NEVER log the secret key itself
  const secretKey = Uint8Array.from(mintWallet);
  
  // Create keypair to validate format
  const keypair = Keypair.fromSecretKey(secretKey);
  
  // Even in development mode with logging enabled, only log the public key
  if (shouldLog) {
    console.log('Secret key length:', secretKey.length);
    console.log('Generated public key:', keypair.publicKey.toBase58());
    console.log('WARNING: Never log or expose the actual secret key in any environment');
  }
} catch (err) {
  console.error('Failed to load wallet configuration:', err.message);
  throw new Error(`Failed to load wallet configuration`);
}

// Create and export seller keypair
export const SELLER_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(mintWallet));