// Environment variable validator
export function validateEnvVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_PROGRAM_ID',
    'NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables in production');
    }
  }
  
  // Validate admin wallets format
  const adminWallets = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES;
  if (adminWallets) {
    const wallets = adminWallets.split(',').map(w => w.trim());
    const invalidWallets = wallets.filter(w => 
      w === '*' || 
      w.length === 0 || 
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w)
    );
    
    if (invalidWallets.length > 0) {
      console.error(`Invalid admin wallet addresses: ${invalidWallets.join(', ')}`);
      throw new Error('Invalid admin wallet configuration');
    }
  }
}