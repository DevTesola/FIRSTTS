"use client";

import React, { useState, useEffect } from "react";
import ProgressStepper from "./ProgressStepper";

/**
 * TransactionStatus Component
 * Shows detailed blockchain transaction status with visual feedback
 * 
 * @param {string} status - Current transaction status
 * @param {string} type - Transaction type ('stake', 'unstake', 'claim', etc.)
 * @param {Object} details - Transaction details object
 * @param {string} [signature] - Transaction signature if available
 * @param {boolean} [showExplorer] - Whether to show explorer link
 * @param {function} [onRetry] - Retry callback function
 * @returns {JSX.Element} TransactionStatus component
 */
export default function TransactionStatus({
  status,
  type = "transaction",
  details = {},
  signature,
  showExplorer = true,
  onRetry
}) {
  // Define transaction steps based on type
  const getSteps = () => {
    switch (type.toLowerCase()) {
      case "stake":
        return [
          { name: "Prepare", description: "Create staking instructions" },
          { name: "Approve", description: "Sign with wallet" },
          { name: "Submit", description: "Send to blockchain" },
          { name: "Confirm", description: "Wait for confirmation" },
          { name: "Complete", description: "Update account state" }
        ];
      case "unstake":
        return [
          { name: "Prepare", description: "Create unstaking instructions" },
          { name: "Approve", description: "Sign with wallet" },
          { name: "Submit", description: "Send to blockchain" },
          { name: "Confirm", description: "Wait for confirmation" },
          { name: "Complete", description: "Update account state" }
        ];
      case "claim":
        return [
          { name: "Calculate", description: "Compute eligible rewards" },
          { name: "Prepare", description: "Create claim instructions" },
          { name: "Approve", description: "Sign with wallet" },
          { name: "Submit", description: "Send to blockchain" },
          { name: "Complete", description: "Update rewards balance" }
        ];
      default:
        return [
          { name: "Prepare", description: "Create transaction" },
          { name: "Approve", description: "Sign with wallet" },
          { name: "Submit", description: "Send to blockchain" },
          { name: "Confirm", description: "Wait for confirmation" },
          { name: "Complete", description: "Update state" }
        ];
    }
  };

  // Define current step based on status
  const getCurrentStep = () => {
    switch (status.toLowerCase()) {
      case "preparing":
      case "initialized":
        return 0;
      case "awaiting_approval":
      case "wallet_signing":
        return 1;
      case "submitting":
      case "sending":
        return 2;
      case "confirming":
      case "processing":
        return 3;
      case "confirmed":
      case "success":
      case "completed":
        return 4;
      case "failed":
      case "error":
      case "rejected":
        return 1; // Usually fails at approval step, but could be customized
      default:
        return 0;
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const step = getCurrentStep();
    const totalSteps = getSteps().length;
    return Math.round((step / (totalSteps - 1)) * 100);
  };

  // Format estimated time
  const formatEstimatedTime = () => {
    if (status.toLowerCase() === "confirmed" || status.toLowerCase() === "completed") {
      return "Completed";
    }
    
    if (status.toLowerCase() === "failed" || status.toLowerCase() === "error") {
      return "Failed";
    }
    
    const step = getCurrentStep();
    
    // Estimated time per step in seconds
    const estimatedTimes = [2, 10, 5, 15, 3];
    let remainingTime = 0;
    
    for (let i = step; i < estimatedTimes.length; i++) {
      remainingTime += estimatedTimes[i];
    }
    
    // Apply progress within current step if available
    if (details.progressWithinStep && details.progressWithinStep > 0 && details.progressWithinStep < 1) {
      remainingTime -= estimatedTimes[step] * details.progressWithinStep;
    }
    
    if (remainingTime < 5) {
      return "Less than 5 seconds";
    } else if (remainingTime < 60) {
      return `About ${Math.round(remainingTime)} seconds`;
    } else {
      return `About ${Math.round(remainingTime / 60)} minutes`;
    }
  };

  // Status color and icon
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "success":
      case "completed":
        return {
          color: "text-green-500",
          bgColor: "bg-green-900/20",
          borderColor: "border-green-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case "failed":
      case "error":
      case "rejected":
        return {
          color: "text-red-500",
          bgColor: "bg-red-900/20",
          borderColor: "border-red-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      case "processing":
      case "confirming":
        return {
          color: "text-blue-500",
          bgColor: "bg-blue-900/20",
          borderColor: "border-blue-500/30",
          icon: (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )
        };
      default:
        return {
          color: "text-purple-500",
          bgColor: "bg-purple-900/20",
          borderColor: "border-purple-500/30",
          icon: (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )
        };
    }
  };

  // Status message
  const getStatusMessage = () => {
    const stepName = getSteps()[getCurrentStep()].name;
    
    switch (status.toLowerCase()) {
      case "preparing":
      case "initialized":
        return `Preparing transaction...`;
      case "awaiting_approval":
      case "wallet_signing":
        return `Please approve the transaction in your wallet`;
      case "submitting":
      case "sending":
        return `Sending transaction to the network...`;
      case "confirming":
      case "processing":
        return `Confirming transaction on the blockchain...`;
      case "confirmed":
      case "success":
      case "completed":
        return `Transaction successfully completed!`;
      case "failed":
      case "error":
        return details.errorMessage || `Transaction failed. Please try again.`;
      case "rejected":
        return `Transaction was rejected in the wallet`;
      default:
        return `Processing ${stepName.toLowerCase()} step...`;
    }
  };

  const statusStyles = getStatusStyles();
  const steps = getSteps();
  const currentStep = getCurrentStep();
  const progressPercentage = getProgressPercentage();
  const isCompleted = status.toLowerCase() === "confirmed" || status.toLowerCase() === "completed" || status.toLowerCase() === "success";
  const isFailed = status.toLowerCase() === "failed" || status.toLowerCase() === "error" || status.toLowerCase() === "rejected";

  return (
    <div className={`rounded-lg ${statusStyles.bgColor} p-6 border ${statusStyles.borderColor}`}>
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusStyles.color} bg-gray-800`}>
          {statusStyles.icon}
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-white capitalize">
            {type} {isCompleted ? "Complete" : isFailed ? "Failed" : "in Progress"}
          </h3>
          <p className="text-sm text-gray-300">
            {getStatusMessage()}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{progressPercentage}% Complete</span>
          <span>Estimated time: {formatEstimatedTime()}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${isFailed ? 'bg-red-600' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}
            style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}
          ></div>
        </div>
      </div>

      {/* Steps visualization */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <ProgressStepper 
          steps={steps} 
          currentStep={currentStep} 
          size="small" 
        />
      </div>

      {/* Transaction details */}
      {(signature || details.amount || details.token) && (
        <div className="text-sm text-gray-300 space-y-2 mt-4 bg-gray-800/50 p-3 rounded-md">
          {details.amount && (
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span>{details.amount} {details.token || 'TESOLA'}</span>
            </div>
          )}
          
          {signature && (
            <div className="flex flex-col space-y-1">
              <span className="text-gray-400">Transaction ID:</span>
              <code className="text-xs bg-gray-900 p-1 rounded font-mono text-gray-300 overflow-x-auto">
                {signature}
              </code>
              
              {showExplorer && (
                <a 
                  href={`https://explorer.solana.com/tx/${signature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-xs mt-1 inline-flex items-center"
                >
                  View on Explorer
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Retry button for failed transactions */}
      {isFailed && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600
                   text-white py-2 rounded-md shadow-md transition-all duration-300 flex justify-center items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Retry Transaction
        </button>
      )}
    </div>
  );
}