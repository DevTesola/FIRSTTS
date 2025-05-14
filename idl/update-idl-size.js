/**
 * IDL Size Updater Script
 * 
 * This script updates the NFT staking IDL by adding the required 'size' attribute
 * to all accounts. The size attribute is required by Anchor for client programs
 * to correctly create account layouts.
 */

const fs = require('fs');
const path = require('path');

// Path to the IDL file
const IDL_PATH = path.join(__dirname, 'nft_staking.json');
const OUTPUT_PATH = path.join(__dirname, 'nft_staking_updated.json');

/**
 * Adds size property to all accounts in the IDL
 * 
 * @param {Object} idl - The IDL object to update
 * @returns {Object} - The updated IDL with size attributes
 */
function addSizeToAccounts(idl) {
  if (!idl || !idl.accounts || !Array.isArray(idl.accounts)) {
    console.warn('Invalid IDL format: missing accounts array');
    return idl;
  }

  // Create a deep copy of the IDL
  const updatedIdl = JSON.parse(JSON.stringify(idl));
  
  // Add size attribute to all accounts
  updatedIdl.accounts.forEach(account => {
    if (!account.size) {
      // Default size of 1024 bytes should be sufficient for most accounts
      // This is a safe default that will work for Anchor
      account.size = 1024;
      console.log(`Added default size 1024 to account ${account.name}`);
    }
  });
  
  return updatedIdl;
}

/**
 * Main function to run the script
 */
function main() {
  try {
    // Read the IDL file
    console.log(`Reading IDL from ${IDL_PATH}...`);
    const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
    
    // Update the IDL with size attributes
    console.log('Adding size attributes to accounts...');
    const updatedIdl = addSizeToAccounts(idl);
    
    // Write the updated IDL to file
    console.log(`Writing updated IDL to ${OUTPUT_PATH}...`);
    fs.writeFileSync(
      OUTPUT_PATH, 
      JSON.stringify(updatedIdl, null, 2), 
      'utf8'
    );
    
    console.log('IDL update completed successfully!');
    
  } catch (error) {
    console.error('Error updating IDL:', error);
    process.exit(1);
  }
}

// Run the script
main();