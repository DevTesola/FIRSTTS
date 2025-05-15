// TESOLA Service Worker 등록 스크립트 (최적화됨)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // 서비스 워커 등록
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker 등록 성공:', registration.scope);
        
        // 서비스 워커 업데이트 확인 (1시간마다)
        setInterval(() => {
          registration.update()
            .then(() => console.log('서비스 워커 업데이트 체크 완료'))
            .catch(err => console.error('서비스 워커 업데이트 실패:', err));
        }, 60 * 60 * 1000);
        
        // 새 서비스 워커 발견 시 사용자에게 알림
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 업데이트가 준비됨
              console.log('새 버전이 설치되었습니다. 페이지를 새로고침하세요.');
              
              // 사용자가 현재 작업을 잃지 않도록 명시적인 알림 표시
              if (window.tesolaApp && window.tesolaApp.showUpdateNotification) {
                window.tesolaApp.showUpdateNotification();
              } else {
                // 앱에 알림 함수가 없으면 토스트 알림 직접 표시
                showUpdateToast();
              }
            }
          };
        };
      })
      .catch(function(error) {
        console.error('ServiceWorker 등록 실패:', error);
      });
      
    // 백그라운드 동기화 지원 확인
    if ('SyncManager' in window) {
      // 네트워크 상태 변경 시 동기화 시도
      window.addEventListener('online', () => {
        navigator.serviceWorker.ready
          .then(registration => {
            // 'sync-staking' 태그로 등록된 동기화 작업 실행
            return registration.sync.register('sync-staking');
          })
          .catch(err => {
            console.error('백그라운드 동기화 등록 실패:', err);
          });
      });
    }
    
    // 푸시 알림 권한 요청 함수 (사용자와의 상호작용에서 호출되어야 함)
    window.requestNotificationPermission = function() {
      if (!('Notification' in window)) {
        console.log('이 브라우저는 알림을 지원하지 않습니다.');
        return Promise.resolve(false);
      }
      
      if (Notification.permission === 'granted') {
        return Promise.resolve(true);
      }
      
      if (Notification.permission === 'denied') {
        console.log('알림 권한이 거부되었습니다.');
        return Promise.resolve(false);
      }
      
      return Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            console.log('알림 권한이 허용되었습니다.');
            return true;
          }
          
          console.log('알림 권한이 거부되었습니다.');
          return false;
        });
    };
    
    // 푸시 구독 함수
    window.subscribeToPush = async function() {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if (!registration.pushManager) {
          console.log('푸시 알림이 지원되지 않습니다.');
          return null;
        }
        
        // 기존 구독 확인
        let subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          return subscription;
        }
        
        // 새 구독 생성
        // 실제 구현에서는 서버에서 VAPID 키를 가져와야 함
        const publicVapidKey = window.TESOLA_VAPID_KEY || 'BJ6J2Ox1z_4wUnf4bTU9qQYcghiN_gE2BfCWXgPKDEPp6wlvUGRXFmjHq1xHs7iN6CidF2wcLwudgYS5v_KJZP0';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
        
        // 서버에 구독 정보 전송
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
        
        console.log('푸시 알림 구독 완료');
        return subscription;
      } catch (err) {
        console.error('푸시 알림 구독 실패:', err);
        return null;
      }
    };
    
    // Base64 문자열을 Uint8Array로 변환하는 유틸리티 함수
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      return outputArray;
    }
    
    // 업데이트 토스트 알림 표시
    function showUpdateToast() {
      if (document.getElementById('update-toast')) return;
      
      const toast = document.createElement('div');
      toast.id = 'update-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(60, 0, 120, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 400px;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(138, 43, 226, 0.4);
      `;
      
      toast.innerHTML = `
        <div style="margin-right: 15px;">
          <div style="font-weight: bold; margin-bottom: 5px;">앱 업데이트 가능</div>
          <div style="font-size: 12px; opacity: 0.9;">새 버전이 설치되었습니다. 반영하려면 새로고침하세요.</div>
        </div>
        <div>
          <button id="update-refresh" style="background: #8A2BE2; border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">새로고침</button>
          <button id="update-dismiss" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">나중에</button>
        </div>
      `;
      
      document.body.appendChild(toast);
      
      document.getElementById('update-refresh').addEventListener('click', () => {
        window.location.reload();
      });
      
      document.getElementById('update-dismiss').addEventListener('click', () => {
        document.body.removeChild(toast);
      });
      
      // 20초 후 자동으로 닫기
      setTimeout(() => {
        if (document.getElementById('update-toast')) {
          document.body.removeChild(toast);
        }
      }, 20000);
    }
  });
}