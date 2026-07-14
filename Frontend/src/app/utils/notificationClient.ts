const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY_HERE";

// Base64 URL string ko Uint8Array mein convert karta hai (VAPID key ke liye)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Browser notification permission check
export function checkPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Permission request karo
export async function requestPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) throw new Error("Notifications not supported");
  return Notification.requestPermission();
}

// Service Worker register + subscription create + backend ko bhejo
export async function subscribe(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications not supported in this browser");
  }

  // If permission was previously denied, give a clear message.
  if (Notification.permission === "denied") {
    throw new Error("Notification permission previously denied. Please enable it in your browser settings.");
  }
  const permission = await requestPermission();
  if (permission !== "granted") throw new Error("Permission denied");

  // Ensure a Service Worker is registered and active.
  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    await navigator.serviceWorker.register('/sw.js');
  }
  // Wait until the Service Worker is ready (active).
  registration = await navigator.serviceWorker.ready;

  console.log('🟢 Service Worker ready, proceeding with subscription');
  // Existing subscription check
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    try {
      // If VAPID key is missing or placeholder, call subscribe without the key.
      const hasValidKey = VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY !== "YOUR_VAPID_PUBLIC_KEY_HERE";
      if (hasValidKey) {
        const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as BufferSource,
        });
      } else {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
        });
      }
      console.log('🟢 Subscription created', subscription);
    } catch (err) {
      console.error('❌ Subscription failed', err);
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  } else {
    console.log('🟢 Existing subscription found');
  }

  // Send subscription to backend
  const res = await fetch(`${BASE_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(subscription),
  });

  if (!res.ok) {
    const errMsg = await res.text();
    console.error('❌ Backend subscribe error', errMsg);
    throw new Error(`Failed to save subscription on server: ${errMsg}`);
  }

  console.log('✅ Subscription saved on server');
  return true;
}

// Unsubscribe karo
export async function unsubscribe(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return true;

  // Backend se bhi delete karo
  await fetch(`${BASE_URL}/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
  return true;
}
