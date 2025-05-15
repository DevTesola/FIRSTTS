// Service Worker for TESOLA - 최적화된 버전

const CACHE_NAME = 'tesola-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/landing',
  '/home',
  '/font/TESOLA-Regular.woff2',
  '/font/TESOLA-Bold.woff2',
  '/stars.jpg',
  '/stars3.jpg',
  '/logo.svg',
  '/logo2.png',
  '/favicon.ico',
  '/SPACE.mp4',
  '/placeholder-nft.png',
  '/video-poster.png',
  '/manifest.json'
];

// 이미지 캐싱을 위한 url 패턴
const IMAGE_CACHE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/api\/media\/image\//
];

// 캐시하지 않을 URL 패턴
const NO_CACHE_PATTERNS = [
  /\/api\/staking\//,
  /\/api\/admin\//,
  /\/api\/governance\//,
  /\/api\/leaderboard/,
  /\/api\/auth\//
];

// 설치 이벤트 - 정적 에셋을 미리 캐시
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: 정적 에셋 캐싱 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.error('SW: 정적 캐싱 오류', err);
      })
  );
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('SW: 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('SW: 활성화 및 클레임 중');
      return self.clients.claim();
    })
  );
  
  // 정기적으로 오래된 이미지 캐시 정리
  setInterval(() => cleanImageCache(), 60 * 60 * 1000); // 1시간마다
});

// 이미지 캐시 정리 함수
async function cleanImageCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const now = Date.now();
    
    // 7일 이상 된 이미지 캐시 삭제
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7일
    
    const oldImages = requests.filter(request => {
      const url = new URL(request.url);
      
      // 이미지 캐시만 필터링
      const isImage = IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
      
      if (!isImage) return false;
      
      // 캐시된 시간 확인 - 응답 헤더에서 가져오기
      return cache.match(request).then(response => {
        if (!response) return false;
        
        // 캐시 시간이 담긴 커스텀 헤더가 있는지 확인
        const cachedTime = response.headers.get('sw-cache-time');
        if (!cachedTime) return false;
        
        return (now - parseInt(cachedTime, 10)) > maxAge;
      });
    });
    
    await Promise.all(oldImages.map(request => cache.delete(request)));
    console.log(`SW: ${oldImages.length}개의 오래된 이미지 캐시 정리됨`);
  } catch (err) {
    console.error('SW: 캐시 정리 중 오류', err);
  }
}

// 응답에 캐시 타임스탬프 추가하는 함수
function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.append('sw-cache-time', Date.now().toString());
  
  return response.status === 0 ? 
    response : 
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
}

// fetch 이벤트 - 스태틱 캐시 우선, 이미지는 캐시 백업
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // API 요청 중 캐시하지 않아야 할 경우는 네트워크 우선
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }
  
  // 정적 자산 요청은 캐시 우선, 실패 시 네트워크
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // 유효한 응답만 캐시
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(err => {
              console.error('SW: 네트워크 요청 실패', err);
              // 오프라인 fallback
              return new Response('오프라인 상태입니다', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
    return;
  }
  
  // 이미지 요청 - 네트워크 우선, 실패 시 캐시
  if (IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 유효한 응답만 캐시
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              // 타임스탬프 추가하여 캐시
              cache.put(event.request, addCacheTimestamp(responseToCache));
            });
            
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 제공
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 기타 요청은 기본 처리 
  return;
});

// 푸시 알림 처리
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '새로운 소식이 있습니다!',
      icon: '/logo2.png',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'TESOLA 알림', options)
    );
  } catch (err) {
    console.error('SW: 푸시 알림 처리 오류', err);
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        const url = event.notification.data.url || '/';
        
        // 열린 창이 있다면 포커스
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 열린 창이 없다면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 백그라운드 동기화 
self.addEventListener('sync', event => {
  if (event.tag === 'sync-staking') {
    event.waitUntil(syncStakingData());
  }
});

// 스테이킹 데이터 동기화 함수
async function syncStakingData() {
  try {
    // IndexedDB에서 대기 중인 트랜잭션 가져오기 (예시)
    const db = await openDB();
    const tx = db.transaction('pendingTransactions', 'readonly');
    const store = tx.objectStore('pendingTransactions');
    const pendingTransactions = await store.getAll();
    
    // 서버로 동기화
    for (const transaction of pendingTransactions) {
      await fetch('/api/staking/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      
      // 성공적으로 처리된 트랜잭션 삭제
      const deleteTx = db.transaction('pendingTransactions', 'readwrite');
      const deleteStore = deleteTx.objectStore('pendingTransactions');
      await deleteStore.delete(transaction.id);
    }
  } catch (err) {
    console.error('SW: 스테이킹 동기화 오류', err);
    throw err; // 재시도를 위해 오류 다시 던지기
  }
}

// IndexedDB 열기 함수 (예시)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tesolaDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id' });
      }
    };
  });
}

console.log('TESOLA Service Worker v4 로드됨');