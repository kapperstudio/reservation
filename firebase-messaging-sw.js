/* ============================================================
   firebase-messaging-sw.js
   WAJIB diletakkan di ROOT domain:
   https://reservation.barbergo.world/firebase-messaging-sw.js
============================================================ */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCXMkjGhSjnJzZEbZ5_hpZtSEQ-rkl2dbk",
  authDomain: "mattpos.firebaseapp.com",
  projectId: "mattpos",
  storageBucket: "mattpos.firebasestorage.app",
  messagingSenderId: "42578217144",
  appId: "1:42578217144:web:ce1885354d692cce284c4d",
  measurementId: "G-0LZ2SJ8VRJ"
});

const messaging = firebase.messaging();

/* Notifikasi saat app TERTUTUP / background */
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {}, d = payload.data || {};
  self.registration.showNotification(n.title || d.title || 'BarberGo', {
    body: n.body || d.body || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: d.key || d.tag || (d.type === 'chat' ? 'chat' : 'barbergo'),
    renotify: true,
    vibrate: [120, 60, 120],
    data: { link: d.link || '/' }
  });
});

/* Klik notifikasi → fokus / buka app */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data || {}).link || '/';
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) {
        try { c.postMessage({ type: 'NOTIF_CLICK', link }); } catch (e) {}
        return c.focus();
      }
    }
    return clients.openWindow(link);
  })());
});
