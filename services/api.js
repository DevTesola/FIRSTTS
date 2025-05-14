/**
 * API Service
 * 
 * Centralized API interaction layer that abstracts HTTP requests
 * from the component layer. This service handles all API calls
 * with proper error handling and standardized responses.
 */

/**
 * Default request options with credentials and headers
 */
const defaultOptions = {
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Handle API error responses
 * 
 * @param {Response} response - Fetch Response object 
 * @returns {Promise<Object>} - Error object with status and message
 */
async function handleErrorResponse(response) {
  let errorData = {
    status: response.status,
    message: response.statusText || 'Unknown error'
  };

  try {
    // Try to parse error data from response
    const data = await response.json();
    if (data.error) {
      errorData.message = data.error;
    }
    if (data.details) {
      errorData.details = data.details;
    }
  } catch (e) {
    // If parsing fails, use statusText
    console.warn('Failed to parse error response:', e);
  }

  const error = new Error(errorData.message);
  error.status = errorData.status;
  error.details = errorData.details;
  
  throw error;
}

/**
 * Make an API request with standardized error handling
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(url, options = {}) {
  try {
    // Merge default options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    // If body is an object, stringify it
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    // Make the request
    const response = await fetch(url, requestOptions);

    // Handle HTTP errors
    if (!response.ok) {
      return handleErrorResponse(response);
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    // Parse response JSON
    return await response.json();
  } catch (error) {
    // Handle network errors
    if (!error.status) {
      error.status = 0;
      error.message = 'Network error. Please check your connection.';
    }
    throw error;
  }
}

/**
 * API client with methods for each HTTP verb
 */
export const api = {
  /**
   * Make a GET request
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  get: (url, options = {}) => 
    apiRequest(url, { ...options, method: 'GET' }),

  /**
   * Make a POST request
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  post: (url, data, options = {}) => 
    apiRequest(url, { ...options, method: 'POST', body: data }),

  /**
   * Make a PUT request
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  put: (url, data, options = {}) => 
    apiRequest(url, { ...options, method: 'PUT', body: data }),

  /**
   * Make a DELETE request
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  delete: (url, options = {}) => 
    apiRequest(url, { ...options, method: 'DELETE' }),

  /**
   * Make a PATCH request
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  patch: (url, data, options = {}) => 
    apiRequest(url, { ...options, method: 'PATCH', body: data }),
};

/**
 * API endpoints as constants
 */
export const endpoints = {
  // NFT Endpoints
  nft: {
    getMinted: '/api/getMintedCount',
    getMintPrice: '/api/getMintPrice',
    purchaseNFT: '/api/purchaseNFT',
    completeMinting: '/api/completeMinting',
    getNFTs: '/api/getNFTs',
    getAll: '/api/getNFTs?all=true',
  },

  // Staking Endpoints
  staking: {
    prepare: '/api/staking/prepareStaking',
    complete: '/api/staking/completeStaking',
    prepareUnstaking: '/api/staking/prepareUnstaking',
    completeUnstaking: '/api/staking/completeUnstaking',
    prepareEmergencyUnstaking: '/api/staking/prepareEmergencyUnstaking',
    completeEmergencyUnstaking: '/api/staking/completeEmergencyUnstaking',
    getInfo: '/api/staking/getStakingInfo',
    getStats: '/api/staking/getStakingStats',
    getNFTs: '/api/staking/getStakingNFTs',
    getUserNFTs: '/api/staking/getUserNFTs',
    initializeTokenAccount: '/api/staking/initializeTokenAccount',
  },

  // Rewards Endpoints
  rewards: {
    getRewards: '/api/staking/getRewards',
    claimRewards: '/api/staking/claimRewards',
    prepareClaimRewards: '/api/staking/prepareClaimRewards',
    completeClaimRewards: '/api/staking/completeClaimRewards',
    recordTweet: '/api/recordTweetReward',
    recordShare: '/api/recordSocialShare',
  },
  
  // Referral Endpoints
  referral: {
    generateCode: '/api/referral/generateCode',
    registerReferral: '/api/referral/registerReferral',
    claimReferralRewards: '/api/referral/claimRewards',
    getReferralStats: '/api/referral/getStats',
  },
  
  // Social Verification Endpoints
  social: {
    initSocialActivity: '/api/social/initUserActivity',
    verifySocialActivity: '/api/social/verifyActivity',
    claimSocialReward: '/api/social/claimReward',
    getSocialStatus: '/api/social/getUserSocialStatus',
  },

  // Governance Endpoints
  governance: {
    getProposals: '/api/governance/getProposals',
    getUserVotingPower: '/api/governance/getUserVotingPower',
    prepareCreateProposal: '/api/governance/prepareCreateProposal',
    prepareVote: '/api/governance/prepareVote',
  },

  // Presale Endpoints
  presale: {
    checkWhitelist: '/api/presale/checkWhitelist',
    purchase: '/api/presale/purchaseTESOLA',
    complete: '/api/presale/completePresale',
    getStats: '/api/presale/getStats',
  },

  // Admin Endpoints
  admin: {
    logs: '/api/admin/logs',
    getPendingClaims: '/api/admin/getPendingClaims',
    processClaim: '/api/admin/processClaim',
    rewardSettings: '/api/admin/reward-settings',
    updateTierMultipliers: '/api/admin/update-tier-multipliers',
    checkPoolInfo: '/api/check-pool-info',
  },

  // Transaction Endpoints
  transaction: {
    getAll: '/api/getTransactions',
    requestRefund: '/api/requestRefund',
    submitTransaction: '/api/staking/submitTransaction',
  },

  // IPFS Endpoints
  ipfs: (cid) => `/api/ipfs/${cid}`,
};

export default api;