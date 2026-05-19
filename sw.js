// إجازات مرشحة زفتى - Service Worker
var CACHE = 'ezzat-zifta-v2';
var URLS = ['.', 'index.html'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(URLS); }).then(self.skipWaiting())
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) { if (n !== CACHE) return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(r) {
      var clone = r.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      return r;
    }).catch(function() { return caches.match(e.request).then(function(m) { return m || new Response('Offline', {status:503}); }); })
  );
});

// Push Notifications (مستقبل إشعارات Firebase)
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(ex) {
    data = { title: 'إجازات مرشحة زفتى', body: 'لديك إشعار جديد' };
  }
  e.waitUntil(
    self.registration.showNotification(data.title || 'إجازات مرشحة زفتى', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(function(list) {
      for (var c of list) { if (c.url.includes(self.location.host) && 'focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
