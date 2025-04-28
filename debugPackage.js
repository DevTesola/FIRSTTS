import { config } from 'dotenv';
config({ path: './.env.development.local' });

import pkg from '@metaplex-foundation/mpl-token-metadata';

// Debug what's available in the package
console.log('Available exports in mpl-token-metadata:', Object.keys(pkg));

// Also look at nested objects if any
Object.keys(pkg).forEach(key => {
  const value = pkg[key];
  if (typeof value === 'object' && value !== null) {
    console.log(`Contents of ${key}:`, Object.keys(value));
  } else if (typeof value === 'function') {
    console.log(`Function: ${key}`);
  }
});