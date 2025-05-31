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

    // 랜딩 페이지로 리다이렉트
    router.replace("/landing");
  }, [router]);

  return (
    <ErrorBoundary>
      <Head>
        <title>TESOLA - 우주를 향한 여정</title>
        <meta name="description" content="Enter the TESOLA experience - 우주 탐험과 미래 기술의 융합" />
        
        {/* Emergency inline style - prevent blank screen */}
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