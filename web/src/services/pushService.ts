import { STORAGE_KEYS } from "../config/constants";

// VAPID public key (generated via web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY =
  "BPGIM7JwUADTHBw3uY_3uE6Mg3O9p3hcvgKDr-cKSRhHnSvS18QNMu7RloqoIqzPmofRwl0mc4EXv3I4F4lyitw";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Check if push is supported */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/** Get current push subscription (or null) */
export async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Subscribe to push notifications. Returns the subscription object. */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const reg = await navigator.serviceWorker.ready;

  // Check existing
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    savePushSubscription(sub);
    return sub;
  }

  // Request notification permission if not granted
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return null;

  // Subscribe
  sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  savePushSubscription(sub);
  return sub;
}

/** Unsubscribe from push */
export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getSubscription();
  if (!sub) return false;
  const ok = await sub.unsubscribe();
  if (ok) localStorage.removeItem(STORAGE_KEYS.PUSH_SUBSCRIPTION);
  return ok;
}

/** Save subscription to localStorage (for display / manual sending) */
function savePushSubscription(sub: PushSubscription): void {
  localStorage.setItem(STORAGE_KEYS.PUSH_SUBSCRIPTION, JSON.stringify(sub.toJSON()));
}

/** Get stored subscription JSON (for copy/export) */
export function getStoredSubscription(): string | null {
  return localStorage.getItem(STORAGE_KEYS.PUSH_SUBSCRIPTION);
}
