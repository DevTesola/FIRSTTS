/**
 * Services index
 * 
 * Central export point for all application services.
 * This allows for easy imports of services throughout the application.
 */

// Import all services
import api, { endpoints } from './api';
import nftService from './nftService';
import stakingService from './stakingService';
import walletService from './walletService';

// Note: The notificationService is commented out to avoid conflicts with existing components
// import notificationService, { 
//   useNotifications, 
//   NotificationProvider, 
//   NOTIFICATION_TYPES 
// } from './notificationService';

// Export individual services
export {
  // API service
  api,
  endpoints,
  
  // NFT service
  nftService,
  
  // Staking service
  stakingService,
  
  // Wallet service
  walletService,
  
  // Notification service is temporarily disabled to avoid conflicts
  // notificationService,
  // useNotifications,
  // NotificationProvider,
  // NOTIFICATION_TYPES
};

// Default export for all services
export default {
  api,
  endpoints,
  nftService,
  stakingService,
  walletService,
  // notificationService
};