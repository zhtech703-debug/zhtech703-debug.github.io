import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  EyeOff,
  HardDrive,
  Link2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useFinance } from "../lib/store";
import {
  buildBackup,
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
  normalizeBackup,
} from "../lib/backup";
import {
  connectGoogle,
  deleteBackup,
  downloadBackup,
  formatCloudDate,
  formatCloudSize,
  listBackups,
  revokeGoogleToken,
  uploadBackup,
} from "../lib/cloud";
import { SheetShell, InfoNote, ErrorNote, CancelButton, SubmitButton } from "./SheetKit";

export default function CloudSheet({ open, onClose, onNotify }) {
  const { accounts, budgets, debts, restoreData, settings, transactions, updateSettings } =
    useFinance();
  const [clientId, setClientId] = useState(settings.cloud?.clientId ?? "");
  const [session, setSession] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [backups, setBackups] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [cloudPass, setCloudPass] = useState("");
  const [showCloudPass, setShowCloudPass] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restorePass, setRestorePass] = useState("");
  const [showRestorePass, setShowRestorePass] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientId(settings.cloud?.clientId ?? "");
    setSession(null);
    setBackups([]);
    setConnecting(false);
    setBusy(false);
    setError("");
    setMessage("");
    setCloudPass("");
    setShowCloudPass(false);
    setRestoreTarget(null);
    setRestorePass("");
    setShowRestorePass(false);
  }, [open, settings.cloud?.clientId]);

  useEffect(() => {
    if (open) return undefined;
    setCloudPass("");
    setRestorePass("");
    setRestoreTarget(null);
  }, [open]);

  async function handleConnect() {
    setError("");
    setMessage("");
    setConnecting(true);
    try {
      const result = await connectGoogle(clientId);
      setSession(result);
      updateSettings({
        cloud: {
          clientId: clientId.trim(),
          email: result.user.email,
          lastSyncAt: new Date().toISOString(),
        },
      });
      setMessage(`Terhubung sebagai ${result.user.email}.`);
      await refreshList(result.token);
    } catch (connectError) {
      setError(connectError?.message || "Gagal menghubungkan Google.");
    } finally {
      setConnecting(false);
    }
  }

  async function refreshList(token) {
    const activeToken = token ?? session?.token;
    if (!activeToken) return;
    setLoadingList(true);
    setError("");
    try {
      const files = await listBackups(activeToken);
      setBackups(files);
    } catch (listError) {
      setError(listError?.message || "Gagal membaca daftar backup.");
    } finally {
      setLoadingList(false);
    }
  }

  async function handleUpload() {
    if (!session?.token) {
      setError("Hubungkan Google terlebih dahulu.");
      return;
    }
    if (cloudPass.trim().length < 8) {
      setError("Passphrase backup minimal 8 karakter.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = buildBackup({
        accounts,
        budgets,
        transactions,
        debts,
        settings,
      });
      // Enkripsi dulu di perangkat. Passphrase tidak pernah dikirim/disimpan.
      const envelope = await encryptBackup(payload, cloudPass);
      const fileName = `zhkas-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.zhkas`;
      const file = await uploadBackup(session.token, {
        fileName,
        content: JSON.stringify(envelope),
      });
      setCloudPass("");
      updateSettings({
        cloud: {
          clientId: clientId.trim(),
          email: session.user.email,
          lastSyncAt: new Date().toISOString(),
        },
      });
      setMessage(
        `Backup terenkripsi "${file.name}" tersimpan di Drive appDataFolder.`,
      );
      await refreshList(session.token);
    } catch (uploadError) {
      setError(uploadError?.message || "Unggah backup gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(fileId, fileName) {
    if (!session?.token) return;
    setBusy(true);
    setError("");
    setMessage("");
    setRestoreTarget(null);
    setRestorePass("");
    try {
      const text = await downloadBackup(session.token, fileId);
      const data = JSON.parse(text);
      if (isEncryptedBackup(data)) {
        setRestoreTarget({ fileId, fileName, envelope: data });
        setMessage("Backup terenkripsi. Masukkan passphrase untuk membukanya.");
      } else {
        const payload = normalizeBackup(data);
        setRestoreTarget({ fileId, fileName, payload });
        setMessage(
          "Backup lama tidak terenkripsi. Periksa ringkasan sebelum memulihkan.",
        );
      }
    } catch (downloadError) {
      setError(downloadError?.message || "Unduh backup gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreCloud() {
    if (!restoreTarget) return;
    setError("");
    if (restoreTarget.envelope && !restorePass) {
      setError("Masukkan passphrase backup.");
      return;
    }

    setBusy(true);
    let payload = restoreTarget.payload;
    try {
      if (restoreTarget.envelope) {
        const raw = await decryptBackup(restoreTarget.envelope, restorePass);
        payload = normalizeBackup(raw);
      }
    } catch {
      setError("Passphrase salah atau file backup rusak.");
      setBusy(false);
      return;
    }
    setBusy(false);

    const confirmed = window.confirm(
      `Pulihkan data dari "${restoreTarget.fileName}"? Ini mengganti seluruh data di perangkat ini.`,
    );
    if (!confirmed) return;

    try {
      const summary = restoreData(payload);
      setRestoreTarget(null);
      setRestorePass("");
      setMessage(`${summary.transactions} transaksi dipulihkan dari Drive.`);
      onNotify?.(`${summary.transactions} transaksi dipulihkan dari Google Drive.`);
    } catch (restoreError) {
      setError(restoreError?.message || "Backup gagal dipulihkan.");
    }
  }

  async function handleDelete(fileId) {
    if (!session?.token) return;
    const confirmed = window.confirm("Hapus backup ini dari Drive?");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      await deleteBackup(session.token, fileId);
      setMessage("Backup dihapus dari Drive.");
      await refreshList(session.token);
    } catch (deleteError) {
      setError(deleteError?.message || "Hapus backup gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (session?.token) await revokeGoogleToken(session.token);
    setSession(null);
    setBackups([]);
    setCloudPass("");
    setRestoreTarget(null);
    setRestorePass("");
    setMessage("Koneksi Google diputus. Token dan passphrase dihapus dari memori.");
  }

  const connected = Boolean(session?.token);

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      label="Sinkronisasi Google Drive"
      title="Gmail & Drive"
      subtitle="Hubungkan akun Google untuk menyimpan backup di Drive appDataFolder (folder privat aplikasi). Token hanya hidup di memori tab ini."
      badge={
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/15 bg-sky-300/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-glacier">
          <Cloud size={10} strokeWidth={2.1} />
          Opsional
        </span>
      }
    >
      <div className="mt-4 rounded-[22px] border border-white/[0.065] bg-white/[0.022] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] border border-mint/[0.12] bg-mint/[0.07] text-mint">
            <ShieldCheck size={15} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-slate-200">
              Cakupan yang diminta
            </p>
            <p className="mt-1 text-[8.5px] leading-relaxed text-slate-500">
              Hanya <code className="text-slate-400">drive.appdata</code> (folder
              privat ZhKas) + profil dasar. Tidak ada akses ke Gmail, file
              pribadi, atau inbox. Gmail dipakai lewat share sheet Android, bukan
              API.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Google OAuth Client ID
        </label>
        <input
          type="text"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          placeholder="xxxx.apps.googleusercontent.com"
          className="mt-1.5 w-full rounded-[14px] border border-white/[0.075] bg-white/[0.025] px-3.5 py-2.5 text-[10px] font-medium text-white outline-none placeholder:text-slate-600 focus:border-sky-200/25"
        />
        <p className="mt-1.5 text-[8px] leading-relaxed text-slate-600">
          Buat di Google Cloud Console → Credentials → OAuth client ID (Web
          application), lalu tambahkan origin aplikasi. Panduan di docs/GOOGLE_DRIVE.md.
        </p>
      </div>

      {connected && (
        <div className="mt-4">
          <label className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Passphrase backup Drive
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-[14px] border border-white/[0.075] bg-white/[0.025] px-3 py-2.5 focus-within:border-sky-200/25">
            <input
              type={showCloudPass ? "text" : "password"}
              value={cloudPass}
              onChange={(event) => {
                setCloudPass(event.target.value);
                setError("");
              }}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              aria-label="Passphrase untuk backup Drive"
              className="w-full bg-transparent text-[10px] font-medium text-white outline-none placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowCloudPass((current) => !current)}
              aria-label={showCloudPass ? "Sembunyikan passphrase" : "Tampilkan passphrase"}
              className="shrink-0 text-slate-500 transition hover:text-slate-300"
            >
              {showCloudPass ? (
                <EyeOff size={13} strokeWidth={1.9} />
              ) : (
                <Eye size={13} strokeWidth={1.9} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[8px] leading-relaxed text-slate-600">
            Backup dienkripsi di perangkat sebelum diunggah. Passphrase tidak
            disimpan dan tidak dikirim ke Google.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {!connected ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || !clientId.trim()}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-[16px] bg-[#CFEDFF] py-3.5 text-[9.5px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Link2 size={13} strokeWidth={2.2} />
            {connecting ? "Menghubungkan…" : "Hubungkan Google"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleUpload}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[#CFEDFF] py-3.5 text-[9.5px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              <Upload size={13} strokeWidth={2.2} />
              {busy ? "Mengunggah…" : "Backup ke Drive"}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-1.5 rounded-[16px] border border-white/[0.08] bg-white/[0.035] py-3.5 text-[9.5px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
            >
              <X size={13} strokeWidth={2.2} />
              Putuskan
            </button>
          </>
        )}
      </div>

      {connected && (
        <div className="mt-4 rounded-[22px] border border-white/[0.065] bg-white/[0.022] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9.5px] font-semibold text-slate-200">
                {session.user.name}
              </p>
              <p className="mt-0.5 truncate text-[8px] font-medium text-slate-500">
                {session.user.email} · terakhir sync{" "}
                {formatCloudDate(settings.cloud?.lastSyncAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refreshList()}
              disabled={loadingList}
              className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[8px] font-semibold text-slate-400 transition hover:text-white"
            >
              {loadingList ? "Memuat…" : "Muat ulang"}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {loadingList && backups.length === 0 && (
              <p className="text-center text-[8.5px] text-slate-500">
                Memuat daftar backup…
              </p>
            )}
            {!loadingList && backups.length === 0 && (
              <p className="rounded-[14px] border border-dashed border-white/[0.08] px-3 py-4 text-center text-[8.5px] text-slate-600">
                Belum ada backup di Drive.
              </p>
            )}
            {backups.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[9.5px] font-semibold text-slate-200">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-[8px] font-medium text-slate-500">
                    {formatCloudDate(file.modifiedTime)} ·{" "}
                    {formatCloudSize(file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownload(file.id, file.name)}
                    disabled={busy}
                    className="rounded-full border border-sky-200/15 bg-sky-300/[0.07] px-2.5 py-1.5 text-[8px] font-semibold text-glacier transition hover:bg-sky-300/[0.12] disabled:opacity-60"
                  >
                    <Download size={10} strokeWidth={2.2} className="inline" />{" "}
                    Pulihkan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    disabled={busy}
                    aria-label="Hapus backup"
                    className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.06] bg-white/[0.02] text-slate-500 transition hover:border-[#FF9C9C]/25 hover:text-[#FFC2C2]"
                  >
                    <Trash2 size={11} strokeWidth={1.9} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {restoreTarget && (
        <div className="mt-4 rounded-[20px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.06] p-4">
          <p className="text-[9.5px] font-semibold text-slate-200">
            {restoreTarget.fileName}
          </p>
          <p className="mt-1 text-[8px] leading-relaxed text-slate-400">
            {restoreTarget.envelope
              ? "Backup terenkripsi. Masukkan passphrase yang dipakai saat backup dibuat."
              : "Backup lama tanpa enkripsi. Pulihkan hanya jika file ini berasal dari kamu sendiri."}
          </p>
          {restoreTarget.envelope && (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-white/[0.075] bg-white/[0.025] px-3 py-2.5">
              <input
                type={showRestorePass ? "text" : "password"}
                value={restorePass}
                onChange={(event) => {
                  setRestorePass(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                placeholder="Passphrase backup"
                aria-label="Passphrase backup Drive"
                className="w-full bg-transparent text-[10px] font-medium text-white outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowRestorePass((current) => !current)}
                aria-label={showRestorePass ? "Sembunyikan passphrase" : "Tampilkan passphrase"}
                className="shrink-0 text-slate-500 transition hover:text-slate-300"
              >
                {showRestorePass ? (
                  <EyeOff size={13} strokeWidth={1.9} />
                ) : (
                  <Eye size={13} strokeWidth={1.9} />
                )}
              </button>
            </div>
          )}
          <div className="mt-3 grid grid-cols-[1fr_1.3fr] gap-2">
            <button
              type="button"
              onClick={() => {
                setRestoreTarget(null);
                setRestorePass("");
                setError("");
              }}
              className="rounded-[13px] border border-white/[0.08] bg-white/[0.03] py-2.5 text-[9px] font-semibold text-slate-400 transition hover:text-white"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRestoreCloud}
              disabled={busy}
              className="rounded-[13px] bg-[#FFCE8F] py-2.5 text-[9px] font-bold text-[#2A1A05] transition hover:bg-[#FFDCA8] disabled:opacity-60"
            >
              {busy ? "Membuka…" : "Pulihkan"}
            </button>
          </div>
        </div>
      )}

      <InfoNote>
        Backup Drive disimpan di <code>appDataFolder</code> (folder privat
        aplikasi, tidak terlihat di Drive biasa). Pulihkan di perangkat baru
        dengan login akun Google yang sama.
      </InfoNote>

      <ErrorNote>{error}</ErrorNote>

      {message && (
        <p
          role="status"
          className="mt-3 flex items-start gap-1.5 rounded-[14px] border border-mint/[0.15] bg-mint/[0.06] px-3 py-2 text-[8.5px] font-medium leading-relaxed text-mint"
        >
          <CheckCircle2 size={12} strokeWidth={2.1} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}

      <div className="mt-5">
        <CancelButton onClick={onClose}>Tutup</CancelButton>
      </div>
    </SheetShell>
  );
}
