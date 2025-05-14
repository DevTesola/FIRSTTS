import React from 'react';
import Link from 'next/link';

export default function ErrorFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md p-6 border border-gray-800 rounded-lg bg-gradient-to-b from-gray-900 to-black">
        <h1 className="text-2xl font-bold text-center mb-4">오류가 발생했습니다</h1>
        <p className="text-gray-400 text-center mb-6">
          애플리케이션을 로드하는 동안 문제가 발생했습니다.
        </p>
        <div className="flex justify-center">
          <Link href="/" legacyBehavior>
            <a className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-md transition-colors text-white">
              새로고침
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}