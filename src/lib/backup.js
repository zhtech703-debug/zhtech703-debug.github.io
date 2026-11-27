import {
  accentPalettes,
  budgetCategoryKeys,
  budgetLimits,
  cardKinds,
  cardThemes,
  categoryMeta,
  seedSettings,
} from "../data.js";
import { DEBT_DIRECTIONS, debtPaid } from "./debts.js";

/**
 * Backup, restore, ekspor CSV, dan berbagi file — semuanya lokal di browser.
 * Tidak ada file yang diunggah dan tidak ada kredensial bank yang disentuh.
 */

export function localDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildBackup({
  accounts,
  budgets,
  transactions,
  debts = [],
  settings = seedSettings,
}) {
  return {
    app: "ZhKas",
    version: 2,
    exportedAt: new Date().toISOString(),
    accounts: accounts.map((account) => ({ ...account })),
    budgets: { ...budgets },
    transactions: transactions.map((transaction) => ({
      ...transaction,
      date: transaction.date.toISOString(),
    })),
    debts: debts.map((debt) => ({
      ...debt,
      date: debt.date.toISOString(),
      dueDate: debt.dueDate ? debt.dueDate.toISOString() : null,
      createdAt: debt.createdAt ? debt.createdAt.toISOString() : null,
      payments: (debt.payments ?? []).map((payment) => ({
        ...payment,
        date: payment.date.toISOString(),
      })),
    })),
    settings: {
      ...settings,
      cloud: { ...(settings.cloud ?? {}) },
    },
  };
}

/** Backup berasal dari file pengguna: jangan izinkan CSS arbitrary/URL. */
function sanitizeStyle(value, fallback) {
  const text = String(value ?? "").trim();
  if (
    !text ||
    text.length > 300 ||
    /url\(|expression\(|[;{}]|<|>/i.test(text)
  ) {
    return fallback;
  }
  return text;
}

function normalizeBudgets(raw) {
  const next = { ...budgetLimits };
  budgetCategoryKeys.forEach((category) => {
    const value = Number(raw?.[category]);
    if (Number.isFinite(value) && value >= 0) next[category] = Math.round(value);
  });
  return next;
}

function normalizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const cloud =
    source.cloud && typeof source.cloud === "object" ? source.cloud : {};
  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, min), max);
  };

  return {
    ...seedSettings,
    name:
      String(source.name ?? seedSettings.name).trim().slice(0, 40) ||
      seedSettings.name,
    incomeTarget: Math.max(Math.round(Number(source.incomeTarget) || 0), 0),
    savingsTargetPercent: Math.round(
      clamp(source.savingsTargetPercent, 0, 100, 20),
    ),
    emergencyFundMonths: Math.round(
      clamp(source.emergencyFundMonths, 0, 24, 3),
    ),
    theme: source.theme === "light" ? "light" : "dark",
    accent:
      accentPalettes && accentPalettes[source.accent] ? source.accent : "glacier",
    cloud: {
      clientId: String(cloud.clientId ?? "").trim().slice(0, 200),
      email: String(cloud.email ?? "").trim().slice(0, 120),
      lastSyncAt: cloud.lastSyncAt ? String(cloud.lastSyncAt) : null,
    },
  };
}

function normalizeDebt(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const counterparty = String(raw.counterparty ?? "").trim();
  const amount = Math.round(Number(raw.amount));
  if (!counterparty || !Number.isFinite(amount) || amount <= 0) return null;

  const date = new Date(raw.date);
  if (Number.isNaN(date.getTime())) return null;
  const dueDate = raw.dueDate ? new Date(raw.dueDate) : null;
  const direction = raw.direction === "payable" ? "payable" : "receivable";

  const payments = (Array.isArray(raw.payments) ? raw.payments : [])
    .map((payment, paymentIndex) => {
      const paymentAmount = Math.round(Number(payment?.amount));
      const paymentDate = new Date(payment?.date);
      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0 ||
        Number.isNaN(paymentDate.getTime())
      ) {
        return null;
      }
      return {
        id: String(payment?.id ?? `DBT-PAY-R${index}-${paymentIndex}`),
        amount: paymentAmount,
        date: paymentDate,
        note: String(payment?.note ?? "Pelunasan").slice(0, 120),
      };
    })
    .filter(Boolean);

  return {
    id: String(raw.id ?? `DBT-R${index}`),
    direction,
    counterparty: counterparty.slice(0, 60),
    amount,
    date,
    dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null,
    note: String(raw.note ?? "").slice(0, 200),
    payments,
    createdAt: new Date(raw.createdAt ?? raw.date),
  };
}

/** Normalisasi satu kartu sumber dana; dipakai backup dan penyimpanan lokal. */
export function normalizeAccount(raw, index = 0) {
  const bank = String(raw?.bank ?? "").trim().slice(0, 40);
  if (!bank) return null;

  const balance = Number(raw?.balance);
  const compact = (value) => String(value ?? "").replace(/\s+/g, "");
  const matchedTheme = Object.entries(cardThemes).find(
    ([, preset]) => compact(preset.background) === compact(raw?.background),
  )?.[0];
  const theme =
    raw?.theme && cardThemes[raw.theme]
      ? raw.theme
      : matchedTheme ?? "midnight";
  const preset = cardThemes[theme];

  const rawKind = String(raw?.kind ?? "").trim();
  const rawCardType = String(raw?.cardType ?? "").trim();
  const knownKinds = new Set(cardKinds.map((item) => item.id));
  const cardType = knownKinds.has(rawCardType)
    ? rawCardType
    : knownKinds.has(rawKind)
      ? rawKind
      : "Debit";

  return {
    id: String(raw?.id ?? `ACC-R${index}-${Date.now().toString(36)}`),
    bank,
    theme,
    kind: rawKind.slice(0, 24) || "Rekening",
    cardType,
    balance: Number.isFinite(balance) ? Math.round(balance) : 0,
    cardNumber:
      String(raw?.cardNumber ?? "••••  ••••  ••••  ••••").trim().slice(0, 32) ||
      "••••  ••••  ••••  ••••",
    holder: String(raw?.holder ?? "PEMILIK").trim().slice(0, 40) || "PEMILIK",
    expiry: String(raw?.expiry ?? "--/--").trim().slice(0, 12) || "--/--",
    network: String(raw?.network ?? "GPN").trim().toUpperCase().slice(0, 16) || "GPN",
    background: sanitizeStyle(raw?.background, preset.background),
    glow: sanitizeStyle(raw?.glow, preset.glow),
    accent: sanitizeStyle(raw?.accent, preset.accent),
  };
}

/**
 * Validasi + normalisasi backup. Melempar Error dengan pesan yang aman
 * ditampilkan ke pengguna bila struktur file tidak cocok.
 */
export function normalizeBackup(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("File backup tidak dikenali.");
  }
  if (raw.app && raw.app !== "ZhKas") {
    throw new Error("File ini bukan backup ZhKas.");
  }

  if (
    !Array.isArray(raw.accounts) &&
    !Array.isArray(raw.transactions) &&
    !Array.isArray(raw.debts)
  ) {
    throw new Error("File backup tidak dikenali.");
  }

  const accountSource = Array.isArray(raw.accounts) ? raw.accounts : [];
  const accounts = accountSource
    .map((account, index) => normalizeAccount(account, index))
    .filter(Boolean);

  const transactionSource = Array.isArray(raw.transactions)
    ? raw.transactions
    : [];

  const transactions = transactionSource
    .map((transaction, index) => {
      const date = new Date(transaction?.date);
      if (Number.isNaN(date.getTime())) return null;

      const amount = Math.round(Number(transaction?.amount));
      if (!Number.isFinite(amount) || amount <= 0) return null;

      const name = String(transaction?.name ?? "").trim();
      if (!name) return null;

      const type = transaction?.type === "income" ? "income" : "expense";
      const category =
        type === "income"
          ? "pemasukan"
          : categoryMeta[transaction?.category]
            ? transaction.category
            : "belanja";

      const accountName = String(
        transaction?.account ?? accounts[0]?.bank ?? "Tanpa kartu",
      );
      const accountId =
        transaction?.accountId &&
        accounts.some((account) => account.id === transaction.accountId)
          ? String(transaction.accountId)
          : accounts.find(
              (account) =>
                account.bank.trim().toLowerCase() ===
                accountName.trim().toLowerCase(),
            )?.id;

      return {
        id: String(transaction?.id ?? `ZHK-R${index}`),
        name,
        category,
        amount,
        type,
        date,
        account: accountId
          ? accounts.find((account) => account.id === accountId)?.bank ??
            accountName
          : accountName,
        ...(accountId ? { accountId } : {}),
        note: String(transaction?.note ?? "Dipulihkan dari backup"),
        status: "Berhasil",
        source:
          transaction?.source === "manual"
            ? "manual"
            : transaction?.source === "debt"
              ? "debt"
              : "restored",
        ...(transaction?.debtId ? { debtId: String(transaction.debtId) } : {}),
      };
    })
    .filter(Boolean);

  const debts = (Array.isArray(raw.debts) ? raw.debts : [])
    .map(normalizeDebt)
    .filter(Boolean);

  return {
    accounts,
    budgets: normalizeBudgets(raw.budgets),
    transactions: transactions.sort((a, b) => b.date - a.date),
    debts,
    settings: normalizeSettings(raw.settings),
  };
}

export function isEncryptedBackup(raw) {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      raw.format === "zhkas-encrypted" &&
      typeof raw.ciphertext === "string",
  );
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveKey(passphrase, salt, iterations) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Browser ini tidak mendukung enkripsi lokal.");
  }

  const material = await subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

const ITERATIONS = 210_000;

export async function encryptBackup(payload, passphrase) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Browser ini tidak mendukung enkripsi lokal.");
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const plaintext = encoder.encode(JSON.stringify(payload));
  const cipher = await subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    app: "ZhKas",
    format: "zhkas-encrypted",
    version: 2,
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipher)),
  };
}

export async function decryptBackup(envelope, passphrase) {
  if (!isEncryptedBackup(envelope)) {
    throw new Error("File bukan backup terenkripsi ZhKas.");
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Browser ini tidak mendukung enkripsi lokal.");
  }

  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const iterations = Number(envelope.iterations);
  if (
    salt.length !== 16 ||
    iv.length !== 12 ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 1_000_000 ||
    typeof envelope.ciphertext !== "string" ||
    envelope.ciphertext.length === 0
  ) {
    throw new Error("Format backup terenkripsi tidak valid.");
  }
  const key = await deriveKey(passphrase, salt, iterations);
  const cipher = base64ToBytes(envelope.ciphertext);
  const plain = await subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);

  return JSON.parse(decoder.decode(plain));
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function transactionsToCsv(transactions) {
  const header = [
    "tanggal",
    "keterangan",
    "kategori",
    "tipe",
    "jumlah",
    "rekening",
    "catatan",
  ];

  const rows = transactions.map((transaction) => [
    localDateStamp(transaction.date),
    transaction.name,
    categoryMeta[transaction.category]?.label ?? transaction.category,
    transaction.type === "income" ? "masuk" : "keluar",
    transaction.amount,
    transaction.account,
    transaction.note,
  ]);

  return `\uFEFF${[header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n")}`;
}

export function debtsToCsv(debts) {
  const header = [
    "arah",
    "pihak",
    "total",
    "dibayar",
    "sisa",
    "tanggal",
    "jatuh_tempo",
    "status",
    "catatan",
  ];

  const rows = debts.map((debt) => {
    const paid = debtPaid(debt);
    const outstanding = Math.max(debt.amount - paid, 0);
    return [
      DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
      debt.counterparty,
      debt.amount,
      paid,
      outstanding,
      localDateStamp(debt.date),
      debt.dueDate ? localDateStamp(debt.dueDate) : "",
      outstanding <= 0 ? "Lunas" : "Berjalan",
      debt.note,
    ];
  });

  return `\uFEFF${[header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n")}`;
}

function triggerDownload(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Chrome Android sometimes cancels the save if the URL is revoked immediately.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadFile(fileName, content, mime = "application/json") {
  triggerDownload(fileName, new Blob([content], { type: mime }));
}

export async function downloadBytes(fileName, bytes, mime) {
  // Di APK, anchor download dari blob sering diblokir WebView. Simpan file ke
  // folder Documents/ZhKas agar tetap bisa ditemukan lewat Files/Gallery.
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      await Filesystem.writeFile({
        path: `ZhKas/${safeName}`,
        data: bytesToBase64(bytes),
        directory: Directory.Documents,
        recursive: true,
      });
      return `Documents/ZhKas/${safeName}`;
    }
  } catch (nativeError) {
    // Lanjut ke unduhan browser bila plugin native tidak tersedia.
  }
  triggerDownload(fileName, new Blob([bytes], { type: mime }));
  return null;
}

/**
 * Bagikan file lewat share sheet perangkat. Mengembalikan true bila berhasil,
 * "cancelled" bila pengguna membatalkan, dan false bila tidak didukung/gagal,
 * sehingga UI bisa membedakan pembatalan dari keberhasilan.
 */
export async function shareBytes({ fileName, bytes, mime, title, text }) {
  // Di APK, WebView Android tidak selalu mengekspos Web Share API. Pakai share
  // sheet native Capacitor bila tersedia, dengan file sementara di cache.
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      try {
        const [{ Filesystem, Directory }, { Share }] = await Promise.all([
          import("@capacitor/filesystem"),
          import("@capacitor/share"),
        ]);
        const path = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        await Filesystem.writeFile({
          path,
          data: bytesToBase64(bytes),
          directory: Directory.Cache,
          recursive: true,
        });
        const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
        await Share.share({
          title: title ?? "ZhKas",
          text: text ?? "Salinan data ZhKas",
          files: [uri],
          dialogTitle: title ?? "Bagikan dari ZhKas",
        });
        setTimeout(() => {
          Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(
            () => {},
          );
        }, 60_000);
        return true;
      } catch (nativeError) {
        const message = String(nativeError?.message ?? "").toLowerCase();
        if (message.includes("cancel") || message.includes("abort")) {
          return "cancelled";
        }
        // Fall through ke Web Share / unduhan bila plugin native gagal.
      }
    }
  } catch (coreError) {
    // Berjalan di browser biasa; abaikan.
  }

  try {
    if (typeof navigator === "undefined" || !navigator.share) return false;

    const file = new File([bytes], fileName, { type: mime });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      return false;
    }

    await navigator.share({
      files: [file],
      title: title ?? "ZhKas",
      text: text ?? "Salinan data ZhKas",
    });
    return true;
  } catch (error) {
    if (error?.name === "AbortError") return "cancelled";
    return false;
  }
}

/**
 * Simpan file dengan prioritas share sheet di iOS, dengan fallback unduhan
 * yang sama seperti Android. `deps` bisa disuntik untuk pengujian.
 */
export async function saveBytes({
  fileName,
  bytes,
  mime,
  title,
  text,
  preferShare = false,
  deps = { shareBytes, downloadBytes },
}) {
  const shared = preferShare
    ? await deps.shareBytes({ fileName, bytes, mime, title, text })
    : false;

  if (shared === true) return { outcome: "shared" };
  if (shared === "cancelled") return { outcome: "cancelled" };

  const path = await deps.downloadBytes(fileName, bytes, mime);
  if (path) return { outcome: "saved", path };

  return { outcome: "downloaded" };
}

export function backupFileName(encrypted) {
  return `zhkas-backup-${localDateStamp()}.${encrypted ? "zhkas" : "json"}`;
}

export function csvFileName() {
  return `zhkas-transaksi-${localDateStamp()}.csv`;
}

export function officeFileName(prefix, extension) {
  return `zhkas-${prefix}-${localDateStamp()}.${extension}`;
}
