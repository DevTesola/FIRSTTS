import { useEffect } from "react";
import { useRouter } from "next/router";
import FallbackLoading from "../components/FallbackLoading";
import ErrorBoundary from "../components/ErrorBoundary";
import Head from "next/head";

// 오류 처리와 함께 접속 시 landing 페이지로 리다이렉트
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Next.js 오류 컴포넌트가 제대로 로드되었는지 확인
    if (typeof window !== 'undefined') {
      window.__NEXT_PREPARED_ERROR_COMPONENTS__ = true;
    }

    // 페이지 로드 문제가 있는지 확인
    const pageLoadCheck = setTimeout(() => {
      // 흰색 화면 감지 및 복구
      if (document.body && window.getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)') {
        console.log('White screen detected, initiating emergency recovery');
        
        // 오류 복구 UI를 수동으로 생성
        const recoveryContainer = document.createElement('div');
        recoveryContainer.style.position = 'fixed';
        recoveryContainer.style.inset = '0';
        recoveryContainer.style.backgroundColor = '#000';
        recoveryContainer.style.display = 'flex';
        recoveryContainer.style.flexDirection = 'column';
        recoveryContainer.style.alignItems = 'center';
        recoveryContainer.style.justifyContent = 'center';
        recoveryContainer.style.zIndex = '9999';
        
        // 로딩 메시지
        const message = document.createElement('div');
        message.textContent = '복구 중...';
        message.style.color = '#fff';
        message.style.marginBottom = '20px';
        message.style.fontSize = '20px';
        recoveryContainer.appendChild(message);
        
        // 새로고침 버튼
        const button = document.createElement('button');
        button.textContent = '새로고침';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#6d28d9';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.onclick = () => window.location.reload();
        recoveryContainer.appendChild(button);
        
        document.body.appendChild(recoveryContainer);
        
        // 경로 직접 설정 및 새로고침
        setTimeout(() => {
          window.location.href = '/landing';
        }, 3000);
      }
    }, 2000);

    // 랜딩 페이지로 리다이렉트
    router.replace("/landing");
    
    return () => clearTimeout(pageLoadCheck);
  }, [router]);

  return (
    <ErrorBoundary>
      <Head>
        <title>TESOLA - 우주를 향한 여정</title>
        <meta name="description" content="Enter the TESOLA experience - 우주 탐험과 미래 기술의 융합" />
        
        {/* 응급 인라인 스타일 - 빈 화면 방지 */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: black !important;
            color: white !important;
            font-family: 'Orbitron', sans-serif !important;
          }
          
          #__next, html, body {
            min-height: 100vh;
            background-color: black !important;
          }
        `}} />
      </Head>
      <FallbackLoading message="TESOLA 경험 로딩 중..." />
    </ErrorBoundary>
  );
}