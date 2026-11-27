/**
 * Sinkronisasi opsional ke Google Drive (appDataFolder) memakai OAuth token
 * dari Google Identity Services. Token hanya hidup di memori tab ini dan tidak
 * pernah disimpan ke localStorage. Tidak ada kredensial bank yang disentuh.
 *
 * Catatan: Client ID OAuth adalah identitas publik aplikasi, bukan rahasia.
 * Pengguna membuatnya sendiri di Google Cloud Console dan menempelkannya di
 * menu Sinkronisasi.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_SCOPE =
  "openid email profile https://www.googleapis.com/auth/drive.appdata";

let gisPromise = null;
let tokenClient = null;

export function loadGoogleIdentity() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity hanya tersedia di browser."));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-zhkas-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Gagal memuat Google Identity.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.zhkasGis = "1";
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(
        new Error(
          "Gagal memuat Google Identity. Periksa koneksi internet lalu coba lagi.",
        ),
      );
    };
    document.head.appendChild(script);
  });

  return gisPromise;
}

export async function connectGoogle(clientId) {
  if (!clientId || !clientId.trim()) {
    throw new Error("Isi Google OAuth Client ID terlebih dahulu.");
  }

  await loadGoogleIdentity();

  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: GOOGLE_SCOPE,
        callback: async (response) => {
          if (response.error) {
            reject(
              new Error(
                response.error_description ||
                  "Izin Google ditolak atau dibatalkan.",
              ),
            );
            return;
          }

          const expiresAt =
            Date.now() + Number(response.expires_in || 3600) * 1000;

          try {
            const user = await getUserInfo(response.access_token);
            resolve({
              token: response.access_token,
              expiresAt,
              user,
            });
          } catch (error) {
            reject(error);
          }
        },
        error_callback: (error) => {
          reject(
            new Error(
              error?.message ||
                "Jendela izin Google tidak bisa dibuka. Coba di Chrome.",
            ),
          );
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      reject(
        new Error(
          error?.message ||
            "OAuth Google belum dikonfigurasi untuk alamat aplikasi ini.",
        ),
      );
    }
  });
}

export async function revokeGoogleToken(token) {
  if (!token) return;
  try {
    await loadGoogleIdentity();
    window.google.accounts.oauth2.revoke(token, () => {});
  } catch {
    // Token tetap kedaluwarsa sendiri; kegagalan revoke tidak boleh memblokir UI.
  }
}

export function isTokenFresh(session) {
  return Boolean(
    session?.token && session.expiresAt && session.expiresAt > Date.now() + 30_000,
  );
}

async function getUserInfo(token) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Tidak bisa membaca profil Google. Coba hubungkan ulang.");
  }

  const profile = await response.json();
  return {
    name: profile.name || profile.email || "Akun Google",
    email: profile.email || "",
  };
}

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

async function driveFetch(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = "";
    try {
      const payload = await response.json();
      message = payload?.error?.message ?? "";
    } catch {
      // Respons bukan JSON.
    }

    if (response.status === 401) {
      throw new Error("Sesi Google berakhir. Hubungkan ulang lalu coba lagi.");
    }
    throw new Error(message || `Google Drive error (${response.status}).`);
  }

  return response;
}

export function buildMultipartBody(metadata, content, boundary) {
  return [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export async function uploadBackup(token, { fileName, content }) {
  const boundary = `zhkas_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metadata = {
    name: fileName,
    parents: ["appDataFolder"],
    mimeType: "application/json",
    appProperties: { app: "ZhKas", format: "encrypted-backup" },
  };

  const response = await driveFetch(
    token,
    `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,name,modifiedTime,size`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: buildMultipartBody(metadata, content, boundary),
    },
  );

  return response.json();
}

export async function listBackups(token) {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    orderBy: "modifiedTime desc",
    pageSize: "50",
    q: "trashed=false",
    fields: "files(id,name,modifiedTime,size)",
  });

  const response = await driveFetch(token, `${DRIVE_API}/files?${params}`);
  const payload = await response.json();
  return Array.isArray(payload.files) ? payload.files : [];
}

export async function downloadBackup(token, fileId) {
  const response = await driveFetch(
    token,
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`,
  );
  return response.text();
}

export async function deleteBackup(token, fileId) {
  await driveFetch(
    token,
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}`,
    { method: "DELETE" },
  );
}

export function formatCloudSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1_048_576) return `${(value / 1_048_576).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

export function formatCloudDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", ".");
}
