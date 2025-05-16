// 필수 오류 컴포넌트 추가
console.log('Error components loaded');

// Next.js 오류 컴포넌트 핸들러
window.__NEXT_PREPARED_ERROR_COMPONENTS__ = true;

// 추가 오류 처리 - 누락된 컴포넌트 문제 해결
document.addEventListener('DOMContentLoaded', function() {
  // 오류 표시 요소 생성
  window.__NEXT_ERROR_RENDER = function(error) {
    console.error('Next.js error:', error);
    
    // 이미 오류 UI가 있으면 중복 생성 방지
    if (document.getElementById('__next_error_container')) {
      return;
    }
    
    // 기본 에러 표시 컨테이너 생성
    const errorContainer = document.createElement('div');
    errorContainer.id = '__next_error_container';
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '0';
    errorContainer.style.left = '0';
    errorContainer.style.width = '100%';
    errorContainer.style.height = '100%';
    errorContainer.style.backgroundColor = '#000';
    errorContainer.style.color = '#fff';
    errorContainer.style.display = 'flex';
    errorContainer.style.flexDirection = 'column';
    errorContainer.style.alignItems = 'center';
    errorContainer.style.justifyContent = 'center';
    errorContainer.style.padding = '20px';
    errorContainer.style.zIndex = '10000';
    errorContainer.style.fontFamily = '"Orbitron", sans-serif';
    
    // 에러 메시지 추가
    const errorMsg = document.createElement('div');
    errorMsg.style.maxWidth = '500px';
    errorMsg.style.background = 'linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(17, 24, 39, 0.8))';
    errorMsg.style.borderRadius = '8px';
    errorMsg.style.padding = '20px';
    errorMsg.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    errorMsg.style.border = '1px solid rgba(139, 92, 246, 0.3)';
    
    const errorTitle = document.createElement('h2');
    errorTitle.textContent = '애플리케이션 로딩 오류';
    errorTitle.style.fontSize = '24px';
    errorTitle.style.marginBottom = '10px';
    errorTitle.style.color = '#e879f9';
    errorTitle.style.textAlign = 'center';
    
    const errorDescription = document.createElement('p');
    errorDescription.textContent = '페이지를 로딩하는 중 문제가 발생했습니다. 새로고침을 시도해 보세요.';
    errorDescription.style.marginBottom = '20px';
    errorDescription.style.color = '#d1d5db';
    errorDescription.style.textAlign = 'center';
    
    const errorDetails = document.createElement('div');
    errorDetails.style.background = 'rgba(0, 0, 0, 0.3)';
    errorDetails.style.padding = '10px';
    errorDetails.style.borderRadius = '4px';
    errorDetails.style.fontSize = '12px';
    errorDetails.style.fontFamily = 'monospace';
    errorDetails.style.color = '#ef4444';
    errorDetails.style.marginBottom = '20px';
    errorDetails.style.maxHeight = '100px';
    errorDetails.style.overflow = 'auto';
    errorDetails.textContent = error?.message || '알 수 없는 오류';
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = '새로고침';
    refreshButton.style.background = 'linear-gradient(to right, #7c3aed, #8b5cf6)';
    refreshButton.style.color = '#fff';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '4px';
    refreshButton.style.padding = '8px 16px';
    refreshButton.style.cursor = 'pointer';
    refreshButton.style.fontSize = '14px';
    refreshButton.style.fontWeight = 'bold';
    refreshButton.style.boxShadow = '0 0 10px rgba(139, 92, 246, 0.5)';
    refreshButton.addEventListener('click', function() {
      window.location.reload();
    });
    
    // 요소 조합
    errorMsg.appendChild(errorTitle);
    errorMsg.appendChild(errorDescription);
    errorMsg.appendChild(errorDetails);
    errorMsg.appendChild(refreshButton);
    errorContainer.appendChild(errorMsg);
    
    // 문서에 추가
    document.body.appendChild(errorContainer);
  };
  
  // 기본 오류 핸들러 확장
  const originalError = console.error;
  console.error = function() {
    // 기본 로깅 유지
    originalError.apply(this, arguments);
    
    // Next.js 누락된 컴포넌트 오류 감지
    const errorMessage = arguments[0];
    if (typeof errorMessage === 'string' && 
        (errorMessage.includes('missing required error components') || 
         errorMessage.includes('refreshing'))) {
      
      // 누락된 컴포넌트 오류 처리
      console.log('Handling missing components error');
      if (window.__NEXT_ERROR_RENDER) {
        window.__NEXT_ERROR_RENDER({ 
          message: 'Required components are missing. The application is trying to recover.'
        });
      }
    }
  };
});