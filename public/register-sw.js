// Service Worker Registration
// This script registers the service worker for NFT image caching

// Register the service worker only in production to avoid development friction
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Trigger cache cleanup every hour
        setInterval(() => {
          if (registration.active) {
            registration.active.postMessage({ type: 'CLEAN_OLD_CACHES' });
          }
        }, 60 * 60 * 1000); // 1 hour
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}