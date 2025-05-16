// Recovery script for handling "missing required error components" issue
(function() {
  console.log('Recovery script loaded');
  
  // 이미 로드되었는지 확인
  if (window.__RECOVERY_LOADED) {
    return;
  }
  
  window.__RECOVERY_LOADED = true;
  let recoveryAttempts = 0;
  const MAX_RECOVERY_ATTEMPTS = 3;
  
  // Next.js 오류를 감지하고 처리하는 기능
  const handleNextJsError = function(errorMsg) {
    if (typeof errorMsg === 'string' && 
        (errorMsg.includes('missing required error components') || 
         errorMsg.includes('refreshing')) && 
        recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
      
      recoveryAttempts++;
      console.log(`Recovery attempt ${recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS}`);
      
      // 에러 화면 대신 로딩 화면 표시
      const errorContainer = document.createElement('div');
      errorContainer.id = 'recovery-loader';
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
      errorContainer.style.zIndex = '10000';
      errorContainer.style.fontFamily = '"Orbitron", sans-serif';
      
      // 로딩 애니메이션
      const spinner = document.createElement('div');
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.border = '4px solid rgba(139, 92, 246, 0.3)';
      spinner.style.borderTop = '4px solid rgba(139, 92, 246, 1)';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      spinner.style.marginBottom = '20px';
      
      // 애니메이션 키프레임 추가
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      
      // 메시지 추가
      const message = document.createElement('p');
      message.textContent = '애플리케이션 복구 중...';
      message.style.fontSize = '18px';
      message.style.marginBottom = '10px';
      
      // 진행 메시지
      const progressMsg = document.createElement('p');
      progressMsg.textContent = `재시도 중 (${recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS})`;
      progressMsg.style.fontSize = '14px';
      progressMsg.style.color = '#a78bfa';
      
      // 모든 요소 조합
      errorContainer.appendChild(style);
      errorContainer.appendChild(spinner);
      errorContainer.appendChild(message);
      errorContainer.appendChild(progressMsg);
      
      // 기존 #__next 요소를 비운 후 로딩 화면 표시
      const nextContainer = document.getElementById('__next');
      if (nextContainer) {
        nextContainer.innerHTML = '';
        nextContainer.appendChild(errorContainer);
      } else {
        document.body.appendChild(errorContainer);
      }
      
      // 페이지 새로고침 준비
      setTimeout(() => {
        // 필요한 스크립트 로드 확인
        if (!window.__NEXT_PREPARED_ERROR_COMPONENTS__) {
          const script = document.createElement('script');
          script.src = '/error-components.js';
          script.onload = () => {
            console.log('Error components script loaded');
            // Next.js가 오류 컴포넌트를 찾을 수 있도록 flag 설정
            window.__NEXT_PREPARED_ERROR_COMPONENTS__ = true;
          };
          document.head.appendChild(script);
        }
        
        // 새로고침 지연
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 2000);
      
      return true;
    }
    return false;
  };
  
  // Console.error 가로채기
  const originalConsoleError = console.error;
  console.error = function() {
    // 기본 로그 동작 유지
    originalConsoleError.apply(this, arguments);
    
    // 첫 번째 인자를 확인하여 Next.js 오류 처리
    if (arguments.length > 0 && handleNextJsError(arguments[0])) {
      // 오류가 처리되었으므로 여기서 중단
      return;
    }
  };
  
  // DOMContentLoaded 이벤트에서 페이지 로드 후 오류 확인
  document.addEventListener('DOMContentLoaded', function() {
    // 페이지가 이미 로드된 후 오류 메시지 확인
    const errorElements = document.querySelectorAll('pre');
    for (let i = 0; i < errorElements.length; i++) {
      const text = errorElements[i].textContent || '';
      if (handleNextJsError(text)) {
        break;
      }
    }
    
    // 백업: 흰색 화면 감지 및 처리
    setTimeout(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      
      if (computedStyle.backgroundColor === 'rgb(255, 255, 255)' && 
          body.children.length < 3) {
        console.log('White screen detected, initiating recovery');
        handleNextJsError('missing required error components');
      }
    }, 3000);
  });
})();