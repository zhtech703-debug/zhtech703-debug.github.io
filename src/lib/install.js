import { useEffect, useState } from "react";

/**
 * Helper instalasi PWA. Chrome memicu `beforeinstallprompt` hanya bila
 * aplikasi memenuhi syarat (HTTPS/localhost, manifest, service worker, ikon).
 * Di lingkungan dev service worker tidak didaftarkan, jadi gunakan
 * `npm run build && npm run preview` untuk menguji instalasi.
 */

let deferredPrompt = null;
let initialized = false;
const subscribers = new Set();

function emit() {
  subscribers.forEach((callback) => callback());
}

export function initInstallPrompt() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

export function getInstallMenuState(state) {
  const { canInstall = false, standalone = false, ios = false } = state ?? {};

  if (standalone) {
    return {
      title: "Instal aplikasi",
      description: "ZhKas sudah terpasang.",
      disabled: true,
      notice: null,
    };
  }

  if (canInstall) {
    return {
      title: "Instal aplikasi",
      description: "Tambahkan ke layar utama.",
      disabled: false,
      notice: null,
    };
  }

  if (ios) {
    return {
      title: "Instal aplikasi",
      description: "Di iPhone/iPad: ketuk Bagikan → Tambahkan ke Layar Utama.",
      disabled: false,
      notice:
        "Ketuk tombol Bagikan di Safari, lalu pilih Tambahkan ke Layar Utama.",
    };
  }

  return {
    title: "Instal aplikasi",
    description: "Gunakan Chrome untuk instalasi.",
    disabled: true,
    notice: null,
  };
}

export function getInstallSnapshot() {
  return {
    canInstall: Boolean(deferredPrompt),
    standalone: isStandalone(),
    online: typeof navigator === "undefined" ? true : navigator.onLine,
  };
}

export function subscribeInstall(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: "unavailable" };

  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return choice;
}

export function useInstallState() {
  const [state, setState] = useState(getInstallSnapshot);

  useEffect(() => {
    initInstallPrompt();
    const unsubscribe = subscribeInstall(() => setState(getInstallSnapshot()));
    const refresh = () => setState(getInstallSnapshot());
    const media = window.matchMedia?.("(display-mode: standalone)");

    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    media?.addEventListener?.("change", refresh);

    return () => {
      unsubscribe();
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      media?.removeEventListener?.("change", refresh);
    };
  }, []);

  return state;
}
