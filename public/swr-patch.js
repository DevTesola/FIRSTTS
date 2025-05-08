/**
 * Vercel 호환성 패치 스크립트
 * 
 * 이 스크립트는 기존 Service Worker를 등록 해제하여
 * Vercel 배포 시 발생하는 충돌을 방지합니다.
 */
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister().then(() => {
          console.log('Service Worker 등록 해제 완료');
        }).catch(error => {
          console.error('Service Worker 등록 해제 실패:', error);
        });
      }
    });
  });
}