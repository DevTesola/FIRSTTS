import React, { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import UnifiedStakingButton from "./UnifiedStakingButton";
import { GlassButton } from "../Buttons";

/**
 * 향상된 스테이킹 버튼 래퍼 컴포넌트
 * 통합된 스테이킹 방식을 제공하여 사용자 경험을 단순화
 * vec<pubkey> 및 IllegalOwner 오류가 수정된 안정적인 단일 흐름 제공
 */
const EnhancedStakingButton = ({
  nft,
  stakingPeriod,
  onSuccess,
  onError,
  disabled = false,
  onStartLoading,
  onEndLoading,
  className = ""
}) => {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);

  // 로딩 상태 관리
  const handleStartLoading = useCallback(() => {
    setLoading(true);
    if (onStartLoading) onStartLoading();
  }, [onStartLoading]);

  const handleEndLoading = useCallback(() => {
    setLoading(false);
    if (onEndLoading) onEndLoading();
  }, [onEndLoading]);

  // 성공 및 오류 콜백
  const handleSuccess = useCallback((result) => {
    if (onSuccess) {
      onSuccess(result);
    }
  }, [onSuccess]);

  const handleError = useCallback((error) => {
    if (onError) {
      onError(error);
    }
  }, [onError]);

  // 통합 스테이킹 버튼 렌더링
  const renderStakingButton = () => {
    return (
      <UnifiedStakingButton
        nft={nft}
        stakingPeriod={stakingPeriod}
        onSuccess={handleSuccess}
        onError={handleError}
        onStartLoading={handleStartLoading}
        onEndLoading={handleEndLoading}
        disabled={disabled || !connected || !publicKey}
        className={className}
      />
    );
  };

  return (
    <div className="relative">
      <div className="mb-4">
        {/* 통합 스테이킹 버튼 */}
        {renderStakingButton()}
      </div>

      {/* 안내 배너 */}
      {!loading && (
        <div className="text-xs text-gray-500 mb-2 flex justify-center">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            통합된 스테이킹 방식 사용 중
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedStakingButton;