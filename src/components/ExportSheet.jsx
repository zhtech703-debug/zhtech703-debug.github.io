import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useFinance } from "../lib/store";
import { createExport, EXPORT_VARIANTS } from "../lib/reports";
import { formatRupiah } from "../lib/format";
import { downloadBytes, officeFileName, shareBytes } from "../lib/backup";
import { SheetShell, PillGroup, CancelButton, ErrorNote, InfoNote } from "./SheetKit";

const FORMATS = [
  { id: "excel", label: "Excel (.xlsx)" },
  { id: "word", label: "Word (.docx)" },
  { id: "pdf", label: "PDF (.pdf)" },
];

const RANGES = [
  { id: "month", label: "Bulan ini" },
  { id: "30d", label: "30 hari" },
  { id: "all", label: "Semua data" },
];

export default function ExportSheet({ open, onClose, onNotify }) {
  const finance = useFinance();
  const [format, setFormat] = useState("excel");
  const [variant, setVariant] = useState("mutation");
  const [range, setRange] = useState("month");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFormat("excel");
    setVariant("mutation");
    setRange("month");
    setBusy(false);
    setError("");
    setResult(null);
  }, [open]);

  const variants = EXPORT_VARIANTS[format];

  async function handleGenerate() {
    setError("");
    setBusy(true);
    try {
      const exportResult = await createExport({
        format,
        variant,
        data: finance,
        range,
      });
      const shared = await shareBytes({
        fileName: exportResult.fileName,
        bytes: exportResult.bytes,
        mime: exportResult.mime,
        title: "ZhKas",
        text: exportResult.summary,
      });
      let savedPath = null;
      const cancelled = shared === "cancelled";
      if (shared !== true && !cancelled) {
        savedPath = await downloadBytes(
          exportResult.fileName,
          exportResult.bytes,
          exportResult.mime,
        );
      }
      setResult(exportResult);
      onNotify?.(
        cancelled
          ? `${exportResult.fileName} pembagian dibatalkan — file belum disimpan.`
          : shared === true
            ? `${exportResult.fileName} dibagikan · ${exportResult.summary}`
            : `${exportResult.fileName} ${savedPath ? `disimpan di ${savedPath}` : "diunduh"} · ${exportResult.summary}`,
      );
    } catch (exportError) {
      setError(exportError?.message || "Ekspor gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  const variantMeta = variants.find((item) => item.id === variant);

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      label="Ekspor mutasi"
      title="Ekspor data"
      subtitle="Buat file PDF, Word, atau Excel langsung di perangkat, lalu bagikan lewat share sheet perangkat (termasuk Gmail/Files)."
      badge={
        <span className="inline-flex items-center gap-1 rounded-full border border-mint/[0.14] bg-mint/[0.07] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-mint">
          <Sparkles size={10} strokeWidth={2.1} />
          Offline
        </span>
      }
    >
      <div className="mt-4">
        <PillGroup
          label="Format"
          options={FORMATS.map((item) => ({ id: item.id, label: item.label }))}
          value={format}
          onChange={(next) => {
            setFormat(next);
            setVariant("mutation");
          }}
        />
      </div>

      <div className="mt-4">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Jenis laporan
        </p>
        <div className="mt-2 space-y-2">
          {variants.map((item) => {
            const active = variant === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVariant(item.id)}
                aria-pressed={active}
                className={`flex w-full items-start gap-3 rounded-[18px] border px-3.5 py-3 text-left transition ${
                  active
                    ? "border-sky-200/25 bg-sky-300/[0.08] text-white"
                    : "border-white/[0.07] bg-white/[0.025] text-slate-300 hover:border-white/[0.12]"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[11px] ${
                    active
                      ? "bg-[#CFEDFF] text-[#07131F]"
                      : "bg-white/[0.04] text-slate-400"
                  }`}
                >
                  {format === "excel" ? (
                    <FileUp size={14} strokeWidth={2} />
                  ) : (
                    <FileText size={14} strokeWidth={2} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[8.5px] font-medium text-slate-500">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {variant === "mutation" && (
        <div className="mt-4">
          <PillGroup
            label="Periode mutasi"
            options={RANGES.map((item) => ({ id: item.id, label: item.label }))}
            value={range}
            onChange={setRange}
          />
        </div>
      )}

      <InfoNote>
        {variantMeta?.title}:{" "}
        {variant === "mutation"
          ? "Semua transaksi pada periode terpilih, plus ringkasan dan kategori."
          : variant === "monthly"
            ? "Arus kas 6 bulan, budget, hutang, dan saran keuangan."
            : "Posisi piutang/hutang dan riwayat pelunasan."}
      </InfoNote>

      {result && (
        <div className="mt-3 rounded-[18px] border border-mint/[0.12] bg-mint/[0.05] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-mint" />
            <p className="truncate text-[9.5px] font-semibold text-slate-200">
              {result.fileName}
            </p>
          </div>
          <p className="mt-1 text-[8.5px] font-medium text-slate-500">
            {result.summary}
          </p>
        </div>
      )}

      <ErrorNote>{error}</ErrorNote>

      <div className="mt-5 flex items-center gap-2.5">
        <CancelButton onClick={onClose} />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[#CFEDFF] py-3.5 text-[9.5px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          <Download size={13} strokeWidth={2.2} />
          {busy
            ? "Menyiapkan file…"
            : "Buat & bagikan file"}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[8px] font-medium text-slate-600">
        <Share2 size={10} strokeWidth={1.9} />
        Jika share sheet tidak tersedia, file otomatis diunduh.
      </div>
    </SheetShell>
  );
}
