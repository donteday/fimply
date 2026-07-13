const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

async function getSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function subscribe(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
    return sub;
  } catch {
    return null;
  }
}

async function unsubscribe(): Promise<void> {
  const sub = await getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}

export async function requestAndEnable(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  if (result !== 'granted') return false;
  const sub = await subscribe();
  return sub !== null;
}

export async function ensureSubscribed(): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const existing = await getSubscription();
  if (!existing) await subscribe();
}

export async function enableReminder(): Promise<void> {
  await ensureSubscribed();
  await fetch('/api/push/reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true }) });
}

export async function disableReminder(): Promise<void> {
  await fetch('/api/push/reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false }) });
}

export async function enableMorningBrief(): Promise<void> {
  await ensureSubscribed();
}

export async function disableMorningBrief(): Promise<void> {
  // nothing to cancel server-side — server checks morningBriefEnabled flag
}

export async function sendMorningText(text: string): Promise<void> {
  await fetch('/api/push/morning-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Legacy stubs kept so Settings.tsx import doesn't break
export function scheduleReminder() {}
export function cancelReminder() {}
export function scheduleMorningBriefing(_text: string) {}
export function cancelMorningBriefing() {}
