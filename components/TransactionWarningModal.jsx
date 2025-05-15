import React from 'react';
import Image from 'next/image';

/**
 * 트랜잭션 경고 모달 컴포넌트
 * 사용자에게 트랜잭션 세부 정보를 표시하고 확인을 요청합니다.
 */
const TransactionWarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  txAmount, 
  tokenSymbol = 'SOL',
  itemName = 'SOLARA NFT',
  estimatedFee = 0.000005,
  showDetails = false,
  txType = 'mint'
}) => {
  if (!isOpen) return null;

  // 서명 창에 금액이 제대로 표시되지 않는 문제로 인한 추가 경고
  const warningMessage = "Some wallet apps may not display the full amount in the signing window. Please confirm the total cost shown here.";
  
  // 트랜잭션 타입에 따른 텍스트 설정
  const actionText = txType === 'mint' ? 'Mint' : txType === 'stake' ? 'Stake' : 'Complete';
  const actionTitle = txType === 'mint' ? 'Mint NFT' : txType === 'stake' ? 'Stake NFT' : 'Confirm Transaction';
  
  // 예상 총액 계산
  const totalAmount = parseFloat(txAmount) + estimatedFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-80 backdrop-blur-sm"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* 모달 정렬 트릭 */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* 모달 내용 */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 border border-purple-500/30 rounded-2xl shadow-xl sm:align-middle">
          {/* 헤더 및 아이콘 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-white">
              {actionTitle}
            </h3>
            <div className="flex items-center space-x-2">
              <Image
                src="/logo2.png"
                alt="SOLARA Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
          </div>

          {/* 경고 메시지 */}
          <div className="mt-2 mb-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              <span className="mr-2">⚠️</span>
              {warningMessage}
            </p>
          </div>

          {/* 트랜잭션 세부 정보 */}
          <div className="p-4 bg-gray-900/50 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Transaction Details</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{itemName}</span>
                <span className="text-sm font-medium text-white">{txAmount} {tokenSymbol}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Network Fee (est.)</span>
                <span className="text-sm font-medium text-white">{estimatedFee.toFixed(6)} {tokenSymbol}</span>
              </div>
              
              <div className="pt-2 mt-2 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">Total Amount</span>
                  <span className="text-base font-bold text-white">{totalAmount.toFixed(6)} {tokenSymbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 선택적 추가 세부 정보 */}
          {showDetails && (
            <div className="p-3 bg-gray-900/30 rounded-lg mb-4 text-xs text-gray-400">
              <p>Transaction will be signed with your connected wallet.</p>
              <p className="mt-1">Funds will be transferred to the project wallet once confirmed.</p>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
              onClick={onConfirm}
            >
              <span className="mr-2">✓</span>
              Confirm {actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionWarningModal;