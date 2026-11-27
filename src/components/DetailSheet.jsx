import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Landmark,
  Share2,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { categoryMeta } from "../data";
import {
  formatFullDate,
  formatRupiah,
  formatTime,
} from "../lib/format";
import CategoryIcon from "./CategoryIcon";

export default function DetailSheet({ transaction, onClose, onDelete, onNotify }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
  }, [transaction]);

  useEffect(() => {
    if (!transaction) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const meta = categoryMeta[transaction.category];
  const isIncome = transaction.type === "income";

  return (
    <div className="absolute inset-0 z-[80] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Tutup detail transaksi"
        onClick={onClose}
        className="backdrop-in absolute inset-0 bg-[#02050A]/80 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detail transaksi ${transaction.name}`}
        className="sheet-up app-scroll relative max-h-[88%] overflow-y-auto overscroll-contain rounded-t-[34px] border-t border-white/[0.11] bg-[#080D16] pb-8 shadow-[0_-30px_80px_rgba(0,0,0,.6)]"
      >
        <div className="sticky top-0 z-10 flex justify-center bg-gradient-to-b from-[#080D16] via-[#080D16] to-transparent pb-2 pt-3">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X size={14} strokeWidth={2} />
        </button>

        <div className="px-5">
          <div className="flex flex-col items-center pt-4 text-center">
            <span
              className="grid h-16 w-16 place-items-center rounded-[22px] border border-white/[0.07] shadow-[0_18px_40px_-20px_rgba(0,0,0,.9)]"
              style={{ background: meta.soft, color: meta.accent }}
            >
              <CategoryIcon category={transaction.category} size={26} />
            </span>
            <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {meta.label}
            </p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-white">
              {transaction.name}
            </h2>
            <p
              className={`mt-2 text-[28px] font-semibold leading-none tracking-[-0.055em] tabular-nums ${
                isIncome ? "text-mint" : "text-white"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatRupiah(transaction.amount)}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-mint/[0.12] bg-mint/[0.07] px-2.5 py-1 text-[8.5px] font-semibold text-mint">
              <CheckCircle2 size={11} strokeWidth={2.2} />
              {transaction.status}
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/[0.065] bg-white/[0.022]">
            <DetailRow icon={Tag} label="Kategori" value={meta.label} />
            <DetailRow
              icon={Landmark}
              label="Sumber dana"
              value={`${transaction.account}${isIncome ? " · masuk" : ""}`}
            />
            <DetailRow
              icon={Clock3}
              label="Waktu"
              value={`${formatFullDate(transaction.date)} · ${formatTime(transaction.date)}`}
            />
            <DetailRow
              icon={CheckCircle2}
              label="ID transaksi"
              value={transaction.id}
              mono
            />
          </div>

          <div className="mt-3 rounded-[21px] border border-white/[0.055] bg-white/[0.02] px-4 py-3.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-600">
              Catatan
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-300">
              {transaction.note}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_1.25fr] gap-2.5">
            <button
              type="button"
              onClick={() => onNotify("Bukti transaksi siap dibagikan.")}
              className="flex items-center justify-center gap-1.5 rounded-[16px] border border-white/[0.08] bg-white/[0.035] py-3 text-[9px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
            >
              <Share2 size={13} strokeWidth={1.9} />
              Bagikan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[16px] bg-[#CFEDFF] py-3 text-[9px] font-bold text-[#07131F] shadow-[0_14px_30px_-14px_rgba(180,228,255,.8)] transition hover:bg-[#E2F6FF] active:scale-[0.98]"
            >
              Tutup detail
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirmingDelete) {
                onDelete(transaction.id);
                return;
              }
              setConfirmingDelete(true);
            }}
            className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[16px] border py-3 text-[9px] font-semibold transition active:scale-[0.98] ${
              confirmingDelete
                ? "border-[#FF9C9C]/30 bg-[#FF9C9C]/[0.1] text-[#FFC2C2]"
                : "border-white/[0.06] bg-transparent text-slate-500 hover:border-white/[0.12] hover:text-slate-300"
            }`}
          >
            <Trash2 size={12} strokeWidth={1.9} />
            {confirmingDelete
              ? "Tekan sekali lagi untuk menghapus"
              : "Hapus transaksi ini"}
          </button>
          <p className="mt-2 text-center text-[8px] font-medium text-slate-600">
            Penghapusan hanya berlaku di perangkat ini.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] px-4 py-3.5 last:border-b-0">
      <span className="flex items-center gap-2 text-[9.5px] font-medium text-slate-500">
        <Icon size={12} strokeWidth={1.8} className="text-slate-600" />
        {label}
      </span>
      <span
        className={`text-right text-[10px] font-semibold text-slate-200 ${
          mono ? "tracking-[0.06em]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
