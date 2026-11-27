import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  PieChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useFinance } from "../lib/store";
import {
  buildDailySeries,
  buildMonthlySeries,
  categoryBreakdown,
  percentChange,
  resolvePeriod,
  summarize,
  topMerchants,
} from "../lib/analytics";
import { formatRupiah, formatRupiahCompact } from "../lib/format";
import { CashflowChart, CategoryDonut, MonthlyBars } from "./Charts";
import { categoryMeta } from "../data";

const PERIODS = [
  { id: "7d", label: "7 hari" },
  { id: "30d", label: "30 hari" },
  { id: "month", label: "Bulan ini" },
  { id: "6m", label: "6 bulan" },
];

export default function Recap({ onOpenExport, onNotify }) {
  const { monthlySeries, transactions } = useFinance();
  const [period, setPeriod] = useState("30d");
  const resolved = useMemo(() => resolvePeriod(period), [period]);
  const previous = useMemo(() => {
    const start = new Date(resolved.start);
    const end = new Date(resolved.end);
    const days = Math.round((end - start) / 86_400_000) + 1;
    const previousEnd = new Date(start.getTime() - 86_400_000);
    const previousStart = new Date(
      previousEnd.getTime() - (days - 1) * 86_400_000,
    );
    return { start: previousStart, end: previousEnd };
  }, [resolved]);

  const summary = useMemo(
    () => summarize(transactions, resolved.start, resolved.end),
    [transactions, resolved],
  );
  const previousSummary = useMemo(
    () => summarize(transactions, previous.start, previous.end),
    [transactions, previous],
  );
  const daily = useMemo(
    () =>
      buildDailySeries(
        transactions,
        resolved.id === "7d" ? 7 : resolved.id === "30d" ? 30 : 14,
        resolved.end,
      ),
    [transactions, resolved],
  );
  const monthly = useMemo(
    () => buildMonthlySeries(transactions, 6, new Date()),
    [transactions],
  );
  const categories = useMemo(
    () => categoryBreakdown(transactions, resolved.start, resolved.end),
    [transactions, resolved],
  );
  const merchants = useMemo(
    () => topMerchants(transactions, resolved.start, resolved.end, 5),
    [transactions, resolved],
  );

  const totalExpense = summary.expense;
  const expenseChange = percentChange(
    summary.expense,
    previousSummary.expense,
  );
  const incomeChange = percentChange(
    summary.income,
    previousSummary.income,
  );

  return (
    <div className="wide-grid min-h-full">
      <header className="px-5 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Rekap dinamis</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-white">
              Rekap<span className="text-glacier">.</span>
            </h1>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              Arus kas, kategori, dan tren mengikuti catatan.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenExport}
            className="mt-1 flex items-center gap-1.5 rounded-full border border-sky-200/15 bg-sky-300/[0.08] py-2 pl-3 pr-3.5 text-[9px] font-semibold text-glacier transition hover:bg-sky-300/[0.13] active:scale-95"
          >
            <Download size={13} strokeWidth={2.2} />
            Ekspor
          </button>
        </div>

        <div className="app-scroll -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-0.5">
          {PERIODS.map((item) => {
            const active = period === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? "border-transparent bg-[#CDEEFF] text-[#07131F] shadow-[0_7px_22px_-10px_rgba(174,227,255,.7)]"
                    : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <section data-fold="full" className="mt-5 px-5">
        <div className="relative overflow-hidden rounded-[30px] border border-sky-200/[0.11] bg-[linear-gradient(145deg,#102D50_0%,#0A1D34_48%,#07111F_100%)] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,.9)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.075] bg-white/[0.045] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              <CalendarDays size={11} strokeWidth={1.9} className="text-glacier" />
              {resolved.label}
            </span>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-mint/75">
                  Pemasukan
                </p>
                <p className="mt-1.5 text-[17px] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">
                  {formatRupiah(summary.income)}
                </p>
                <p
                  className={`mt-1.5 flex items-center gap-1 text-[8px] font-medium ${
                    incomeChange >= 0 ? "text-mint" : "text-[#FFC2C2]"
                  }`}
                >
                  {incomeChange >= 0 ? (
                    <TrendingUp size={10} strokeWidth={2.2} />
                  ) : (
                    <TrendingDown size={10} strokeWidth={2.2} />
                  )}
                  {Math.abs(incomeChange).toFixed(0)}% vs periode lalu
                </p>
              </div>
              <div className="border-l border-white/[0.07] pl-3">
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sky-200/70">
                  Pengeluaran
                </p>
                <p className="mt-1.5 text-[17px] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">
                  {formatRupiah(summary.expense)}
                </p>
                <p
                  className={`mt-1.5 flex items-center gap-1 text-[8px] font-medium ${
                    expenseChange <= 0 ? "text-mint" : "text-[#FFC2C2]"
                  }`}
                >
                  {expenseChange <= 0 ? (
                    <TrendingDown size={10} strokeWidth={2.2} />
                  ) : (
                    <TrendingUp size={10} strokeWidth={2.2} />
                  )}
                  {Math.abs(expenseChange).toFixed(0)}% vs periode lalu
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Arus kas bersih
                </p>
                <p
                  className={`mt-1.5 text-[22px] font-semibold leading-none tracking-[-0.045em] tabular-nums ${
                    summary.net >= 0 ? "text-white" : "text-[#FFD9A8]"
                  }`}
                >
                  {formatRupiah(summary.net)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Rata-rata / hari
                </p>
                <p className="mt-1.5 text-[12px] font-semibold text-slate-200 tabular-nums">
                  {formatRupiah(Math.round(summary.averageDailyExpense))}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.025] px-2 py-2">
                <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                  Transaksi
                </p>
                <p className="mt-1 text-[12px] font-semibold text-slate-200 tabular-nums">
                  {summary.count}
                </p>
              </div>
              <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.025] px-2 py-2">
                <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                  Masuk
                </p>
                <p className="mt-1 text-[12px] font-semibold text-mint tabular-nums">
                  {summary.incomeCount}
                </p>
              </div>
              <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.025] px-2 py-2">
                <p className="text-[7px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                  Keluar
                </p>
                <p className="mt-1 text-[12px] font-semibold text-slate-200 tabular-nums">
                  {summary.expenseCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <div className="rounded-[26px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Arus kas kumulatif
              </p>
              <p className="mt-1 text-[9px] font-medium text-slate-600">
                {resolved.label} · {daily.length} titik data
              </p>
            </div>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[8px] font-semibold text-slate-400">
              Dinamis
            </span>
          </div>
          <div className="mt-3">
            <CashflowChart data={daily} height={150} />
          </div>
        </div>
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <div className="rounded-[26px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Pemasukan vs pengeluaran
              </p>
              <p className="mt-1 text-[9px] font-medium text-slate-600">
                6 bulan terakhir
              </p>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-mint" />
                Masuk
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-glacier" />
                Keluar
              </span>
            </div>
          </div>
          <div className="mt-3">
            <MonthlyBars data={monthly} height={158} />
          </div>
        </div>
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-slate-100">
              Pengeluaran per kategori
            </p>
            <p className="mt-0.5 text-[9.5px] font-medium text-slate-600">
              {categories.length} kategori · {resolved.label}
            </p>
          </div>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Donut
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="mt-3 rounded-[22px] border border-dashed border-white/[0.09] bg-white/[0.018] px-6 py-8 text-center text-[9px] text-slate-500">
            Belum ada pengeluaran pada periode ini.
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-4 rounded-[26px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))] p-4">
            <CategoryDonut
              data={categories}
              size={132}
              total={totalExpense}
            />
            <div className="min-w-0 flex-1 space-y-2">
              {categories.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: category.accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[9.5px] font-medium text-slate-200">
                        {category.label}
                      </p>
                      <p className="shrink-0 text-[9px] font-semibold text-slate-300 tabular-nums">
                        {formatRupiahCompact(category.amount)}
                      </p>
                    </div>
                    <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(category.percent, 100)}%`,
                          background: category.bar,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right text-[8px] font-semibold text-slate-500 tabular-nums">
                    {Math.round(category.percent)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-slate-100">
              Merchant terbesar
            </p>
            <p className="mt-0.5 text-[9.5px] font-medium text-slate-600">
              Pengeluaran terbesar pada periode ini
            </p>
          </div>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            Top 5
          </span>
        </div>

        {merchants.length === 0 ? (
          <div className="mt-3 rounded-[22px] border border-dashed border-white/[0.09] bg-white/[0.018] px-6 py-8 text-center text-[9px] text-slate-500">
            Belum ada pengeluaran pada periode ini.
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-[23px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))]">
            {merchants.map((merchant, index) => (
              <div
                key={merchant.name}
                className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[10px] border border-white/[0.05] bg-white/[0.03] text-[9px] font-bold text-slate-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold text-slate-200">
                      {merchant.name}
                    </p>
                    <p className="text-[8px] font-medium text-slate-600">
                      {merchant.count} transaksi
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-[10.5px] font-semibold tabular-nums text-white">
                  {formatRupiah(merchant.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section data-fold="full" className="mt-5 px-5">
        <div className="rounded-[23px] border border-white/[0.065] bg-white/[0.022] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] border border-sky-100/10 bg-sky-200/[0.08] text-glacier">
              <Sparkles size={15} strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-200">
                Ringkasan periode
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                {summary.net >= 0
                  ? `Kamu surplus ${formatRupiah(summary.net)} pada periode ini. Tabungan dan dana darurat bisa ditambah.`
                  : `Kamu defisit ${formatRupiah(Math.abs(summary.net))}. Kurangi pengeluaran tidak wajib sampai arus kas positif.`}
              </p>
            </div>
            <ArrowUpRight
              size={14}
              className="shrink-0 text-slate-600"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
