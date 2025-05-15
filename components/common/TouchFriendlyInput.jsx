import React from 'react';

/**
 * TouchFriendlyInput - A mobile-optimized input component with larger touch targets
 * 
 * This component provides enhanced mobile usability for input fields with:
 * - Larger touch targets (44px minimum)
 * - Clear button when input has value
 * - Properly positioned icons
 * - Optimized styling for mobile devices
 */
const TouchFriendlyInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  icon,
  onClear,
  name,
  disabled = false,
  required = false,
  autoComplete = 'off',
  id,
  ...props
}) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white 
          placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 
          focus:border-purple-500 min-h-[48px] ${icon ? 'pl-10' : 'pl-4'} 
          ${value && onClear ? 'pr-10' : 'pr-4'} ${className}`}
        name={name}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        id={id}
        {...props}
      />
      
      {/* Left icon */}
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}
      
      {/* Clear button */}
      {value && onClear && (
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={onClear}
          aria-label="Clear input"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TouchFriendlyInput;