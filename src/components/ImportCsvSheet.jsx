import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { categoryMeta } from "../data";
import { saveBytes } from "../lib/backup";
import { isIOS } from "../lib/platform";
import {
  buildImportRows,
  expenseCategories,
  formatPreviewAmount,
  parseCsv,
  SAMPLE_CSV,
  suggestMapping,
} from "../lib/csv";
import { useFinance } from "../lib/store";
import { transactionKey } from "../lib/transactionKey";
import CategoryIcon from "./CategoryIcon";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const emptyMapping = {
  date: -1,
  description: -1,
  amount: -1,
  debit: -1,
  credit: -1,
  type: -1,
};

function formatShortDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

async function downloadTemplate() {
  const content = [
    "tanggal,keterangan,jumlah,tipe",
    "26/11/2026,Kopi Kenangan,-24000,debit",
    "25/11/2026,Gaji November,8500000,kredit",
  ].join("\n");
  await saveBytes({
    fileName: "template-zhkas.csv",
    bytes: new TextEncoder().encode(`\uFEFF${content}`),
    mime: "text/csv;charset=utf-8",
    title: "Template ZhKas",
    text: "Template CSV ZhKas",
    preferShare: isIOS(),
  });
}

export default function ImportCsvSheet({ open, onClose }) {
  const { accounts, importTransactions, transactions } = useFinance();
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState(emptyMapping);
  const [account, setAccount] = useState(accounts[0]?.bank ?? "");
  const [defaultType, setDefaultType] = useState("expense");
  const [categoryMode, setCategoryMode] = useState("auto");
  const [defaultCategory, setDefaultCategory] = useState("belanja");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFileName("");
    setParsed(null);
    setMapping(emptyMapping);
    setAccount(accounts[0]?.bank ?? "");
    setDefaultType("expense");
    setCategoryMode("auto");
    setDefaultCategory("belanja");
    setError("");
    setReading(false);
    setDragging(false);
    setResult(null);
    // Sengaja hanya bergantung pada `open`: perubahan saldo setelah impor
    // tidak boleh mereset tampilan hasil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const annotatedRows = useMemo(() => {
    if (!parsed) return [];

    const existing = new Set(transactions.map(transactionKey));
    const candidates = buildImportRows({
      rows: parsed.rows,
      mapping,
      defaultType,
      categoryMode,
      defaultCategory,
    });

    return candidates.map((candidate) => ({
      ...candidate,
      duplicate:
        candidate.valid &&
        existing.has(transactionKey({ ...candidate, account })),
    }));
  }, [
    parsed,
    mapping,
    defaultType,
    categoryMode,
    defaultCategory,
    transactions,
    account,
  ]);

  const readyCount = annotatedRows.filter(
    (row) => row.valid && !row.duplicate,
  ).length;
  const duplicateCount = annotatedRows.filter((row) => row.duplicate).length;
  const invalidCount = annotatedRows.filter((row) => !row.valid).length;

  if (!open) return null;

  function applyText(text, name) {
    const next = parseCsv(text);

    if (next.headers.length === 0) {
      setError("File tidak berisi baris CSV yang bisa dibaca.");
      return;
    }
    if (next.rows.length === 0) {
      setError("CSV hanya berisi header. Tambahkan minimal satu baris transaksi.");
      return;
    }

    setFileName(name);
    setParsed(next);
    setMapping(suggestMapping(next));
    setError("");
    setResult(null);
  }

  async function handleFile(file) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 2 MB.");
      return;
    }
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError("Pilih file .csv atau .txt.");
      return;
    }

    setReading(true);
    setError("");

    try {
      const text = await file.text();
      applyText(text, file.name);
    } catch {
      setError("File tidak bisa dibaca. Coba file lain.");
    } finally {
      setReading(false);
    }
  }

  function useSample() {
    applyText(SAMPLE_CSV, "contoh-zhkas.csv");
  }

  function backToUpload() {
    setParsed(null);
    setFileName("");
    setError("");
    setResult(null);
  }

  function updateMapping(key, value) {
    setMapping((current) => ({ ...current, [key]: Number(value) }));
  }

  function handleImport() {
    const rows = annotatedRows
      .filter((row) => row.valid && !row.duplicate)
      .map((row) => ({
        name: row.name,
        amount: row.amount,
        type: row.type,
        category: row.category,
        account,
        note: row.note,
        date: row.date,
      }));

    const summary = importTransactions(rows);

    setResult({
      imported: summary.imported,
      duplicates: duplicateCount + summary.duplicates,
      invalid: invalidCount + summary.invalid,
    });
  }

  const mappingFields = [
    { key: "date", label: "Tanggal", required: true },
    { key: "description", label: "Keterangan" },
    { key: "amount", label: "Jumlah" },
    { key: "debit", label: "Debit / keluar" },
    { key: "credit", label: "Kredit / masuk" },
    { key: "type", label: "Tipe transaksi" },
  ];

  return (
    <div className="absolute inset-0 z-[95] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Tutup impor CSV"
        onClick={onClose}
        className="backdrop-in absolute inset-0 bg-[#02050A]/80 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Impor transaksi dari CSV"
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
              Diproses lokal
            </span>
            <span className="text-[8.5px] font-medium text-slate-600">
              file tidak diunggah
            </span>
          </div>

          <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Impor CSV<span className="text-glacier">.</span>
          </h2>
          <p className="mt-1 text-[9.5px] font-medium leading-relaxed text-slate-500">
            Baca mutasi rekening dari file CSV di browser ini. Tidak ada koneksi
            bank, PIN, OTP, atau unggahan ke server.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {result ? (
            <ResultView
              result={result}
              onImportAnother={backToUpload}
              onClose={onClose}
            />
          ) : parsed ? (
            <MappingView
              fileName={fileName}
              parsed={parsed}
              mapping={mapping}
              mappingFields={mappingFields}
              account={account}
              accounts={accounts}
              defaultType={defaultType}
              categoryMode={categoryMode}
              defaultCategory={defaultCategory}
              rows={annotatedRows}
              readyCount={readyCount}
              duplicateCount={duplicateCount}
              invalidCount={invalidCount}
              onUpdateMapping={updateMapping}
              onAccountChange={setAccount}
              onDefaultTypeChange={setDefaultType}
              onCategoryModeChange={setCategoryMode}
              onDefaultCategoryChange={setDefaultCategory}
              onBack={backToUpload}
              onImport={handleImport}
            />
          ) : (
            <div className="mt-5">
              <div
                role="button"
                tabIndex={0}
                aria-label="Pilih file CSV"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  handleFile(event.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer flex-col items-center rounded-[24px] border border-dashed px-5 py-8 text-center transition ${
                  dragging
                    ? "border-sky-200/40 bg-sky-300/[0.08]"
                    : "border-white/[0.12] bg-white/[0.022] hover:border-sky-200/25 hover:bg-white/[0.04]"
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-[16px] border border-sky-100/10 bg-sky-200/[0.08] text-glacier">
                  <Upload size={21} strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-[11.5px] font-semibold text-slate-200">
                  {reading ? "Membaca file…" : "Pilih file CSV"}
                </p>
                <p className="mt-1 text-[9px] font-medium text-slate-500">
                  atau tarik file ke sini · maksimal 2 MB
                </p>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={useSample}
                  className="flex items-center justify-center gap-1.5 rounded-[15px] border border-sky-200/15 bg-sky-300/[0.07] py-2.5 text-[9px] font-semibold text-glacier transition hover:bg-sky-300/[0.12] active:scale-[0.98]"
                >
                  <Sparkles size={12} strokeWidth={1.9} />
                  Pakai data contoh
                </button>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-1.5 rounded-[15px] border border-white/[0.08] bg-white/[0.03] py-2.5 text-[9px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
                >
                  <Download size={12} strokeWidth={1.9} />
                  Unduh template
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-1.5 rounded-[14px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.07] px-3 py-2 text-[9px] font-medium leading-relaxed text-[#FFD9A8]"
                >
                  <AlertTriangle size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              <div className="mt-4 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-3.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Format yang didukung
                </p>
                <ul className="mt-2 space-y-1.5 text-[9px] leading-relaxed text-slate-400">
                  <li>• Kolom tanggal, keterangan, lalu jumlah / debit / kredit.</li>
                  <li>• Pemisah koma, titik koma, atau tab.</li>
                  <li>• Nominal: 25.000, 1.234,56, Rp25.000, atau (25.000).</li>
                  <li>• Tanggal: 26/11/2026, 2026-11-26, atau 26 Nov 2026.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MappingView({
  fileName,
  parsed,
  mapping,
  mappingFields,
  account,
  accounts,
  defaultType,
  categoryMode,
  defaultCategory,
  rows,
  readyCount,
  duplicateCount,
  invalidCount,
  onUpdateMapping,
  onAccountChange,
  onDefaultTypeChange,
  onCategoryModeChange,
  onDefaultCategoryChange,
  onBack,
  onImport,
}) {
  const preview = rows.slice(0, 6);

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2.5 rounded-[18px] border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-sky-300/[0.08] text-glacier">
          <FileSpreadsheet size={16} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10.5px] font-semibold text-slate-200">
            {fileName}
          </p>
          <p className="mt-0.5 text-[8.5px] font-medium text-slate-500">
            {parsed.rows.length} baris · {parsed.headers.length} kolom
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[8px] font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={10} strokeWidth={2.1} />
          Ganti
        </button>
      </div>

      <div className="mt-4">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Cocokkan kolom
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {mappingFields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-[8.5px] font-medium text-slate-500">
                {field.label}
                {field.required ? " *" : ""}
              </span>
              <select
                value={mapping[field.key]}
                onChange={(event) => onUpdateMapping(field.key, event.target.value)}
                className="mt-1 w-full rounded-[11px] border border-white/[0.08] bg-[#0B1322] px-2 py-2 text-[9.5px] font-medium text-slate-200 outline-none transition focus:border-sky-200/30"
              >
                <option value={-1}>— tidak dipakai —</option>
                {parsed.headers.map((header, index) => (
                  <option key={`${header}-${index}`} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Masukkan ke rekening
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {accounts.map((item) => {
            const active = account === item.bank;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onAccountChange(item.bank)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-2 text-[9px] font-semibold transition ${
                  active
                    ? "border-sky-200/25 bg-sky-300/[0.1] text-white"
                    : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12]"
                }`}
              >
                {item.bank}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Angka positif
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-[12px] border border-white/[0.07] bg-white/[0.025] p-1">
            {[
              { id: "expense", label: "Keluar" },
              { id: "income", label: "Masuk" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onDefaultTypeChange(option.id)}
                aria-pressed={defaultType === option.id}
                className={`rounded-[9px] py-1.5 text-[8.5px] font-semibold transition ${
                  defaultType === option.id
                    ? "bg-white/[0.09] text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Kategori pengeluaran
          </p>
          <select
            value={categoryMode === "auto" ? "auto" : defaultCategory}
            onChange={(event) => {
              if (event.target.value === "auto") {
                onCategoryModeChange("auto");
                return;
              }
              onCategoryModeChange("manual");
              onDefaultCategoryChange(event.target.value);
            }}
            className="mt-1.5 w-full rounded-[11px] border border-white/[0.08] bg-[#0B1322] px-2 py-2 text-[9.5px] font-medium text-slate-200 outline-none transition focus:border-sky-200/30"
          >
            <option value="auto">Tebak otomatis</option>
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                Semua: {categoryMeta[category].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-white/[0.065] bg-white/[0.022] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Pratinjau
          </p>
          <p className="text-[8px] font-medium text-slate-600">
            {readyCount} siap
            {duplicateCount > 0 ? ` · ${duplicateCount} duplikat` : ""}
            {invalidCount > 0 ? ` · ${invalidCount} dilewati` : ""}
          </p>
        </div>

        <div className="mt-2 space-y-1">
          {preview.map((row) => {
            const meta = categoryMeta[row.category];
            return (
              <div
                key={row.rowNumber}
                className="flex items-center gap-2 rounded-[11px] bg-white/[0.025] px-2 py-1.5"
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px]"
                  style={{
                    background: meta?.soft ?? "rgba(255,255,255,.05)",
                    color: meta?.accent ?? "#94A3B8",
                  }}
                >
                  <CategoryIcon category={row.category} size={11} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[9.5px] font-medium text-slate-200">
                    {row.name}
                  </p>
                  <p className="text-[7.5px] font-medium text-slate-600">
                    {row.date ? formatShortDate(row.date) : "—"} ·{" "}
                    {row.valid ? row.label : row.reason}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {row.valid ? (
                    <p
                      className={`text-[9.5px] font-semibold tabular-nums ${
                        row.type === "income" ? "text-mint" : "text-slate-200"
                      }`}
                    >
                      {formatPreviewAmount(row.amount, row.type)}
                    </p>
                  ) : (
                    <p className="text-[8px] font-semibold text-[#FFCE8F]">
                      dilewati
                    </p>
                  )}
                  <p
                    className={`text-[7px] font-semibold uppercase tracking-[0.08em] ${
                      row.duplicate ? "text-[#FFCE8F]" : "text-slate-600"
                    }`}
                  >
                    {row.duplicate ? "duplikat" : row.valid ? "siap" : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length > preview.length && (
          <p className="mt-2 text-center text-[8px] font-medium text-slate-600">
            +{rows.length - preview.length} baris lainnya
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-4 py-3.5 text-[9.5px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={readyCount === 0}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[16px] py-3.5 text-[9.5px] font-bold transition active:scale-[0.98] ${
            readyCount > 0
              ? "bg-[#CFEDFF] text-[#07131F] shadow-[0_14px_30px_-14px_rgba(180,228,255,.8)] hover:bg-[#E2F6FF]"
              : "cursor-not-allowed bg-white/[0.05] text-slate-600"
          }`}
        >
          <FileUp size={13} strokeWidth={2.2} />
          Impor {readyCount} transaksi
        </button>
      </div>

      <p className="mt-2.5 text-center text-[8px] font-medium text-slate-600">
        Transaksi duplikat (tanggal, nama, nominal, rekening sama) dilewati.
      </p>
    </div>
  );
}

function ResultView({ result, onImportAnother, onClose }) {
  return (
    <div className="mt-6">
      <div className="flex flex-col items-center rounded-[24px] border border-mint/[0.12] bg-mint/[0.05] px-5 py-7 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-mint text-[#04140F] shadow-[0_18px_40px_-18px_rgba(103,228,184,.8)]">
          <CheckCircle2 size={26} strokeWidth={2.1} />
        </span>
        <p className="mt-4 text-[24px] font-semibold tracking-[-0.04em] text-white">
          {result.imported} transaksi
        </p>
        <p className="mt-1 text-[10px] font-medium text-mint">
          berhasil diimpor ke perangkat ini
        </p>

        <div className="mt-4 flex items-center gap-4 text-[8.5px] font-medium text-slate-500">
          <span>{result.duplicates} duplikat dilewati</span>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <span>{result.invalid} baris tidak valid</span>
        </div>
      </div>

      <p className="mt-3 text-center text-[8.5px] leading-relaxed text-slate-600">
        Saldo rekening dan budget sudah disesuaikan. Semua data tetap tersimpan
        lokal dan tidak dikirim ke mana pun.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onImportAnother}
          className="flex items-center justify-center gap-1.5 rounded-[16px] border border-white/[0.08] bg-white/[0.035] py-3.5 text-[9px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <FileUp size={13} strokeWidth={1.9} />
          Impor lagi
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[#CFEDFF] py-3.5 text-[9px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] active:scale-[0.98]"
        >
          <Check size={13} strokeWidth={2.6} />
          Selesai
        </button>
      </div>
    </div>
  );
}
