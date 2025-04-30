import React from "react";

/**
 * Modern button components for the TESOLA ecosystem
 * Features sleek, contemporary design with multiple variants
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Button component
 */

// Primary button with gradient background
export const PrimaryButton = ({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  type = "button",
  icon = null,
  fullWidth = false,
  loading = false,
  size = "default", // "small", "default", "large"
  ...props 
}) => {
  // Configure size styles
  let sizeClasses = "px-5 py-2.5 text-sm";
  if (size === "small") sizeClasses = "px-4 py-2 text-xs";
  if (size === "large") sizeClasses = "px-6 py-3 text-base";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative group flex items-center justify-center font-medium rounded-lg
        transition-all duration-200
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${loading || disabled 
          ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/20 active:from-purple-700 active:to-pink-700'
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
      
      {/* Subtle hover animation */}
      {!disabled && !loading && (
        <span className="absolute inset-0 rounded-lg overflow-hidden">
          <span className="absolute inset-0 opacity-0 group-hover:opacity-20 group-active:opacity-30 bg-white transition-opacity"></span>
        </span>
      )}
    </button>
  );
};

// Secondary button with outline
export const SecondaryButton = ({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  type = "button",
  icon = null,
  fullWidth = false,
  loading = false,
  size = "default", // "small", "default", "large"
  ...props 
}) => {
  // Configure size styles
  let sizeClasses = "px-5 py-2.5 text-sm";
  if (size === "small") sizeClasses = "px-4 py-2 text-xs";
  if (size === "large") sizeClasses = "px-6 py-3 text-base";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative group flex items-center justify-center font-medium rounded-lg
        transition-all duration-200
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${loading || disabled 
          ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed' 
          : 'bg-transparent text-purple-400 border border-purple-500/50 hover:border-purple-400 hover:text-white hover:bg-purple-500/20 active:bg-purple-600/30'
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// Glass button with blur effect
export const GlassButton = ({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  type = "button",
  icon = null,
  fullWidth = false,
  loading = false,
  size = "default", // "small", "default", "large"
  ...props 
}) => {
  // Configure size styles
  let sizeClasses = "px-5 py-2.5 text-sm";
  if (size === "small") sizeClasses = "px-4 py-2 text-xs";
  if (size === "large") sizeClasses = "px-6 py-3 text-base";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative group flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 backdrop-blur-sm
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${loading || disabled 
          ? 'bg-black/30 text-gray-400 border border-gray-700/50 cursor-not-allowed' 
          : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 active:bg-white/30'
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// Accent button with bright colors
export const AccentButton = ({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  type = "button",
  icon = null,
  fullWidth = false,
  loading = false,
  size = "default", // "small", "default", "large"
  variant = "blue", // "blue", "green", "yellow", "red"
  ...props 
}) => {
  // Configure size styles
  let sizeClasses = "px-5 py-2.5 text-sm";
  if (size === "small") sizeClasses = "px-4 py-2 text-xs";
  if (size === "large") sizeClasses = "px-6 py-3 text-base";

  // Configure color variants
  let colorClasses = "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500";
  if (variant === "green") colorClasses = "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500";
  if (variant === "yellow") colorClasses = "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400";
  if (variant === "red") colorClasses = "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative group flex items-center justify-center font-medium rounded-lg
        transition-all duration-200
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${loading || disabled 
          ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
          : `${colorClasses} text-white hover:shadow-lg active:shadow-inner`
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// Icon button - circular with icon
export const IconButton = ({ 
  onClick, 
  className = "", 
  disabled = false,
  type = "button",
  icon,
  variant = "default", // "default", "primary", "glass"
  size = "default", // "small", "default", "large"
  ...props 
}) => {
  // Configure size styles
  let sizeClasses = "p-2";
  if (size === "small") sizeClasses = "p-1.5";
  if (size === "large") sizeClasses = "p-3";

  // Configure variants
  let variantClasses = "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white";
  if (variant === "primary") variantClasses = "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500";
  if (variant === "glass") variantClasses = "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:border-white/30";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center rounded-full
        transition-all duration-200
        ${sizeClasses}
        ${disabled 
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
          : variantClasses
        }
        ${className}
      `}
      {...props}
    >
      {icon || (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

// Text button - just text with hover effects
export const TextButton = ({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  type = "button",
  icon = null,
  variant = "default", // "default", "primary", "subtle"
  ...props 
}) => {
  // Configure variants
  let variantClasses = "text-gray-300 hover:text-white";
  if (variant === "primary") variantClasses = "text-purple-400 hover:text-purple-300";
  if (variant === "subtle") variantClasses = "text-gray-400 hover:text-gray-300";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center font-medium
        transition-colors duration-200
        ${disabled 
          ? 'text-gray-500 cursor-not-allowed' 
          : variantClasses
        }
        ${className}
      `}
      {...props}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </button>
  );
};

// Tab button - for tab navigation
export const TabButton = ({
  children,
  onClick,
  className = "",
  isActive = false,
  disabled = false,
  icon = null,
  badgeCount = null,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-4 py-2 font-medium rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-purple-600 text-white' 
          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center">
        {icon && <span className={`mr-1.5 ${isActive ? 'text-white' : 'text-gray-400'}`}>{icon}</span>}
        {children}
        
        {/* Badge counter */}
        {badgeCount !== null && badgeCount > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white min-w-[20px] text-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      
      {/* Active indicator line */}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50 rounded-full"></span>
      )}
    </button>
  );
};

// Connect Wallet button - special design for wallet connections
export const ConnectWalletButton = ({
  onClick,
  className = "",
  connected = false,
  walletAddress = "",
  loading = false,
  ...props
}) => {
  // Shorten wallet address for display
  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        relative group flex items-center font-medium rounded-lg
        transition-all duration-200 px-5 py-2.5
        ${connected 
          ? 'bg-green-800/50 text-white border border-green-700/50 hover:bg-green-700/40' 
          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
        }
        ${loading ? 'opacity-70 cursor-wait' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </>
      ) : connected ? (
        <>
          <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
          {shortenAddress(walletAddress)}
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
};

export default {
  PrimaryButton,
  SecondaryButton,
  GlassButton,
  AccentButton,
  IconButton,
  TextButton,
  TabButton,
  ConnectWalletButton
};