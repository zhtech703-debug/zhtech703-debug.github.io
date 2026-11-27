/** Deteksi platform ringan tanpa React; dipakai untuk gating khusus iOS. */
export function isIOS() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent ?? "";
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;

  // iPadOS 13+ melaporkan UA Macintosh, tapi layarnya mendukung multi-touch.
  if (/Macintosh/.test(userAgent) && (navigator.maxTouchPoints ?? 0) > 1) {
    return true;
  }

  return false;
}
