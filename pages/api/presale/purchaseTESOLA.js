import { PublicKey, SystemProgram, Transaction, Connection } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { validateSolanaAddress } from '../../../api-middlewares/apiSecurity';
import { v4 as uuidv4 } from 'uuid';
import { SELLER_KEYPAIR } from '../../../server/utils/sellerKeypair';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

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
    
    // 수량을 숫자로 확실하게 변환
    const tokenAmount = parseInt(amount);
    
    // Validate address
    if (typeof validateSolanaAddress === 'function') {
      const validation = validateSolanaAddress(wallet);
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }
    }
    
    // Create PublicKey object from wallet address
    const buyerPublicKey = new PublicKey(wallet);
    
    // Create Solana connection
    const connection = new Connection(SOLANA_RPC_ENDPOINT);
    
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
    
    // 남은 물량 확인
    const totalSupply = parseInt(presaleSettings.total_supply);
    
    // 모든 판매 내역을 가져와서 직접 합산
    const { data: allSales, error: salesError } = await supabase
      .from('minted_nfts')
      .select('token_amount')
      .eq('is_presale', true)
      .or('status.eq.completed,status.eq.pending');
      
    if (salesError) {
      console.error('Error calculating sold amount:', salesError);
      return res.status(500).json({ error: 'Error calculating sold amount' });
    }
    
    // 직접 합산 계산
    const soldAmount = allSales ? allSales.reduce((sum, item) => sum + (parseInt(item.token_amount) || 0), 0) : 0;
    const remainingAmount = totalSupply - soldAmount;
    
    if (tokenAmount > remainingAmount) {
      return res.status(403).json({ 
        error: `Not enough tokens available. Only ${remainingAmount.toLocaleString()} tokens remaining.` 
      });
    }
    
    // Calculate cost in SOL
    const tokenPrice = parseFloat(presaleSettings.price_sol);
    const totalCost = tokenAmount * tokenPrice;
    
    // Check minimum purchase requirement
    if (presaleSettings.min_sol && totalCost < presaleSettings.min_sol) {
      return res.status(403).json({ 
        error: `Minimum purchase amount is ${presaleSettings.min_sol} SOL (${Math.ceil(presaleSettings.min_sol / tokenPrice).toLocaleString()} tokens)` 
      });
    }
    
    // Check if wallet has a special tier based on NFT ownership
    let walletTier = null;
    let maxPurchaseSol = presaleSettings.max_sol || 0.5; // Default max if not specified
    let exchangeRate = 200000; // Default exchange rate: 200,000 TESOLA per SOL
    
    try {
      // Get wallet's tier information 
      const { data: whitelistData } = await supabase
        .from('presale_whitelist')
        .select('tier_id')
        .eq('wallet_address', wallet)
        .single();
      
      if (whitelistData && whitelistData.tier_id) {
        // Get tier details
        const { data: tierData } = await supabase
          .from('presale_tiers')
          .select('*')
          .eq('tier_id', whitelistData.tier_id)
          .single();
        
        if (tierData) {
          walletTier = tierData;
          maxPurchaseSol = tierData.max_sol;
          exchangeRate = tierData.exchange_rate;
          
          console.log(`Wallet has ${tierData.tier_name} tier with max ${maxPurchaseSol} SOL and exchange rate ${exchangeRate}`);
        }
      }
    } catch (tierError) {
      console.error("Error getting tier info:", tierError);
      // Continue with default limits if we can't get tier info
    }
    
    // Check user's purchase history to enforce tier limits
    const { data: userPurchases, error: historyError } = await supabase
      .from('minted_nfts')
      .select('token_amount, presale_price')
      .eq('wallet', wallet)
      .eq('is_presale', true)
      .or('status.eq.completed,status.eq.pending');
    
    if (!historyError && userPurchases && userPurchases.length > 0) {
      // Calculate how much they've already spent in SOL
      const totalSolSpent = userPurchases.reduce((total, purchase) => {
        return total + (
          purchase.token_amount * (purchase.presale_price || tokenPrice)
        );
      }, 0);
      
      // Check if this purchase would exceed their tier limit
      if (totalSolSpent + totalCost > maxPurchaseSol) {
        const remainingSol = Math.max(0, maxPurchaseSol - totalSolSpent);
        const remainingTokens = Math.floor(remainingSol / tokenPrice);
        
        if (remainingSol <= 0) {
          return res.status(403).json({
            error: `You have reached your maximum purchase limit of ${maxPurchaseSol} SOL for your tier.`
          });
        }
        
        return res.status(403).json({
          error: `This purchase would exceed your tier limit. You can purchase up to ${remainingTokens.toLocaleString()} more tokens (${remainingSol.toFixed(4)} SOL).`
        });
      }
    }
    
    // Check global maximum purchase limit if no tier-specific limit applies
    if (!walletTier && presaleSettings.max_sol && totalCost > presaleSettings.max_sol) {
      return res.status(403).json({ 
        error: `Maximum purchase amount is ${presaleSettings.max_sol} SOL (${Math.floor(presaleSettings.max_sol / tokenPrice).toLocaleString()} tokens)` 
      });
    }
    
    // Generate unique payment ID
    const paymentId = uuidv4();
    
    // Store pending purchase record
    const { data: insertData, error: insertError } = await supabase
      .from('minted_nfts')
      .insert({
        wallet: wallet,
        status: 'pending',
        is_presale: true,
        presale_price: tokenPrice,
        token_amount: tokenAmount,
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (insertError) {
      console.error('Error creating pending purchase record:', insertError);
      return res.status(500).json({ error: 'Failed to create purchase record' });
    }
    
    console.log('Created pending purchase record:', insertData);
    
    // Create a transaction for SOL transfer
    let transferTx = new Transaction();
    
    // 1. 트랜잭션에 최근 블록해시 설정 (중요!)
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transferTx.recentBlockhash = blockhash;
    transferTx.feePayer = buyerPublicKey;
    
    // 2. 트랜잭션에 전송 명령 추가
    transferTx.add(
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
      tokenAmount: tokenAmount,
      totalCost: totalCost
    });
    
  } catch (err) {
    console.error('Purchase TESOLA API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}