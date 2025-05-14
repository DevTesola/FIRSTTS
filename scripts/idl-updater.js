/**
 * IDL Updater Script
 * 
 * This script updates the NFT staking IDL file to make it fully compatible with client code
 * and the on-chain program. It adds missing 'size' attributes to all accounts and 
 * ensures proper discriminator mappings.
 */

const fs = require('fs');
const path = require('path');
const { prepareIdlForAnchor } = require('../shared/utils/idl-helper');

// Path configuration
const IDL_DIR = path.join(__dirname, '..', 'idl');
const SOURCE_IDL_PATH = path.join(IDL_DIR, 'nft_staking.json');
const BACKUP_IDL_PATH = path.join(IDL_DIR, 'backup', 'nft_staking_updated.json');
const OUTPUT_IDL_PATH = path.join(IDL_DIR, 'nft_staking_enhanced.json');

// Function to generate account size based on fields
function calculateAccountSize(account) {
  console.log(`Calculating size for account: ${account.name}`);
  
  // Default size if we can't calculate from fields
  const DEFAULT_SIZE = 1024;
  
  // All Anchor accounts have an 8-byte discriminator
  let size = 8;
  
  // If account has fields, add up the field sizes
  if (account.type && account.type.fields && Array.isArray(account.type.fields)) {
    account.type.fields.forEach(field => {
      // Calculate field size based on type
      let fieldSize = 0;
      
      if (field.type === 'pubkey') {
        fieldSize = 32; // PublicKey is 32 bytes
      } else if (['u8', 'i8', 'bool'].includes(field.type)) {
        fieldSize = 1; // 1 byte
      } else if (['u16', 'i16'].includes(field.type)) {
        fieldSize = 2; // 2 bytes
      } else if (['u32', 'i32', 'f32'].includes(field.type)) {
        fieldSize = 4; // 4 bytes
      } else if (['u64', 'i64', 'f64'].includes(field.type)) {
        fieldSize = 8; // 8 bytes
      } else if (field.type === 'string') {
        fieldSize = 100; // Arbitrary size for string
      } else if (field.type === 'bytes') {
        fieldSize = 100; // Arbitrary size for bytes
      } else if (typeof field.type === 'object' && field.type.vec) {
        // Vector has 4-byte length prefix + arbitrary content
        fieldSize = 104; // 4 + 100 arbitrary bytes
      } else {
        fieldSize = 32; // Default for other types
      }
      
      size += fieldSize;
      console.log(`  Field: ${field.name}, type: ${JSON.stringify(field.type)}, size: ${fieldSize}`);
    });
    
    // Add 25% padding for alignment requirements
    size = Math.ceil(size * 1.25);
    console.log(`  Total calculated size with padding: ${size}`);
    return size;
  }
  
  console.log(`  Using default size: ${DEFAULT_SIZE}`);
  return DEFAULT_SIZE;
}

// Function to add sizes to all accounts
function addSizesToAccounts(idl) {
  console.log('Adding account sizes...');
  
  if (!idl.accounts || !Array.isArray(idl.accounts)) {
    console.warn('No accounts found in IDL');
    return idl;
  }
  
  // Deep copy IDL to avoid modifying original
  const updatedIdl = JSON.parse(JSON.stringify(idl));
  
  // Process each account
  updatedIdl.accounts.forEach(account => {
    if (!account.size) {
      account.size = calculateAccountSize(account);
      console.log(`Added size ${account.size} to account ${account.name}`);
    } else {
      console.log(`Account ${account.name} already has size: ${account.size}`);
    }
  });
  
  return updatedIdl;
}

// Function to validate the IDL
function validateIdl(idl) {
  console.log('Validating IDL...');
  
  const issues = [];
  
  // Check for accounts without size
  if (idl.accounts && Array.isArray(idl.accounts)) {
    idl.accounts.forEach(account => {
      if (!account.size) {
        issues.push(`Account ${account.name} is missing size attribute`);
      }
    });
  }
  
  // Check for instructions without discriminator
  if (idl.instructions && Array.isArray(idl.instructions)) {
    idl.instructions.forEach(instr => {
      if (!instr.discriminator) {
        issues.push(`Instruction ${instr.name} is missing discriminator`);
      }
    });
  }
  
  // Report validation results
  if (issues.length > 0) {
    console.warn('IDL validation found issues:');
    issues.forEach(issue => console.warn(`- ${issue}`));
  } else {
    console.log('IDL validation passed!');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Main function
async function main() {
  try {
    console.log('========== IDL Updater Script ==========');
    console.log(`Source IDL: ${SOURCE_IDL_PATH}`);
    console.log(`Output IDL: ${OUTPUT_IDL_PATH}`);
    
    // Read source IDL
    console.log('\nReading source IDL...');
    const sourceIdlContent = fs.readFileSync(SOURCE_IDL_PATH, 'utf8');
    const sourceIdl = JSON.parse(sourceIdlContent);
    console.log(`Source IDL loaded: ${sourceIdl.metadata.name} v${sourceIdl.metadata.version}`);
    
    // Apply IDL enhancements
    console.log('\nEnhancing IDL...');
    let enhancedIdl = addSizesToAccounts(sourceIdl);
    
    // Apply further preparations with helper function
    enhancedIdl = prepareIdlForAnchor(enhancedIdl);
    
    // Validate the enhanced IDL
    console.log('\nValidating enhanced IDL...');
    const validation = validateIdl(enhancedIdl);
    
    // Save the enhanced IDL
    console.log('\nSaving enhanced IDL...');
    fs.writeFileSync(OUTPUT_IDL_PATH, JSON.stringify(enhancedIdl, null, 2));
    
    console.log(`\nIDL enhancement complete! Output saved to: ${OUTPUT_IDL_PATH}`);
    
    if (!validation.valid) {
      console.warn('\nWarning: The enhanced IDL has some issues that should be addressed.');
    }
    
  } catch (error) {
    console.error('Error updating IDL:', error);
    process.exit(1);
  }
}

// Run the script
main();