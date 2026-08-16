import { apiFetch } from './api';

const VAPID_PUBLIC = 'BMgEDEnpAym0uU7vHTkp-2L4cCiQDNAFd4xHoaFyoFez8oOoA_07yjdiBoijawwx0IN2Y5Cd8Nn64qPD7wm33Mk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registraPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (localStorage.getItem('pushRegistered')) return true;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });

    const json = sub.toJSON();
    await apiFetch('/api/allievo/push-subscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    localStorage.setItem('pushRegistered', '1');
    return true;
  } catch (e) {
    console.warn('Push registration failed:', e);
    return false;
  }
}
