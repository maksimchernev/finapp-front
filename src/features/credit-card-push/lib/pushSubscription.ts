import { request } from "@/shared/api/client";

type PushStatus = "unsupported" | "install" | "denied" | "enabled" | "disabled";

export function isInstalledPwa(displayModeStandalone: boolean, iosStandalone: boolean) {
  return displayModeStandalone || iosStandalone;
}

export function decodeVapidPublicKey(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function installed() {
  return isInstalledPwa(
    window.matchMedia("(display-mode: standalone)").matches,
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
}

function supported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getCreditCardPushStatus(): Promise<PushStatus> {
  if (!installed()) return "install";
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.register("/sw.js");
  return await registration.pushManager.getSubscription() ? "enabled" : "disabled";
}

export async function enableCreditCardPush() {
  if (!installed() || !supported()) throw new Error("Установите приложение, чтобы включить уведомления.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Разрешение на уведомления не получено.");

  const registration = await navigator.serviceWorker.register("/sw.js");
  const { publicKey } = await request<{ publicKey: string }>("/api/push/public-key");
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidPublicKey(publicKey),
  });
  try {
    await request<void>("/api/push/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription.toJSON()),
    });
  } catch (error) {
    await subscription.unsubscribe();
    throw error;
  }
}

export async function disableCreditCardPush() {
  if (!supported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await request<void>("/api/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}

export async function unsubscribeLocalPush() {
  if (!supported()) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
}
