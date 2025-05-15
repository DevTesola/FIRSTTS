/**
 * pages/api/getStakingInfo.js - Redirection Implementation
 * 
 * This file redirects the legacy API endpoint '/api/getStakingInfo'
 * to the newer standardized location '/api/staking/getStakingInfo'.
 * 
 * Important: This endpoint is maintained for backward compatibility. All new code
 * should directly call '/api/staking/getStakingInfo'.
 * 
 * This redirection pattern prevents code duplication and maintains the single responsibility principle.
 */

import { sendSuccess, sendError, validateMethod, validateQuery } from "../../utils/apiResponses";
import { getSupabase } from "../../shared/utils/supabase";

/**
 * Redirection handler - forwards all requests to /api/staking/getStakingInfo
 */
export default async function handler(req, res) {
  console.log(`[API Redirect] /api/getStakingInfo -> /api/staking/getStakingInfo`);
  
  // 1. Validate method
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }
  
  // 2. Validate required query parameters
  if (!validateQuery(req, res, ['wallet', 'mintAddress'])) {
    return;
  }
  
  try {
    // 3. Initialize Supabase client (needed by the target handler)
    const supabase = getSupabase();
    
    // 4. Try to load and execute the target API handler
    try {
      // Dynamically import the target module
      const stakingInfoModule = require('./staking/getStakingInfo').default;
      
      // Execute the original handler with the same req and res objects
      // This maintains all functionality while eliminating code duplication
      return await stakingInfoModule(req, res);
    } catch (importError) {
      console.error(`[API Redirect] Failed to import API handler module:`, importError);
      
      // Return a clear error message if redirection fails
      return sendError(
        res, 
        'Staking info API redirection error', 
        500,
        'REDIRECT_ERROR',
        { 
          message: 'An error occurred while redirecting to the new API handler',
          originalError: importError.message,
          redirectTarget: '/api/staking/getStakingInfo'
        }
      );
    }
  } catch (error) {
    console.error('[API Redirect] getStakingInfo redirection error:', error);
    
    return sendError(
      res, 
      'Failed to retrieve staking information', 
      500, 
      'REDIRECT_ERROR', 
      error
    );
  }
}