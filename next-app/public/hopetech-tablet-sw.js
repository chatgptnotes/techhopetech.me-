// HopeTech Tablet CRM Service Worker
// Provides offline support and caching for the tablet CRM system

const CACHE_NAME = 'hopetech-tablet-crm-v1';
const urlsToCache = [
    '/hopetech-tablet-crm-complete.html',
    '/hopetech-management-dashboard.html',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Network request failed, try to return cached offline page
                    if (event.request.destination === 'document') {
                        return caches.match('/hopetech-tablet-crm-complete.html');
                    }
                });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-visits') {
        event.waitUntil(syncVisits());
    } else if (event.tag === 'sync-leads') {
        event.waitUntil(syncLeads());
    } else if (event.tag === 'sync-voice-notes') {
        event.waitUntil(syncVoiceNotes());
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from HopeTech Tablet CRM',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/favicon.svg'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/favicon.svg'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('HopeTech Tablet CRM', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/hopetech-tablet-crm-complete.html')
        );
    }
});

// Sync functions (to be implemented with actual API calls)
async function syncVisits() {
    try {
        // Get pending visits from IndexedDB
        // Sync with server
        console.log('Syncing visits...');
    } catch (error) {
        console.error('Failed to sync visits:', error);
    }
}

async function syncLeads() {
    try {
        // Get pending leads from IndexedDB
        // Sync with server
        console.log('Syncing leads...');
    } catch (error) {
        console.error('Failed to sync leads:', error);
    }
}

async function syncVoiceNotes() {
    try {
        // Get pending voice notes from IndexedDB
        // Sync with server
        console.log('Syncing voice notes...');
    } catch (error) {
        console.error('Failed to sync voice notes:', error);
    }
}