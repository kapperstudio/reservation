/* ============================================================
   firebase-messaging-sw.js — v2.3
   Service Worker Notification + Background Notification
   WAJIB di ROOT: https://reservation.barbergo.world/firebase-messaging-sw.js
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
const ICON   = '/favicon.png';
const BADGE  = '/favicon.png';
const ORIGIN = self.location.origin;

/* ---------------- UTIL ---------------- */
async function anyClientVisible(){
  try{
    const list = await clients.matchAll({ type:'window', includeUncontrolled:true });
    return list.some(c => c.visibilityState === 'visible');
  }catch(e){ return false; }
}

async function focusOrOpen(link, ntype){
  const url = new URL(link || '/', ORIGIN).href;
  try{
    const list = await clients.matchAll({ type:'window', includeUncontrolled:true });
    for(const c of list){
      try{
        await c.focus();
        c.postMessage({ type:'NOTIF_CLICK', link:url, ntype:ntype || '' });
        return c;
      }catch(e){}
    }
  }catch(e){}
  return clients.openWindow(url);
}

/* ============================================================
   1) BACKGROUND NOTIFICATION
   Dipanggil saat app TERTUTUP / semua tab tidak visible.
   ★ Server disarankan kirim DATA-ONLY message (tanpa field
     "notification") agar tampilan dikontrol penuh di sini.
============================================================ */
messaging.onBackgroundMessage(async (payload) => {
  try{
    const d = payload.data || {};
    const n = payload.notification || {};
    const type = d.type || 'info';

    const title = d.title || n.title || 'BarberGo';
    const body  = d.body  || n.body  || '';

    /* Ada tab app yang terlihat → biarkan handler in-app yang
       menampilkan notif (cegah dobel). Kirim d.force='1' untuk paksa. */
    if(await anyClientVisible() && d.force !== '1') return;

    const actions = [];
    if(type === 'chat') actions.push({ action:'open', title:'💬 Buka Chat' });
    if(type === 'resv') actions.push({ action:'open', title:'📋 Lihat History' });

    await self.registration.showNotification(title, {
      body,
      icon: ICON,
      badge: BADGE,
      tag: d.key || d.tag || ('rg-' + type),
      renotify: true,                 /* tag sama tetap bunyi & getar ulang */
      vibrate: [120, 60, 120],
      requireInteraction: false,
      silent: false,                  /* suara sistem OS ikut bunyi */
      data: { link: d.link || '/', type, key: d.key || '' },
      actions
    });
  }catch(e){
    try{
      await self.registration.showNotification('BarberGo', {
        body:'Kamu punya pembaruan baru.', icon:ICON, badge:BADGE
      });
    }catch(_){}
  }
});

/* ============================================================
   2) NOTIFICATION CLICK — fokus tab yang ada / buka tab baru,
      mendukung tombol action di notifikasi
============================================================ */
self.addEventListener('notificationclick', (event) => {
  const notif = event.notification;
  notif.close();

  if(event.action === 'close') return; /* tombol "Tutup" */

  const data = notif.data || {};
  event.waitUntil(focusOrOpen(data.link || '/', data.type));
});

/* ============================================================
   3) NOTIFICATION CLOSE — logging
============================================================ */
self.addEventListener('notificationclose', (event) => {
  const d = event.notification.data || {};
  console.log('[SW] notifikasi ditutup:', d.type || '-', d.key || '-');
});

/* ============================================================
   4) LIFECYCLE — update SW tanpa menunggu tab lama tertutup
============================================================ */
self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await clients.claim(); /* kontrol semua tab sejak sekarang */
    try{ /* bersihkan notifikasi menumpuk */
      const list = await self.registration.getNotifications();
      if(list.length > 50) list.slice(0, list.length - 50).forEach(nn => nn.close());
    }catch(e){}
  })());
});

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if(d === 'SKIP_WAITING' || d.type === 'SKIP_WAITING') self.skipWaiting();
});

/* Subscription berubah (browser refresh token) → diperbarui
   otomatis saat app dibuka berikutnya oleh getTokenAndSave() */
self.addEventListener('pushsubscriptionchange', () => {
  console.warn('[SW] push subscription berubah — token akan di-refresh saat app dibuka');
});
