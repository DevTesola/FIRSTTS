"use client";

import React from "react";

/**
 * ProgressStepper Component
 * Shows a multi-step progress indicator with current step highlighted
 * 
 * @param {Object[]} steps - Array of step objects with name and optional description
 * @param {number} currentStep - Index of the current active step
 * @param {string} [size] - Size of the stepper ('small', 'medium', 'large')
 * @param {boolean} [isVertical] - Whether to display steps vertically
 * @param {string} [className] - Additional CSS classes
 * @returns {JSX.Element} ProgressStepper component
 */
export default function ProgressStepper({ 
  steps, 
  currentStep, 
  size = "medium", 
  isVertical = false,
  className = ""
}) {
  // Size configurations
  const sizeStyles = {
    small: {
      container: "text-xs",
      step: "w-5 h-5",
      text: "text-xs",
      line: "h-0.5",
    },
    medium: {
      container: "text-sm",
      step: "w-7 h-7",
      text: "text-sm",
      line: "h-1",
    },
    large: {
      container: "text-base",
      step: "w-9 h-9",
      text: "text-base",
      line: "h-1.5",
    }
  };
  
  const selectedSize = sizeStyles[size] || sizeStyles.medium;
  
  return (
    <div className={`${className} ${isVertical ? 'flex flex-col' : 'flex items-center justify-between'}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`${isVertical ? 'flex items-center mb-6' : 'flex flex-col items-center'}`}>
            {/* Step indicator */}
            <div 
              className={`relative ${selectedSize.step} rounded-full flex items-center justify-center 
                         ${index < currentStep ? 'bg-purple-600 text-white' : 
                           index === currentStep ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg ring-2 ring-purple-300/30' : 
                           'bg-gray-700 text-gray-400'}
                         ${index === currentStep ? 'animate-pulse-slow' : ''}`}
            >
              {index < currentStep ? (
                // Completed step shows checkmark
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                // Current or future step shows number
                <span className="font-semibold">{index + 1}</span>
              )}
              
              {/* Pulse effect for current step */}
              {index === currentStep && (
                <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-30"></div>
              )}
            </div>
            
            {/* Step label */}
            <div className={`${isVertical ? 'ml-4' : 'mt-2'} ${selectedSize.text}`}>
              <p className={`font-medium ${index === currentStep ? 'text-white' : 'text-gray-400'}`}>
                {step.name}
              </p>
              {step.description && (
                <p className="text-gray-500 text-xs mt-0.5 max-w-[12rem]">
                  {step.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Connector line between steps */}
          {index < steps.length - 1 && (
            <div 
              className={`
                ${isVertical ? 
                  'ml-3.5 h-6 w-0.5 bg-gradient-to-b' : 
                  'flex-1 mx-4 ' + selectedSize.line + ' bg-gradient-to-r'
                }
                ${index < currentStep ? 
                  'from-purple-600 to-pink-500' : 
                  'from-gray-700 to-gray-700'
                }
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}