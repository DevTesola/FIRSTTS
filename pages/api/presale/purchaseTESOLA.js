import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { validateSolanaAddress } from '../../../middleware/apiSecurity';
import { v4 as uuidv4 } from 'uuid';
import { SELLER_KEYPAIR } from '../../../server/utils/sellerKeypair';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Seller wallet - derived from keypair
const SELLER_PUBLIC_KEY = SELLER_KEYPAIR.publicKey.toString();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Extract parameters from request
    const { wallet, amount } = req.body;
    
    // Input validation
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    if (!amount || isNaN(amount) || amount < 1000) {
      return res.status(400).json({ error: 'Invalid token amount. Minimum purchase is 1,000 TESOLA' });
    }
    
    // Validate address
    if (typeof validateSolanaAddress === 'function') {
      const validation = validateSolanaAddress(wallet);
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    // Create PublicKey object from wallet address
    const buyerPublicKey = new PublicKey(wallet);
    
    // Verify presale status and settings
    const { data: presaleSettings, error: settingsError } = await supabase
      .from('presale_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
      
    if (settingsError) {
      console.error('Error fetching presale settings:', settingsError);
      return res.status(500).json({ error: 'Error checking presale status' });
    }
    
    // Check if presale is active
    if (!presaleSettings.is_active) {
      return res.status(403).json({ error: 'Presale is not currently active' });
    }
    
    // Check presale time window
    const now = new Date();
    const startTime = new Date(presaleSettings.start_time);
    const endTime = new Date(presaleSettings.end_time);
    
    if (now < startTime) {
      return res.status(403).json({ 
        error: `Presale has not started yet. Starts at ${startTime.toISOString()}` 
      });
    }
    
    if (now > endTime) {
      return res.status(403).json({ 
        error: 'Presale has ended' 
      });
    }
    
    // Check whitelist if required
    if (presaleSettings.whitelist_only) {
      const { data: whitelistData, error: whitelistError } = await supabase
        .from('presale_whitelist')
        .select('*')
        .eq('wallet_address', wallet)
        .single();
        
      if (whitelistError || !whitelistData) {
        return res.status(403).json({ 
          error: 'Your wallet is not whitelisted for this presale' 
        });
      }
    }
    
    // Check max per wallet limit
    if (presaleSettings.max_per_wallet > 0) {
      const { data: userPurchases, error: purchasesError } = await supabase
        .from('minted_nfts')
        .select('sum(token_amount)')
        .eq('wallet', wallet)
        .eq('is_presale', true)
        .or('status.eq.completed,status.eq.pending');
        
      if (!purchasesError) {
        const currentTotal = parseInt(userPurchases[0]?.sum || 0);
        const newTotal = currentTotal + parseInt(amount);
        
        if (newTotal > presaleSettings.max_per_wallet) {
          return res.status(403).json({ 
            error: `Exceeds maximum tokens per wallet (${presaleSettings.max_per_wallet.toLocaleString()}). You've already purchased ${currentTotal.toLocaleString()} tokens.` 
          });
        }
      }
    }
    
    // Check remaining allocation
    const { data: availableData, error: availableError } = await supabase
      .from('presale_settings')
      .select('total_supply')
      .single();
      
    if (availableError) {
      console.error('Error checking available supply:', availableError);
      return res.status(500).json({ error: 'Error checking available tokens' });
    }
    
    const { data: soldData } = await supabase
      .from('minted_nfts')
      .select('sum(token_amount)')
      .eq('is_presale', true)
      .or('status.eq.completed,status.eq.pending');
      
    const totalSupply = availableData.total_supply;
    const soldAmount = parseInt(soldData[0]?.sum || 0);
    const remainingAmount = totalSupply - soldAmount;
    
    if (amount > remainingAmount) {
      return res.status(403).json({ 
        error: `Not enough tokens available. Only ${remainingAmount.toLocaleString()} tokens remaining.` 
      });
    }
    
    // Calculate cost in SOL
    const tokenPrice = presaleSettings.price_sol;
    const totalCost = amount * tokenPrice;
    
    // Check minimum purchase requirement
    if (presaleSettings.min_sol && totalCost < presaleSettings.min_sol) {
      return res.status(403).json({ 
        error: `Minimum purchase amount is ${presaleSettings.min_sol} SOL (${Math.ceil(presaleSettings.min_sol / tokenPrice).toLocaleString()} tokens)` 
      });
    }
    
    // Check maximum purchase limit
    if (presaleSettings.max_sol && totalCost > presaleSettings.max_sol) {
      return res.status(403).json({ 
        error: `Maximum purchase amount is ${presaleSettings.max_sol} SOL (${Math.floor(presaleSettings.max_sol / tokenPrice).toLocaleString()} tokens)` 
      });
    }
    
    // Generate unique payment ID
    const paymentId = uuidv4();
    
    // Store pending purchase record
    await supabase
      .from('minted_nfts')
      .insert({
        wallet: wallet,
        status: 'pending',
        is_presale: true,
        presale_price: tokenPrice,
        token_amount: amount,
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      });
      
    // Create a transaction for SOL transfer
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: buyerPublicKey,
        toPubkey: new PublicKey(SELLER_PUBLIC_KEY),
        lamports: Math.floor(totalCost * 1e9), // Convert SOL to lamports
      })
    );
    
    // Return transaction for client to sign
    return res.status(200).json({
      transaction: transferTx.serialize({ requireAllSignatures: false }).toString('base64'),
      paymentId: paymentId,
      tokenAmount: amount,
      totalCost: totalCost
    });
    
  } catch (err) {
    console.error('Purchase TESOLA API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}