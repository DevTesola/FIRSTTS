/**
 * Fix Import Issues Script
 * 
 * This script fixes import-related issues in the staking API files
 * to ensure consistent module loading patterns and fix "g is not a function" errors.
 */

const fs = require('fs');
const path = require('path');

// Paths to fix
const API_DIR = path.join(__dirname, '..', 'pages', 'api', 'staking');
const FILES_TO_FIX = [
  'prepareStaking.js',
  'prepareStaking_v2.js',
  'prepareStaking_v3.js',
  'prepareUnstaking.js',
  'prepareUnstaking_v3.js',
  'completeStaking.js',
  'completeUnstaking.js',
  'completeClaimRewards.js',
  'initializeTokenAccount.js'
];

// Regular expressions for finding/replacing problematic patterns
const PATTERNS = [
  // Replace require statements for token-validator with imports
  {
    find: /const\s*{\s*validateTokenAccount,\s*checkReinitializationNeeded\s*}\s*=\s*require\(['"]\.\.\/.+\/token-validator['"]\);/g,
    replace: `import { validateTokenAccount, checkReinitializationNeeded } from '../../../shared/utils/token-validator';`
  },
  // Replace require statements for transaction-utils with imports
  {
    find: /const\s*{\s*createTokenAccountInstruction\s*(?:,\s*[^}]+)?\s*}\s*=\s*require\(['"]\.\.\/.+\/transaction-utils['"]\);/g,
    replace: `import { createTokenAccountInstruction } from '../../../shared/utils/transaction';`
  },
  // Replace require statements for transaction with imports
  {
    find: /const\s*{\s*createSerializedTransaction\s*(?:,\s*[^}]+)?\s*}\s*=\s*require\(['"]\.\.\/.+\/transaction['"]\);/g,
    replace: `import { createSerializedTransaction } from '../../../shared/utils/transaction';`
  },
  // Fix uninitialized blockhash variable
  {
    find: /userTokenAccount, blockhash, lastValidBlockHeight/g,
    replace: `userTokenAccount, connection, wallet`
  },
  // Fix uninitialized blockhash variable in error response
  {
    find: /errorCode: reinitInfo\.reason,\s+reinitTransactionBase64: initTx,\s+userTokenAccount: validationResult\.userTokenAccount\.toString\(\),\s+diagnosticInfo: validationResult\.diagnosticInfo,\s+blockhash,\s+lastValidBlockHeight/g,
    replace: `errorCode: reinitInfo.reason,
              reinitTransactionBase64: initTx,
              userTokenAccount: validationResult.userTokenAccount.toString(),
              diagnosticInfo: validationResult.diagnosticInfo`
  }
];

// Function to process a file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply pattern replacements
    PATTERNS.forEach(pattern => {
      const originalContent = content;
      content = content.replace(pattern.find, pattern.replace);
      
      if (originalContent !== content) {
        console.log(`  - Applied pattern: ${pattern.find}`);
      }
    });
    
    // Fix specific issue with uninitialized variables by adding proper error handling
    if (content.includes('blockhash, lastValidBlockHeight')) {
      console.log('  - Adding proper blockhash handling');
      
      const blockhashFix = `
    // Get latest blockhash for transaction
    const blockHashData = await connection.getLatestBlockhash('confirmed');
    const blockhash = blockHashData.blockhash;
    const lastValidBlockHeight = blockHashData.lastValidBlockHeight;`;
      
      // Find position to insert the fix - typically after connection creation
      const connectionCreationIndex = content.indexOf('const connection = new Connection');
      
      if (connectionCreationIndex > 0) {
        // Find the next newline after connection creation
        const insertPosition = content.indexOf('\n', connectionCreationIndex);
        
        if (insertPosition > 0) {
          content = content.slice(0, insertPosition + 1) + blockhashFix + content.slice(insertPosition + 1);
        }
      }
    }
    
    // Write the updated content
    fs.writeFileSync(filePath, content);
    console.log(`  - Successfully updated file`);
    
  } catch (error) {
    console.error(`  - Error processing file: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('========== Fix Import Issues Script ==========');
  
  // Process each file
  for (const fileName of FILES_TO_FIX) {
    const filePath = path.join(API_DIR, fileName);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      processFile(filePath);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  }
  
  console.log('\nImport issues fixed!');
}

// Run the script
main();