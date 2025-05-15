import dynamic from 'next/dynamic';
import React from 'react';

/**
 * 컴포넌트를 동적으로 로드하는 유틸리티 함수
 * 
 * @param {string} componentPath - 로드할 컴포넌트의 경로
 * @param {object} options - 동적 로딩 옵션
 * @param {boolean} options.ssr - 서버 사이드 렌더링 사용 여부 (기본값: false)
 * @param {React.ComponentType} options.LoadingComponent - 로딩 중 표시할 컴포넌트
 * @param {object} options.loadableOptions - 추가 Loadable 옵션
 * @returns {React.ComponentType} 동적으로 로드된 컴포넌트
 */
export function loadComponent(componentPath, options = {}) {
  const {
    ssr = false,
    LoadingComponent = () => <LoadingPlaceholder />,
    loadableOptions = {}
  } = options;

  return dynamic(
    () => import(componentPath),
    {
      ssr,
      loading: LoadingComponent,
      ...loadableOptions
    }
  );
}

/**
 * 기본 로딩 플레이스홀더 컴포넌트
 * 높이와 너비를 유지하면서 로딩 상태를 표시
 */
export function LoadingPlaceholder({ height = '400px', width = '100%', text = 'Loading...' }) {
  return (
    <div 
      style={{ 
        height, 
        width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(30, 30, 60, 0.5)',
        backdropFilter: 'blur(5px)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(124, 58, 237, 0.2)'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div 
          style={{ 
            width: '40px', 
            height: '40px',
            margin: '0 auto 8px',
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTop: '3px solid rgba(124, 58, 237, 0.8)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} 
        />
        <div style={{ color: 'white', fontSize: '14px' }}>{text}</div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * 공통적으로 사용되는 컴포넌트들의 동적 임포트 정의
 * 프로젝트 전반에서 사용할 수 있는 사전 정의된 동적 컴포넌트
 */
export const DynamicComponents = {
  // 스테이킹 관련 무거운 컴포넌트
  StakingDashboard: loadComponent('../components/staking/StakingDashboard', {
    LoadingComponent: () => <LoadingPlaceholder text="Loading Staking Dashboard..." />,
    ssr: false
  }),
  
  StakingRewards: loadComponent('../components/staking/StakingRewards-enhanced', {
    LoadingComponent: () => <LoadingPlaceholder text="Loading Staking Rewards..." />,
    ssr: false
  }),
  
  NFTGallery: loadComponent('../components/staking/NFTGallery', {
    LoadingComponent: () => <LoadingPlaceholder text="Loading NFT Gallery..." />,
    ssr: false
  }),
  
  // 이미지 관련 무거운 컴포넌트
  EnhancedProgressiveImage: loadComponent('../components/EnhancedProgressiveImage', {
    ssr: false
  }),
  
  // 기타 무거운 컴포넌트 (필요한 것만 주석 해제)
  // 예시: 
  // RewardsDashboard: loadComponent('../components/RewardsDashboard', {
  //   LoadingComponent: () => <LoadingPlaceholder text="Loading Rewards Dashboard..." />,
  //   ssr: false
  // })
};

export default loadComponent;