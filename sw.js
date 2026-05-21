// ===== إجازات مرشحة زفتى - Service Worker المطور والمدمج بـ Firebase =====

// 1. استيراد مكتبات Firebase المتوافقة مع الـ Service Workers بالخلفية
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

var CACHE = 'ezzat-zifta-v2';
var URLS = ['.', 'index.html'];

// إعدادات مشروع Firebase الحر الجديد الخاص بك لضمان فك تشفير الإشعارات
const firebaseConfig = {
  apiKey: "AIzaSyAp5KyYkeUZbCJZTXc8xF37WsxK2q4QAVU",
  authDomain: "zeft-notifications.firebaseapp.com",
  projectId: "zeft-notifications",
  storageBucket: "zeft-notifications.firebasestorage.app",
  messagingSenderId: "107702101800098464750",
  appId: "1:107702101800098464750:web:94587c36a864eecc7b3555"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 2. إدارة التخزين المؤقت (Cache Lifecycle)
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

// 3. استراتيجية جلب البيانات والـ Offline Mode للـ PWA
self.addEventListener('fetch', function(e) {
  // استثناء طلبات Firebase و Google Apps Script من الـ Cache لضمان استقرار العمل الفوري
  if (e.request.url.includes('firebase') || e.request.url.includes('script.google')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request).then(function(r) {
      var clone = r.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      return r;
    }).catch(function() { 
      return caches.match(e.request).then(function(m) { 
        return m || new Response('Offline', {status:503}); 
      }); 
    })
  );
});

// 4. معالجة إشعارات Firebase في الخلفية (Background Messaging)
// بدلاً من حدث الـ push العادي، نستخدم معالج Firebase لضمان التقاط الـ Payload بدقة
messaging.onBackgroundMessage(function(payload) {
  console.log('[sw.js] Received background message: ', payload);
  
  var title = payload.notification?.title || 'إجازات مرشحة زفتى';
  var body = payload.notification?.body || 'لديك إشعار جديد معلق.';
  
  // استخراج رابط التوجيه عند الضغط على الإشعار إن وجد
  var targetUrl = payload.data?.url || '/';

  var notificationOptions = {
    body: body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: targetUrl }
  };

  return self.registration.showNotification(title, notificationOptions);
});

// 5. إدارة حدث الضغط على الإشعار من قبل الموظف أو المدير
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = e.notification.data?.url || '/';
  
  e.waitUntil(
    clients.matchAll({type:'window'}).then(function(list) {
      // إذا كان التطبيق مفتوحاً بالفعل في المتصفح، قم بعمل Focus عليه بدلاً من فتحه في نافذة جديدة
      for (var c of list) { 
        if (c.url.includes(self.location.host) && 'focus' in c) return c.focus(); 
      }
      // إذا كان مغلقاً، افتح نافذة جديدة بالرابط المحدد
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
