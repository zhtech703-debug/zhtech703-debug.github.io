import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  KeyRound,
  Lock,
  RotateCcw,
  Share2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import {
  backupFileName,
  buildBackup,
  csvFileName,
  decryptBackup,
  downloadBytes,
  encryptBackup,
  isEncryptedBackup,
  normalizeBackup,
  saveBytes,
  shareBytes,
  transactionsToCsv,
} from "../lib/backup";
import { isIOS } from "../lib/platform";
import { formatRupiah } from "../lib/format";
import { useFinance } from "../lib/store";

const MAX_BACKUP_SIZE = 10 * 1024 * 1024;

export default function DataSheet({ open, onClose }) {
  const {
    accounts,
    budgets,
    debts,
    settings,
    transactions,
    resetData,
    restoreData,
  } = useFinance();
  const fileInputRef = useRef(null);
  const [encryptExport, setEncryptExport] = useState(false);
  const [exportPass, setExportPass] = useState("");
  const [showExportPass, setShowExportPass] = useState(false);
  const [restorePass, setRestorePass] = useState("");
  const [showRestorePass, setShowRestorePass] = useState(false);
  const [envelope, setEnvelope] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  );

  useEffect(() => {
    if (!open) return;
    setEncryptExport(false);
    setExportPass("");
    setShowExportPass(false);
    setRestorePass("");
    setShowRestorePass(false);
    setEnvelope(null);
    setPending(null);
    setBusy(false);
    setMessage("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (open) return undefined;
    setExportPass("");
    setRestorePass("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleExport() {
    setError("");
    setMessage("");

    if (encryptExport && exportPass.trim().length < 8) {
      setError("Passphrase minimal 8 karakter.");
      return;
    }

    const payload = buildBackup({
      accounts,
      budgets,
      transactions,
      debts,
      settings,
    });

    try {
      setBusy(true);
      let content;
      let fileName;
      if (encryptExport) {
        const encrypted = await encryptBackup(payload, exportPass);
        content = JSON.stringify(encrypted);
        fileName = backupFileName(true);
        setExportPass("");
      } else {
        content = JSON.stringify(payload, null, 2);
        fileName = backupFileName(false);
      }

      const result = await saveBytes({
        fileName,
        bytes: new TextEncoder().encode(content),
        mime: "application/json",
        title: "Backup ZhKas",
        text: "Arsip data ZhKas. Simpan passphrase terpisah bila backup dienkripsi.",
        preferShare: isIOS(),
      });

      if (result.outcome === "shared") {
        setMessage(
          encryptExport
            ? "Backup dibagikan. Simpan passphrase-nya terpisah — tanpa passphrase, file tidak bisa dibuka."
            : "Backup dibagikan. Pilih Gmail atau Files, lalu simpan di tempat yang aman.",
        );
      } else if (result.outcome === "cancelled") {
        setMessage(
          "Pembagian dibatalkan. Backup belum disimpan — ulangi bila ingin menyimpan.",
        );
      } else if (result.outcome === "saved") {
        setMessage(
          encryptExport
            ? `Backup disimpan di ${result.path}. Simpan passphrase-nya terpisah — tanpa passphrase, file tidak bisa dibuka.`
            : `Backup disimpan di ${result.path}.`,
        );
      } else {
        setMessage(
          encryptExport
            ? "Backup terenkripsi diunduh. Simpan passphrase-nya terpisah — tanpa passphrase, file tidak bisa dibuka."
            : "Backup JSON diunduh. Simpan file di tempat yang aman.",
        );
      }
    } catch (exportError) {
      setError(exportError.message || "Backup gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExportCsv() {
    setError("");
    setMessage("");

    try {
      const result = await saveBytes({
        fileName: csvFileName(),
        bytes: new TextEncoder().encode(transactionsToCsv(transactions)),
        mime: "text/csv;charset=utf-8",
        title: "CSV ZhKas",
        text: "Data transaksi ZhKas",
        preferShare: isIOS(),
      });

      if (result.outcome === "shared") {
        setMessage("CSV dibagikan. Pilih Files atau aplikasi spreadsheet.");
      } else if (result.outcome === "cancelled") {
        setMessage(
          "Pembagian dibatalkan. CSV belum disimpan — ulangi bila ingin menyimpan.",
        );
      } else if (result.outcome === "saved") {
        setMessage(`CSV disimpan di ${result.path}.`);
      } else {
        setMessage("CSV transaksi diunduh dan bisa dibuka di spreadsheet.");
      }
    } catch (csvError) {
      setError(csvError?.message || "CSV gagal dibuat.");
    }
  }

  async function handleShareBackup() {
    setError("");
    setMessage("");
    if (encryptExport && exportPass.trim().length < 8) {
      setError("Passphrase minimal 8 karakter.");
      return;
    }

    const payload = buildBackup({
      accounts,
      budgets,
      transactions,
      debts,
      settings,
    });

    try {
      setBusy(true);
      let content;
      let fileName;
      if (encryptExport) {
        const encrypted = await encryptBackup(payload, exportPass.trim());
        content = JSON.stringify(encrypted);
        fileName = backupFileName(true);
        setExportPass("");
      } else {
        content = JSON.stringify(payload, null, 2);
        fileName = backupFileName(false);
      }

      const bytes = new TextEncoder().encode(content);
      const shared = await shareBytes({
        fileName,
        bytes,
        mime: "application/json",
        title: "Backup ZhKas",
        text: "Arsip data ZhKas. Simpan passphrase terpisah bila backup dienkripsi.",
      });
      if (shared === "cancelled") {
        setMessage("Pembagian dibatalkan. Backup belum disimpan.");
      } else if (shared !== true) {
        const savedPath = await downloadBytes(
          fileName,
          bytes,
          "application/json",
        );
        setMessage(
          savedPath
            ? `Backup disimpan di ${savedPath}.`
            : "Backup diunduh ke perangkat.",
        );
      } else {
        setMessage(
          "Backup dibagikan. Pilih Gmail, lalu kirim ke alamat sendiri sebagai arsip.",
        );
      }
    } catch (shareError) {
      setError(shareError?.message || "Backup gagal dibagikan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreFile(file) {
    if (!file) return;

    setError("");
    setMessage("");
    setPending(null);
    setEnvelope(null);

    if (file.size > MAX_BACKUP_SIZE) {
      setError("Ukuran backup maksimal 10 MB.");
      return;
    }
    if (!/\.(json|zhkas)$/i.test(file.name)) {
      setError("Pilih file backup .json atau .zhkas.");
      return;
    }

    setBusy(true);

    try {
      const text = await file.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("File bukan JSON backup ZhKas yang valid.");
      }

      if (isEncryptedBackup(data)) {
        setEnvelope(data);
        setPending({ encrypted: true, fileName: file.name });
        setMessage(
          "Backup terenkripsi terdeteksi. Masukkan passphrase untuk membukanya.",
        );
      } else {
        const payload = normalizeBackup(data);
        setPending({ payload, encrypted: false, fileName: file.name });
      }
    } catch (restoreError) {
      setError(restoreError.message || "Backup tidak bisa dibaca.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock() {
    if (!envelope) return;
    if (!restorePass) {
      setError("Masukkan passphrase backup.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const raw = await decryptBackup(envelope, restorePass);
      const payload = normalizeBackup(raw);
      setPending({
        payload,
        encrypted: true,
        fileName: pending?.fileName ?? "backup.zhkas",
      });
      setEnvelope(null);
      setRestorePass("");
      setMessage("Backup berhasil dibuka. Periksa ringkasan sebelum memulihkan.");
    } catch {
      setError("Passphrase salah atau file backup rusak.");
    } finally {
      setBusy(false);
    }
  }

  function handleRestore() {
    if (!pending?.payload) return;

    const count = pending.payload.transactions.length;
    const confirmed = window.confirm(
      `Ganti seluruh data di perangkat ini dengan ${count} transaksi dari backup?`,
    );
    if (!confirmed) return;

    try {
      const summary = restoreData(pending.payload);
      setPending(null);
      setEnvelope(null);
      setRestorePass("");
      setError("");
      setMessage(`${summary.transactions} transaksi berhasil dipulihkan.`);
    } catch (restoreError) {
      setError(restoreError.message || "Backup gagal dipulihkan.");
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Hapus semua data? Transaksi, hutang, budget, dan kartu di perangkat ini akan dihapus permanen.",
    );
    if (!confirmed) return;

    resetData();
    setPending(null);
    setEnvelope(null);
    setRestorePass("");
    setError("");
    setMessage("Semua data dihapus. ZhKas kembali kosong seperti baru dipasang.");
  }

  function cancelRestore() {
    setPending(null);
    setEnvelope(null);
    setRestorePass("");
    setMessage("");
    setError("");
  }

  return (
    <div className="absolute inset-0 z-[96] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Tutup data dan privasi"
        onClick={onClose}
        className="backdrop-in absolute inset-0 bg-[#02050A]/80 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Data dan privasi"
        className="sheet-up app-scroll relative max-h-[94%] overflow-y-auto overscroll-contain rounded-t-[34px] border-t border-white/[0.11] bg-[#080D16]/72 backdrop-blur-2xl pb-8 shadow-[0_-30px_80px_rgba(0,0,0,.6)]"
      >
        <div className="sticky top-0 z-20 flex justify-center bg-gradient-to-b from-[#080D16] via-[#080D16] to-transparent pb-2 pt-3">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 z-30 grid h-8 w-8 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X size={14} strokeWidth={2} />
        </button>

        <div className="px-5 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/[0.14] bg-mint/[0.07] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-mint">
              <ShieldCheck size={10} strokeWidth={2.1} />
              Tetap di perangkat
            </span>
            <span className="text-[8.5px] font-medium text-slate-600">
              cloud opsional
            </span>
          </div>

          <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Data &amp; privasi<span className="text-glacier">.</span>
          </h2>
          <p className="mt-1 text-[9.5px] font-medium leading-relaxed text-slate-500">
            Buat salinan, pulihkan, atau ekspor catatan. Semua file dibuat dan
            dibaca di browser ini. Termasuk {debts.length} catatan hutang/piutang.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <SummaryStat label="Transaksi" value={transactions.length} />
            <SummaryStat label="Rekening" value={accounts.length} />
            <SummaryStat label="Total" value={formatRupiah(totalBalance)} />
          </div>

          <section className="mt-4 rounded-[22px] border border-white/[0.065] bg-white/[0.022] p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-sky-100/10 bg-sky-200/[0.08] text-glacier">
                <Download size={15} strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-200">
                  Backup
                </p>
                <p className="mt-0.5 text-[8.5px] font-medium text-slate-500">
                  Simpan salinan sebelum membersihkan browser.
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                <Lock size={12} strokeWidth={1.9} className="text-slate-500" />
                Enkripsi dengan passphrase
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={encryptExport}
                aria-label="Enkripsi backup dengan passphrase"
                onClick={() => {
                  setEncryptExport((current) => !current);
                  setExportPass("");
                  setError("");
                  setMessage("");
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                  encryptExport
                    ? "border-sky-200/30 bg-sky-300/80"
                    : "border-white/[0.09] bg-white/[0.06]"
                }`}
              >
                <span
                  className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
                    encryptExport ? "left-[26px]" : "left-1"
                  }`}
                />
              </button>
            </div>

            {encryptExport && (
              <div className="mt-2">
                <div className="flex items-center gap-2 rounded-[14px] border border-white/[0.075] bg-white/[0.025] px-3 py-2.5 focus-within:border-sky-200/25">
                  <KeyRound size={13} strokeWidth={1.9} className="shrink-0 text-slate-500" />
                  <input
                    type={showExportPass ? "text" : "password"}
                    value={exportPass}
                    onChange={(event) => {
                      setExportPass(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    placeholder="Passphrase baru (min. 8 karakter)"
                    aria-label="Passphrase untuk backup terenkripsi"
                    className="w-full bg-transparent text-[10px] font-medium text-white outline-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPass((current) => !current)}
                    aria-label={
                      showExportPass ? "Sembunyikan passphrase" : "Tampilkan passphrase"
                    }
                    className="shrink-0 text-slate-500 transition hover:text-slate-300"
                  >
                    {showExportPass ? (
                      <EyeOff size={13} strokeWidth={1.9} />
                    ) : (
                      <Eye size={13} strokeWidth={1.9} />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[8px] leading-relaxed text-slate-600">
                  Passphrase tidak disimpan di mana pun. Jika lupa, backup tidak
                  bisa dibuka.
                </p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 rounded-[14px] bg-[#CFEDFF] py-2.5 text-[9px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                <FileJson size={13} strokeWidth={2.1} />
                {busy
                  ? "Menyiapkan…"
                  : encryptExport
                    ? "Unduh .zhkas"
                    : "Unduh JSON"}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center justify-center gap-1.5 rounded-[14px] border border-white/[0.08] bg-white/[0.035] py-2.5 text-[9px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
              >
                <FileSpreadsheet size={13} strokeWidth={1.9} />
                Unduh CSV
              </button>
            </div>
            <button
              type="button"
              onClick={handleShareBackup}
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-sky-200/20 bg-sky-300/[0.09] py-2.5 text-[9px] font-semibold text-slate-200 transition hover:bg-sky-300/[0.14] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            >
              <Share2 size={13} strokeWidth={2} />
              Bagikan backup
            </button>
            <p className="mt-2 text-[8px] leading-relaxed text-slate-600">
              ZhKas tidak membaca inbox Gmail. File backup dikirim lewat share
              sheet perangkat — pilih Gmail lalu kirim ke alamat sendiri.
            </p>
          </section>

          <section className="mt-3 rounded-[22px] border border-white/[0.065] bg-white/[0.022] p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-sky-100/10 bg-sky-200/[0.08] text-glacier">
                <Upload size={15} strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-200">
                  Pulihkan
                </p>
                <p className="mt-0.5 text-[8.5px] font-medium text-slate-500">
                  Mengganti seluruh data saat ini dengan isi backup.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.zhkas,application/json"
              className="hidden"
              onChange={(event) => {
                handleRestoreFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            {envelope ? (
              <div className="mt-3">
                <p className="text-[8.5px] font-medium text-slate-400">
                  {pending?.fileName} · terenkripsi
                </p>
                <div className="mt-2 flex items-center gap-2 rounded-[14px] border border-white/[0.075] bg-white/[0.025] px-3 py-2.5 focus-within:border-sky-200/25">
                  <KeyRound size={13} strokeWidth={1.9} className="shrink-0 text-slate-500" />
                  <input
                    type={showRestorePass ? "text" : "password"}
                    value={restorePass}
                    onChange={(event) => {
                      setRestorePass(event.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    placeholder="Passphrase backup"
                    aria-label="Passphrase backup"
                    className="w-full bg-transparent text-[10px] font-medium text-white outline-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRestorePass((current) => !current)}
                    aria-label={
                      showRestorePass ? "Sembunyikan passphrase" : "Tampilkan passphrase"
                    }
                    className="shrink-0 text-slate-500 transition hover:text-slate-300"
                  >
                    {showRestorePass ? (
                      <EyeOff size={13} strokeWidth={1.9} />
                    ) : (
                      <Eye size={13} strokeWidth={1.9} />
                    )}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_1.3fr] gap-2">
                  <button
                    type="button"
                    onClick={cancelRestore}
                    className="rounded-[13px] border border-white/[0.08] bg-white/[0.03] py-2.5 text-[9px] font-semibold text-slate-400 transition hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlock}
                    disabled={busy}
                    className="rounded-[13px] bg-[#CFEDFF] py-2.5 text-[9px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] disabled:cursor-wait disabled:opacity-70"
                  >
                    {busy ? "Membuka…" : "Buka backup"}
                  </button>
                </div>
              </div>
            ) : pending?.payload ? (
              <div className="mt-3 rounded-[15px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.06] p-3">
                <p className="truncate text-[9.5px] font-semibold text-slate-200">
                  {pending.fileName}
                </p>
                <p className="mt-1 text-[8.5px] font-medium text-slate-400">
                  {pending.payload.transactions.length} transaksi ·{" "}
                  {pending.payload.accounts.length} rekening ·{" "}
                  {pending.encrypted ? "terenkripsi" : "JSON biasa"}
                </p>
                <div className="mt-2.5 grid grid-cols-[1fr_1.3fr] gap-2">
                  <button
                    type="button"
                    onClick={cancelRestore}
                    className="rounded-[13px] border border-white/[0.08] bg-white/[0.03] py-2.5 text-[9px] font-semibold text-slate-400 transition hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleRestore}
                    className="rounded-[13px] bg-[#FFCE8F] py-2.5 text-[9px] font-bold text-[#2A1A05] transition hover:bg-[#FFDCA8] active:scale-[0.98]"
                  >
                    Pulihkan data
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-white/[0.12] bg-white/[0.018] py-3 text-[9px] font-semibold text-slate-300 transition hover:border-sky-200/25 hover:bg-white/[0.04] disabled:cursor-wait disabled:opacity-70"
              >
                <Upload size={13} strokeWidth={1.9} />
                {busy ? "Membaca file…" : "Pilih file backup"}
              </button>
            )}
          </section>

          <section className="mt-3 rounded-[22px] border border-white/[0.05] bg-white/[0.014] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-300">
                  Hapus semua data
                </p>
                <p className="mt-0.5 text-[8.5px] font-medium text-slate-600">
                  Menghapus seluruh catatan, kartu, dan pengaturan di perangkat ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[8.5px] font-semibold text-slate-400 transition hover:border-[#FF9C9C]/25 hover:text-[#FFC2C2]"
              >
                <RotateCcw size={11} strokeWidth={2} />
                Reset
              </button>
            </div>
          </section>

          {message && (
            <p
              role="status"
              className="mt-3 flex items-start gap-1.5 rounded-[14px] border border-mint/[0.15] bg-mint/[0.06] px-3 py-2 text-[8.5px] font-medium leading-relaxed text-mint"
            >
              <CheckCircle2 size={12} strokeWidth={2.1} className="mt-0.5 shrink-0" />
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-1.5 rounded-[14px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.07] px-3 py-2 text-[8.5px] font-medium leading-relaxed text-[#FFD9A8]"
            >
              <AlertTriangle size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <p className="mt-4 flex items-start gap-1.5 text-[8px] leading-relaxed text-slate-600">
            <Database size={11} strokeWidth={1.8} className="mt-0.5 shrink-0" />
            File backup dan CSV dibuat di browser. Tidak ada unggahan, akun,
            kredensial bank, atau langganan berbayar.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.022] px-2.5 py-2">
      <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 truncate text-[10px] font-semibold text-slate-200 tabular-nums">
        {value}
      </p>
    </div>
  );
}
