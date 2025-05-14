/**
 * Generate Complete IDL Script
 * 
 * This script creates a complete and compatible IDL by combining the main IDL file
 * with the backup file, ensuring all necessary properties are included for Anchor
 * compatibility.
 */

const fs = require('fs');
const path = require('path');
const { prepareIdlForAnchor } = require('../shared/utils/idl-helper');

// Paths to the IDL files
const MAIN_IDL_PATH = path.join(__dirname, 'nft_staking.json');
const BACKUP_IDL_PATH = path.join(__dirname, 'backup', 'nft_staking_updated.json');
const OUTPUT_PATH = path.join(__dirname, 'nft_staking_complete.json');

/**
 * Merges two IDL files, taking the most complete parts from each
 * 
 * @param {Object} primaryIdl - The primary IDL object
 * @param {Object} secondaryIdl - The secondary IDL object to merge in
 * @returns {Object} - The merged IDL
 */
function mergeIdls(primaryIdl, secondaryIdl) {
  // Create a deep copy of the primary IDL
  const mergedIdl = JSON.parse(JSON.stringify(primaryIdl));
  
  // Keep track of what we've already merged
  const instructionNames = new Set(mergedIdl.instructions.map(instr => instr.name));
  const accountNames = new Set(mergedIdl.accounts.map(acct => acct.name));
  const typeNames = new Set((mergedIdl.types || []).map(type => type.name));
  const errorNames = new Set((mergedIdl.errors || []).map(err => err.name));
  
  // Merge instructions from secondary IDL that don't exist in primary
  if (secondaryIdl.instructions) {
    secondaryIdl.instructions.forEach(instruction => {
      if (!instructionNames.has(instruction.name)) {
        mergedIdl.instructions.push(instruction);
        console.log(`Added instruction: ${instruction.name} from secondary IDL`);
      }
    });
  }
  
  // Merge accounts from secondary IDL that don't exist in primary
  if (secondaryIdl.accounts) {
    secondaryIdl.accounts.forEach(account => {
      if (!accountNames.has(account.name)) {
        mergedIdl.accounts.push(account);
        console.log(`Added account: ${account.name} from secondary IDL`);
      }
    });
  }
  
  // Merge types from secondary IDL that don't exist in primary
  if (secondaryIdl.types) {
    if (!mergedIdl.types) {
      mergedIdl.types = [];
    }
    
    secondaryIdl.types.forEach(type => {
      if (!typeNames.has(type.name)) {
        mergedIdl.types.push(type);
        console.log(`Added type: ${type.name} from secondary IDL`);
      }
    });
  }
  
  // Merge errors from secondary IDL that don't exist in primary
  if (secondaryIdl.errors) {
    if (!mergedIdl.errors) {
      mergedIdl.errors = [];
    }
    
    secondaryIdl.errors.forEach(error => {
      if (!errorNames.has(error.name)) {
        // Remap error codes if needed (primary uses 12000+ range, secondary uses 6000+ range)
        if (error.code && error.code < 10000) {
          const oldCode = error.code;
          error.code = error.code + 12000; // Shift to 12000+ range 
          console.log(`Remapped error code from ${oldCode} to ${error.code} for error: ${error.name}`);
        }
        mergedIdl.errors.push(error);
        console.log(`Added error: ${error.name} from secondary IDL`);
      }
    });
  }
  
  // Make sure all necessary properties exist
  if (!mergedIdl.metadata) {
    mergedIdl.metadata = secondaryIdl.metadata || {
      name: "nft_staking_fixed",
      version: "0.1.0",
      spec: "0.1.0",
      description: "Created with Anchor"
    };
  }
  
  return mergedIdl;
}

/**
 * Main function to run the script
 */
function main() {
  try {
    // Load both IDL files
    console.log('Loading IDL files...');
    const mainIdl = JSON.parse(fs.readFileSync(MAIN_IDL_PATH, 'utf8'));
    const backupIdl = JSON.parse(fs.readFileSync(BACKUP_IDL_PATH, 'utf8'));
    
    // Merge the IDLs
    console.log('Merging IDL files...');
    const mergedIdl = mergeIdls(mainIdl, backupIdl);
    
    // Prepare for Anchor by adding missing properties
    console.log('Preparing merged IDL for Anchor...');
    const completeIdl = prepareIdlForAnchor(mergedIdl);
    
    // Write the resulting IDL to file
    console.log(`Writing complete IDL to ${OUTPUT_PATH}...`);
    fs.writeFileSync(
      OUTPUT_PATH, 
      JSON.stringify(completeIdl, null, 2), 
      'utf8'
    );
    
    console.log('Complete IDL generation finished successfully!');
    
  } catch (error) {
    console.error('Error generating complete IDL:', error);
    process.exit(1);
  }
}

// Run the script
main();