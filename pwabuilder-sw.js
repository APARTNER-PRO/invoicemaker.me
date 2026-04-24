// pwabuilder-sw.js

// Define a unique cache name
const CACHE_NAME = 'makerinvoice-cache-v2';

// List of files to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/terms.html',
  '/privacy.html',
  '/refund.html',
  '/templates/index.html',
  '/invoices/index.html',
  '/invoices/',
  '/clients/index.html',
  '/assets/css/bulma.min.css',
  '/assets/css/core.css',
  '/assets/css/datepicker.css',
  '/assets/css/fonts.css',
  '/assets/js/core.js',
  '/assets/js/datepicker.js',
  '/assets/js/jq.js',
  '/assets/js/jq.valid.js',
  '/assets/js/js.js',
  '/assets/js/manup.min.js',
];

// Install event - caching files
self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available, else fetch from network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time-use object
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time-use object
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
