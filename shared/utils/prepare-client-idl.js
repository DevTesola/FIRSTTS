/**
 * Client IDL Preparation Utility
 * 
 * This utility ensures that any IDL used with Anchor clients has the necessary
 * properties like 'size' for accounts, which are required for correct operation.
 */

/**
 * Prepares an IDL for use with Anchor by ensuring all required properties are present
 * 
 * @param {Object} idl - The IDL to prepare
 * @returns {Object} - The prepared IDL with all necessary properties
 */
function prepareClientIdl(idl) {
  if (!idl) {
    console.error('No IDL provided');
    return idl;
  }

  // Create a deep copy to avoid mutating the original
  const preparedIdl = JSON.parse(JSON.stringify(idl));
  
  // Add size property to all accounts if missing
  if (preparedIdl.accounts && Array.isArray(preparedIdl.accounts)) {
    preparedIdl.accounts.forEach(account => {
      if (!account.size) {
        account.size = 1024; // Default size that works for most accounts
        console.info(`Added default size 1024 to account ${account.name}`);
      }
    });
  }
  
  return preparedIdl;
}

/**
 * Helper function to create an Anchor Program with a prepared IDL
 * 
 * @param {Object} idl - The original IDL
 * @param {PublicKey} programId - The program ID
 * @param {Provider} provider - The Anchor provider
 * @returns {Program} - The Anchor Program instance
 */
function createProgramWithPreparedIdl(idl, programId, provider) {
  // This would be imported from @project-serum/anchor in actual use
  const { Program } = require('@project-serum/anchor');
  
  // Prepare the IDL for Anchor
  const preparedIdl = prepareClientIdl(idl);
  
  // Create and return the program
  return new Program(preparedIdl, programId, provider);
}

module.exports = {
  prepareClientIdl,
  createProgramWithPreparedIdl
};