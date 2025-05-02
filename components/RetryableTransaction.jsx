"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Connection, Transaction } from "@solana/web3.js";
import ErrorMessage from "./ErrorMessage";

// 재시도 간격 (밀리초)
const RETRY_INTERVALS = [2000, 5000, 10000]; // 2초, 5초, 10초

/**
 * 트랜잭션 재시도 기능을 제공하는 컴포넌트
 * 
 * @param {Object} transaction - Base64로 인코딩된 트랜잭션 또는 트랜잭션 객체
 * @param {string} endpoint - Solana RPC 엔드포인트
 * @param {Function} onSign - 서명 함수 (트랜잭션을 매개변수로 받고 서명된 트랜잭션을 반환)
 * @param {Function} onSuccess - 성공 콜백 (트랜잭션 서명을 매개변수로 받음)
 * @param {Function} onError - 오류 콜백 (오류 객체를 매개변수로 받음)
 * @param {boolean} autoRetry - 자동 재시도 활성화 여부
 * @param {number} maxRetries - 최대 재시도 횟수
 */
export default function RetryableTransaction({
  transaction,
  endpoint = "https://api.devnet.solana.com",
  onSign,
  onSuccess,
  onError,
  autoRetry = true,
  maxRetries = 3,
  children
}) {
  const [txObject, setTxObject] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signature, setSignature] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState(null);

  // Base64 트랜잭션을 트랜잭션 객체로 변환
  useEffect(() => {
    if (!transaction) return;

    try {
      // 이미 트랜잭션 객체인 경우
      if (typeof transaction === 'object' && transaction.serializeMessage) {
        setTxObject(transaction);
        return;
      }

      // Base64 문자열인 경우
      if (typeof transaction === 'string') {
        const txBuffer = Buffer.from(transaction, 'base64');
        const tx = Transaction.from(txBuffer);
        setTxObject(tx);
        return;
      }

      throw new Error('Invalid transaction format');
    } catch (err) {
      console.error('Failed to parse transaction:', err);
      setError({
        message: 'Failed to parse transaction',
        details: err.message
      });
      if (onError) onError(err);
    }
  }, [transaction, onError]);

  // 트랜잭션 처리 함수
  const processTransaction = useCallback(async () => {
    if (!txObject || !onSign || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. 서명 요청
      console.log('Requesting signature...');
      const signedTx = await onSign(txObject);
      if (!signedTx) {
        throw new Error('Transaction signing was cancelled or failed');
      }

      // 2. 트랜잭션 전송
      console.log('Sending transaction...');
      const connection = new Connection(endpoint, 'confirmed');
      const rawTransaction = signedTx.serialize();
      const txSignature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      setSignature(txSignature);
      console.log('Transaction sent:', txSignature);

      // 3. 확인 대기
      setConfirmationStatus('confirming');
      console.log('Waiting for confirmation...');
      
      // 트랜잭션 확인 (오류 발생시 계속 진행)
      try {
        const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');
        
        if (confirmation.value.err) {
          console.error('Transaction confirmed with error:', confirmation.value.err);
          throw new Error(`Transaction confirmed with error: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        setConfirmationStatus('confirmed');
        console.log('Transaction confirmed successfully');
        
        if (onSuccess) onSuccess(txSignature);
      } catch (confirmErr) {
        console.error('Error confirming transaction:', confirmErr);
        
        // 트랜잭션 상태 확인 시도
        try {
          const status = await connection.getSignatureStatus(txSignature);
          console.log('Transaction status:', status);
          
          if (status.value && !status.value.err) {
            // 트랜잭션이 성공적으로 처리됨
            setConfirmationStatus('confirmed');
            if (onSuccess) onSuccess(txSignature);
          } else {
            throw new Error('Transaction confirmation failed');
          }
        } catch (statusErr) {
          console.error('Error checking transaction status:', statusErr);
          throw confirmErr; // 원래 오류로 돌아감
        }
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError({
        message: err.message || 'Transaction failed',
        details: err.toString()
      });
      setConfirmationStatus('failed');
      
      // 자동 재시도 활성화된 경우
      if (autoRetry && retryCount < maxRetries) {
        const nextRetryCount = retryCount + 1;
        const retryDelay = RETRY_INTERVALS[Math.min(nextRetryCount - 1, RETRY_INTERVALS.length - 1)];
        
        console.log(`Will retry in ${retryDelay/1000} seconds (attempt ${nextRetryCount}/${maxRetries})...`);
        
        // 재시도 타이머 설정
        setTimeout(() => {
          setRetryCount(nextRetryCount);
          setIsProcessing(false); // 처리 상태 초기화
          processTransaction(); // 재시도
        }, retryDelay);
      } else {
        if (onError) onError(err);
        setIsProcessing(false);
      }
      return;
    }
    
    setIsProcessing(false);
  }, [txObject, onSign, isProcessing, endpoint, onSuccess, onError, autoRetry, retryCount, maxRetries]);

  // 수동 재시도 핸들러
  const handleRetry = useCallback(() => {
    setRetryCount(retryCount + 1);
    setIsProcessing(false);
    processTransaction();
  }, [processTransaction, retryCount]);

  // 트랜잭션 객체가 준비되면 자동으로 처리 시작
  useEffect(() => {
    if (txObject && !isProcessing && !signature && !error) {
      processTransaction();
    }
  }, [txObject, isProcessing, signature, error, processTransaction]);

  // 자식 컴포넌트를 렌더링하거나 처리 상태 표시
  return (
    <div>
      {error && (
        <ErrorMessage
          message={error.message}
          type="error"
          errorDetails={error.details}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      )}
      
      {isProcessing && confirmationStatus === 'confirming' && (
        <div className="bg-blue-900/30 border border-blue-500/50 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-3"></div>
            <span className="text-blue-300 font-medium">Confirming transaction...</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">This may take a few moments. Please wait.</p>
        </div>
      )}
      
      {confirmationStatus === 'confirmed' && signature && (
        <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-300 font-medium">Transaction confirmed!</span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Signature: <span className="font-mono">{signature.slice(0, 8)}...{signature.slice(-8)}</span>
          </p>
        </div>
      )}
      
      {children}
    </div>
  );
}