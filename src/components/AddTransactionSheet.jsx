import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Landmark,
  ShieldCheck,
  StickyNote,
  Tag,
  X,
} from "lucide-react";
import { useFinance } from "../lib/store";
import { categoryMeta } from "../data";
import { formatRupiah } from "../lib/format";
import CategoryIcon from "./CategoryIcon";

const expenseCategories = [
  "makan",
  "transport",
  "belanja",
  "tagihan",
  "hiburan",
  "kesehatan",
];

const quickAmounts = [10_000, 25_000, 50_000, 100_000];

function toDateInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDigits(digits) {
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export default function AddTransactionSheet({ open, initialType = "expense", onClose, onSaved }) {
  const { accounts, addTransaction } = useFinance();
  const [type, setType] = useState(initialType);
  const [amountDigits, setAmountDigits] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("makan");
  const [account, setAccount] = useState(accounts[0]?.bank ?? "");
  const [dateValue, setDateValue] = useState(toDateInputValue(new Date()));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const categories = type === "income" ? ["pemasukan"] : expenseCategories;
  const amount = Number(amountDigits || 0);
  const isValid = amount > 0 && name.trim().length > 0 && account;

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setAmountDigits("");
    setName("");
    setCategory(initialType === "income" ? "pemasukan" : "makan");
    setAccount(accounts[0]?.bank ?? "");
    setDateValue(toDateInputValue(new Date()));
    setNote("");
    setError("");
  }, [open, initialType, accounts]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const previewDate = useMemo(() => {
    if (!dateValue) return new Date();
    const [year, month, day] = dateValue.split("-").map(Number);
    const now = new Date();
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes());
  }, [dateValue]);

  if (!open) return null;

  function changeType(nextType) {
    setType(nextType);
    setCategory(nextType === "income" ? "pemasukan" : "makan");
    setError("");
  }

  function handleAmountChange(event) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
    setAmountDigits(digits);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Isi nama transaksi dulu ya.");
      return;
    }
    if (amount <= 0) {
      setError("Nominal harus lebih dari Rp0.");
      return;
    }

    const transaction = addTransaction({
      name,
      amount,
      category: type === "income" ? "pemasukan" : category,
      account,
      note,
      date: previewDate,
    });

    if (!transaction) {
      setError("Transaksi belum bisa disimpan. Cek kembali datanya.");
      return;
    }

    onSaved?.(transaction);
  }

  return (
    <div className="absolute inset-0 z-[90] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Tutup form transaksi"
        onClick={onClose}
        className="backdrop-in absolute inset-0 bg-[#02050A]/80 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Catat transaksi baru"
        className="sheet-up app-scroll relative max-h-[92%] overflow-y-auto overscroll-contain rounded-t-[34px] border-t border-white/[0.11] bg-[#080D16] pb-8 shadow-[0_-30px_80px_rgba(0,0,0,.6)]"
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

        <form onSubmit={handleSubmit} className="px-5 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-mint/[0.14] bg-mint/[0.07] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-mint">
              <ShieldCheck size={10} strokeWidth={2.1} />
              Tersimpan lokal
            </span>
            <span className="text-[8.5px] font-medium text-slate-600">
              tanpa koneksi bank
            </span>
          </div>

          <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Catat transaksi<span className="text-glacier">.</span>
          </h2>
          <p className="mt-1 text-[9.5px] font-medium text-slate-500">
            Data hanya masuk ke perangkat ini. Tidak ada PIN, OTP, atau nomor rekening.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-[18px] border border-white/[0.06] bg-white/[0.028] p-1.5">
            <button
              type="button"
              onClick={() => changeType("expense")}
              aria-pressed={type === "expense"}
              className={`flex items-center justify-center gap-1.5 rounded-[13px] py-2.5 text-[10px] font-semibold transition ${
                type === "expense"
                  ? "bg-[#CFEDFF] text-[#07131F] shadow-[0_8px_22px_-12px_rgba(180,228,255,.9)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <ArrowUpRight size={13} strokeWidth={2.2} />
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => changeType("income")}
              aria-pressed={type === "income"}
              className={`flex items-center justify-center gap-1.5 rounded-[13px] py-2.5 text-[10px] font-semibold transition ${
                type === "income"
                  ? "bg-mint text-[#04140F] shadow-[0_8px_22px_-12px_rgba(103,228,184,.9)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <ArrowDownLeft size={13} strokeWidth={2.2} />
              Pemasukan
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/[0.075] bg-[linear-gradient(150deg,rgba(255,255,255,.05),rgba(255,255,255,.015))] px-4 py-4">
            <label htmlFor="tx-amount" className="eyebrow">
              Nominal
            </label>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[14px] font-medium text-slate-500">Rp</span>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formatDigits(amountDigits)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full bg-transparent text-[30px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums outline-none placeholder:text-slate-700"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmountDigits(String(value));
                    setError("");
                  }}
                  className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[8.5px] font-semibold text-slate-400 transition hover:border-sky-200/20 hover:text-white"
                >
                  {formatRupiah(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-[20px] border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 focus-within:border-sky-200/25">
            <label
              htmlFor="tx-name"
              className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500"
            >
              <Tag size={11} strokeWidth={1.9} />
              Nama transaksi
            </label>
            <input
              id="tx-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              maxLength={60}
              placeholder="Contoh: Kopi Kenangan"
              className="mt-1.5 w-full bg-transparent text-[12.5px] font-medium text-white outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="mt-4">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Kategori
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {categories.map((item) => {
                const meta = categoryMeta[item];
                const active = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-[14px] border px-2 py-2 text-left text-[9px] font-semibold transition ${
                      active
                        ? "border-sky-200/25 bg-white/[0.07] text-white"
                        : "border-white/[0.06] bg-white/[0.022] text-slate-400 hover:border-white/[0.12]"
                    }`}
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-[8px]"
                      style={{ background: meta.soft, color: meta.accent }}
                    >
                      <CategoryIcon category={item} size={12} />
                    </span>
                    <span className="truncate">{meta.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Sumber dana
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {accounts.map((item) => {
                const active = account === item.bank;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAccount(item.bank)}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[9px] font-semibold transition ${
                      active
                        ? "border-sky-200/25 bg-sky-300/[0.1] text-white"
                        : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12]"
                    }`}
                  >
                    <Landmark size={11} strokeWidth={1.9} />
                    {item.bank}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[1.1fr_1fr] gap-2">
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 focus-within:border-sky-200/25">
              <label
                htmlFor="tx-date"
                className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                <CalendarDays size={11} strokeWidth={1.9} />
                Tanggal
              </label>
              <input
                id="tx-date"
                type="date"
                value={dateValue}
                max={toDateInputValue(new Date())}
                onChange={(event) => setDateValue(event.target.value)}
                className="mt-1 w-full bg-transparent text-[10px] font-medium text-slate-200 outline-none"
              />
            </div>

            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 focus-within:border-sky-200/25">
              <label
                htmlFor="tx-note"
                className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                <StickyNote size={11} strokeWidth={1.9} />
                Catatan
              </label>
              <input
                id="tx-note"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={80}
                placeholder="Opsional"
                className="mt-1 w-full bg-transparent text-[10px] font-medium text-slate-200 outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-[14px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.07] px-3 py-2 text-[9px] font-medium text-[#FFD9A8]"
            >
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-4 py-3.5 text-[9.5px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-[16px] py-3.5 text-[9.5px] font-bold transition active:scale-[0.98] ${
                isValid
                  ? "bg-[#CFEDFF] text-[#07131F] shadow-[0_14px_30px_-14px_rgba(180,228,255,.8)] hover:bg-[#E2F6FF]"
                  : "cursor-not-allowed bg-white/[0.05] text-slate-600"
              }`}
            >
              <Check size={13} strokeWidth={2.6} />
              Simpan transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
