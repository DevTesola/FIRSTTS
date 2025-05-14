/**
 * Account Initialization Utility Functions
 * Helper functions for initializing accounts needed for NFT staking
 */

const { Transaction, PublicKey, sendAndConfirmTransaction } = require('@solana/web3.js');
const { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} = require('@solana/spl-token');
const { findUserStakingInfoPDA, PROGRAM_ID } = require('../constants');
const { web3 } = require('@project-serum/anchor');

/**
 * Initializes all accounts required for NFT staking in a single transaction
 * 
 * @param {Connection} connection - Solana connection instance
 * @param {Keypair} payer - Transaction fee payer (must be a Keypair for signing)
 * @param {PublicKey} userWallet - The user's wallet public key (owner of NFT)
 * @param {PublicKey} nftMint - The NFT mint address
 * @param {PublicKey} escrowAuthority - The escrow authority PDA
 * @param {PublicKey} userStakingInfo - The user staking info PDA (optional)
 * @param {Program} program - The Anchor program instance (optional, for userStakingInfo init)
 * @returns {Promise<{txSignature: string, accounts: object}>} Transaction signature and initialized account addresses
 */
async function initializeAllStakingAccounts(
  connection, 
  payer, 
  userWallet, 
  nftMint, 
  escrowAuthority,
  userStakingInfo, 
  program
) {
  const transaction = new Transaction();
  const accounts = {};
  
  // 1. Initialize User Token Account if needed
  const userTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    userWallet
  );
  
  accounts.userTokenAccount = userTokenAccount.toString();
  
  const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
  
  if (!userTokenAccountInfo) {
    console.log('Initializing user token account:', userTokenAccount.toString());
    
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey, // payer
        userTokenAccount, // ATA
        userWallet, // owner
        nftMint // mint
      )
    );
  }
  
  // 2. Initialize Escrow Token Account if needed
  const escrowTokenAccount = await getAssociatedTokenAddress(
    nftMint,
    escrowAuthority,
    true // allowOwnerOffCurve
  );
  
  accounts.escrowTokenAccount = escrowTokenAccount.toString();
  
  const escrowTokenAccountInfo = await connection.getAccountInfo(escrowTokenAccount);
  
  if (!escrowTokenAccountInfo) {
    console.log('Initializing escrow token account:', escrowTokenAccount.toString());
    
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey, // payer
        escrowTokenAccount, // ATA
        escrowAuthority, // owner
        nftMint // mint
      )
    );
  }
  
  // 3. Initialize User Staking Info account if needed and if program provided
  if (userStakingInfo && program) {
    const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfo);
    
    if (!userStakingInfoAccount) {
      console.log('Initializing user staking info account:', userStakingInfo.toString());
      
      const initUserStakingTx = await program.methods
        .initUserStakingInfo()
        .accounts({
          user: userWallet,
          userStakingInfo: userStakingInfo,
          systemProgram: web3.SystemProgram.programId
        })
        .transaction();
      
      transaction.add(initUserStakingTx);
    }
    
    accounts.userStakingInfo = userStakingInfo.toString();
  }
  
  // If there are no instructions, no need to send transaction
  if (transaction.instructions.length === 0) {
    console.log('All required accounts are already initialized');
    return { txSignature: null, accounts };
  }
  
  // Get recent blockhash and send transaction
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;
  
  // Send and confirm transaction
  const txSignature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  console.log('Account initialization transaction sent:', txSignature);
  
  return { txSignature, accounts };
}

/**
 * Initializes a user token account for an NFT
 * 
 * @param {Connection} connection - Solana connection instance
 * @param {Keypair} payer - Transaction fee payer
 * @param {PublicKey} owner - The owner of the token account
 * @param {PublicKey} mint - The mint address of the token
 * @returns {Promise<{address: PublicKey, signature: string}>} The token account address and transaction signature
 */
async function initializeTokenAccount(connection, payer, owner, mint) {
  // Get the associated token account address
  const tokenAccount = await getAssociatedTokenAddress(
    mint,
    owner
  );
  
  // Check if the token account already exists
  const accountInfo = await connection.getAccountInfo(tokenAccount);
  
  if (accountInfo) {
    return { address: tokenAccount, signature: null };
  }
  
  // Create the transaction with the create associated token account instruction
  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey, // payer
      tokenAccount, // associated token account
      owner, // owner
      mint // mint
    )
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;
  
  // Sign and send the transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
  
  return { address: tokenAccount, signature };
}

/**
 * Initializes a user staking info account
 * 
 * @param {Connection} connection - Solana connection instance
 * @param {Program} program - Anchor program instance
 * @param {Keypair} payer - Transaction fee payer
 * @param {PublicKey} owner - The user's wallet public key
 * @returns {Promise<{address: PublicKey, signature: string}>} The user staking info account address and transaction signature
 */
async function initializeUserStakingInfo(connection, program, payer, owner) {
  // Derive the user staking info PDA
  const [userStakingInfoPDA] = findUserStakingInfoPDA(owner);
  
  // Check if the user staking info account already exists
  const accountInfo = await connection.getAccountInfo(userStakingInfoPDA);
  
  if (accountInfo) {
    return { address: userStakingInfoPDA, signature: null };
  }
  
  // Create the transaction with the init user staking info instruction
  const transaction = await program.methods
    .initUserStakingInfo()
    .accounts({
      user: owner,
      userStakingInfo: userStakingInfoPDA,
      systemProgram: web3.SystemProgram.programId
    })
    .transaction();
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;
  
  // Sign and send the transaction
  const signature = await sendAndConfirmTransaction(
    connection, 
    transaction, 
    [payer]
  );
  
  return { address: userStakingInfoPDA, signature };
}

/**
 * Verifies if all accounts needed for staking are properly initialized
 * 
 * @param {Connection} connection - Solana connection instance
 * @param {PublicKey} walletPubkey - The wallet public key
 * @param {PublicKey} mintPubkey - The NFT mint public key
 * @param {PublicKey} escrowAuthorityPDA - The escrow authority PDA
 * @param {PublicKey} userStakingInfoPDA - The user staking info PDA
 * @returns {Promise<{isReady: boolean, missingAccounts: string[], accounts: object}>} 
 */
async function verifyStakingAccountsReady(
  connection,
  walletPubkey,
  mintPubkey,
  escrowAuthorityPDA,
  userStakingInfoPDA
) {
  const missingAccounts = [];
  const accounts = {};
  
  // 1. Verify User Token Account
  const userTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    walletPubkey
  );
  
  accounts.userTokenAccount = userTokenAccount.toString();
  
  const userTokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
  
  if (!userTokenAccountInfo || 
      userTokenAccountInfo.data.length < 165 || 
      !userTokenAccountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    missingAccounts.push('userTokenAccount');
  }
  
  // 2. Verify Escrow Token Account
  const escrowTokenAccount = await getAssociatedTokenAddress(
    mintPubkey,
    escrowAuthorityPDA,
    true // allowOwnerOffCurve
  );
  
  accounts.escrowTokenAccount = escrowTokenAccount.toString();
  
  const escrowTokenAccountInfo = await connection.getAccountInfo(escrowTokenAccount);
  
  if (!escrowTokenAccountInfo) {
    missingAccounts.push('escrowTokenAccount');
  }
  
  // 3. Verify User Staking Info Account
  const userStakingInfoAccount = await connection.getAccountInfo(userStakingInfoPDA);
  
  accounts.userStakingInfo = userStakingInfoPDA.toString();
  
  if (!userStakingInfoAccount || 
      !userStakingInfoAccount.owner.equals(new PublicKey(PROGRAM_ID))) {
    missingAccounts.push('userStakingInfo');
  }
  
  return { 
    isReady: missingAccounts.length === 0,
    missingAccounts,
    accounts
  };
}

module.exports = {
  initializeAllStakingAccounts,
  initializeTokenAccount,
  initializeUserStakingInfo,
  verifyStakingAccountsReady
};