import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

function Error({ statusCode, message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <Head>
        <title>{statusCode ? `${statusCode} - 오류 발생` : '오류 발생'}</title>
      </Head>
      
      <div className="relative w-full max-w-lg p-8 border border-gray-800 rounded-lg bg-gradient-to-b from-gray-900 to-black">
        <div className="absolute inset-0 bg-grid-white/5 bg-grid mask-radial-gradient"></div>
        
        <div className="relative flex flex-col items-center z-10">
          <div className="text-6xl font-bold text-red-500 mb-4 animate-pulse">
            {statusCode || 'Error'}
          </div>
          
          <h1 className="text-2xl font-semibold mb-6 text-center">
            {message || (
              statusCode 
                ? `${statusCode} 오류가 발생했습니다` 
                : '클라이언트 측 오류가 발생했습니다'
            )}
          </h1>
          
          <p className="text-gray-400 text-center mb-8">
            죄송합니다. 요청하신 페이지를 처리하는 동안 문제가 발생했습니다.
          </p>
          
          <div className="flex space-x-4">
            <Link href="/" legacyBehavior>
              <a className="px-6 py-3 bg-indigo-700 hover:bg-indigo-600 rounded-md transition-all duration-200 transform hover:scale-105 hover:shadow-glow-purple text-white font-medium">
                홈으로 돌아가기
              </a>
            </Link>
            
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 border border-indigo-700 hover:border-indigo-500 rounded-md transition-all duration-200 transform hover:scale-105 text-white font-medium"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  const message = err?.message || null;
  return { statusCode, message };
};

export default Error;