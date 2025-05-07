// Service Worker for TESOLA NFT image caching

// Cache version - update whenever you make changes to the service worker
const CACHE_VERSION = 'v1';
const CACHE_NAME = `tesola-nft-cache-${CACHE_VERSION}`;

// Resources to precache
const PRECACHE_ASSETS = [
  '/placeholder-nft.png',
  '/slr.png',
  '/logo.svg',
  '/logo2.png'
];

// Images to cache (patterns)
const IMAGE_CACHE_PATTERNS = [
  /\.(jpe?g|png|gif|svg|webp)(\?.*)?$/i,
  /ipfs\//i,
  /arweave\//i
];

// Maximum age for cached items (1 day in seconds)
const MAX_AGE = 24 * 60 * 60;

// Install event - precache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('tesola-nft-cache-') && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if URL should be cached
function shouldCache(url) {
  // Always cache local assets
  if (url.startsWith(self.location.origin)) {
    return true;
  }
  
  // Check image patterns
  return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Fetch event with network-first strategy for images
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip non-cacheable requests
  if (!shouldCache(url.href)) return;
  
  // Network-first strategy with timeout
  event.respondWith(
    Promise.race([
      // Network request with timeout
      new Promise((resolve, reject) => {
        // 5 second timeout for network requests
        const timeoutId = setTimeout(() => {
          reject(new Error('Network request timeout'));
        }, 5000);
        
        fetch(event.request.clone())
          .then((response) => {
            clearTimeout(timeoutId);
            
            // Only cache successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return resolve(response);
            }
            
            // Cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            resolve(response);
          })
          .catch(reject);
      }),
      
      // Cache fallback if network fails or times out
      caches.match(event.request)
        .then((response) => {
          return response || Promise.reject('Cache miss');
        })
    ])
    .catch(() => {
      // If both network and cache fail, try cache as a last resort
      return caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
        .catch(() => {
          // If everything fails for image requests, return placeholder
          if (event.request.url.match(/\.(jpe?g|png|gif|svg|webp)(\?.*)?$/i)) {
            return caches.match('/placeholder-nft.png');
          }
          return new Response('Network and cache both failed', { status: 408 });
        });
    })
  );
});

// Clean up old cache entries periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_OLD_CACHES') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          const now = Date.now();
          return Promise.all(
            keys.map((request) => {
              // Get cached response
              return cache.match(request).then((response) => {
                // Check timestamp header or use response headers date
                const dateHeader = response.headers.get('date');
                const cachedTime = dateHeader ? new Date(dateHeader).getTime() : now;
                
                // Delete if older than MAX_AGE
                if (now - cachedTime > MAX_AGE * 1000) {
                  return cache.delete(request);
                }
                return Promise.resolve();
              });
            })
          );
        });
      })
    );
  }
});