import {
  ArrowUpRight,
  Lightbulb,
  PencilLine,
  Sparkles,
  Wallet,
} from "lucide-react";
import { categoryMeta } from "../data";
import { useFinance } from "../lib/store";
import {
  formatMonthYear,
  formatRupiah,
  formatRupiahCompact,
} from "../lib/format";
import CategoryIcon from "./CategoryIcon";
import ProgressRing from "./ProgressRing";

export default function Budgets({ onOpenCategory, onOpenBudget, onNotify }) {
  const {
    budgetCategories,
    budgetPercent,
    monthlyExpense,
    totalBudget,
    totalRemaining,
    totalSpent,
  } = useFinance();
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft = Math.max(daysInMonth - now.getDate() + 1, 1);
  const dailyAverage = Math.round(monthlyExpense / now.getDate());
  const remainingPerDay = Math.round(totalRemaining / daysLeft);

  return (
    <div className="wide-grid min-h-full">
      <header className="px-5 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Rencana bulan ini</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-white">
              Budget<span className="text-glacier">.</span>
            </h1>
            <p className="mt-2 text-[10px] font-medium capitalize text-slate-500">
              {formatMonthYear()} · {budgetCategories.length} kategori
            </p>
          </div>
          <button
            type="button"
            onClick={() => (onOpenBudget ? onOpenBudget() : onNotify("Pengaturan budget akan segera hadir."))}
            className="mt-1 flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.035] py-2 pl-3 pr-3.5 text-[9px] font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            <PencilLine size={12} strokeWidth={1.9} className="text-glacier" />
            Atur
          </button>
        </div>
      </header>

      <section data-fold="full" className="mt-6 px-5">
        <div className="relative overflow-hidden rounded-[30px] border border-sky-200/[0.11] bg-[linear-gradient(145deg,#102D50_0%,#0A1D34_48%,#07111F_100%)] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,.9)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full border border-white/[0.055]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
          />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.075] bg-white/[0.045] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                <Wallet size={11} strokeWidth={1.9} className="text-glacier" />
                Total budget
              </span>
              <p className="mt-4 text-[24px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums">
                {formatRupiah(totalRemaining)}
              </p>
              <p className="mt-1.5 text-[9px] font-medium text-slate-400">
                tersisa dari {formatRupiah(totalBudget)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_10px_rgba(103,228,184,.5)]" />
                <p className="text-[8.5px] font-medium text-slate-500">
                  {formatRupiahCompact(totalSpent)} sudah terpakai
                </p>
              </div>
            </div>

            <ProgressRing
              value={budgetPercent}
              size={96}
              stroke={7}
              gradientFrom="#4BBDF7"
              gradientTo="#D2F2FF"
            >
              <div className="text-center">
                <p className="text-[23px] font-semibold leading-none tracking-[-0.05em] text-white tabular-nums">
                  {budgetPercent}
                  <span className="text-[10px] font-medium text-slate-500">%</span>
                </p>
                <p className="mt-1 text-[6.5px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                  terpakai
                </p>
              </div>
            </ProgressRing>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Rata-rata harian
              </p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200 tabular-nums">
                {formatRupiah(dailyAverage)}
              </p>
            </div>
            <div className="border-l border-white/[0.07] pl-3">
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Sisa / hari
              </p>
              <p className="mt-1 text-[12px] font-semibold text-slate-200 tabular-nums">
                {formatRupiah(remainingPerDay)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-fold="half" className="mt-7 px-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-slate-100">
              Kategori budget
            </p>
            <p className="mt-0.5 text-[9.5px] font-medium text-slate-600">
              Ketuk kategori untuk melihat transaksinya
            </p>
          </div>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            {daysLeft} hari lagi
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {budgetCategories.map((budget, index) => {
            const category = categoryMeta[budget.category];
            const isTight = budget.percent >= 90;

            return (
              <button
                key={budget.category}
                type="button"
                onClick={() => onOpenCategory(budget.category)}
                className="fade-up group relative overflow-hidden rounded-[23px] border border-white/[0.065] bg-[linear-gradient(155deg,rgba(255,255,255,.042),rgba(255,255,255,.015))] p-4 text-left transition duration-200 hover:border-white/[0.12] hover:bg-white/[0.05] active:scale-[0.985]"
                style={{ animationDelay: `${60 + index * 45}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-[11px] border border-white/[0.055]"
                    style={{ background: category.soft, color: category.accent }}
                  >
                    <CategoryIcon category={budget.category} size={15} />
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold tabular-nums ${
                      isTight
                        ? "bg-[#FFCE8F]/10 text-[#FFCE8F]"
                        : "bg-white/[0.045] text-slate-400"
                    }`}
                  >
                    {budget.percent}%
                  </span>
                </div>

                <p className="mt-3 truncate text-[11px] font-medium text-slate-300">
                  {budget.label}
                </p>
                <p className="mt-1 text-[13.5px] font-semibold leading-none tracking-[-0.025em] text-white tabular-nums">
                  {formatRupiah(budget.spent)}
                </p>
                <p className="mt-1.5 text-[8.5px] font-medium text-slate-600">
                  dari {formatRupiahCompact(budget.limit)}
                </p>

                <div className="mt-3 h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="budget-bar h-full rounded-full"
                    style={{
                      width: `${Math.min(budget.percent, 100)}%`,
                      background: category.bar,
                      animationDelay: `${150 + index * 60}ms`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-[8.5px] font-medium ${
                      isTight ? "text-[#FFCE8F]/80" : "text-slate-500"
                    }`}
                  >
                    {budget.remaining >= 0
                      ? `Sisa ${formatRupiahCompact(budget.remaining)}`
                      : `Lewat ${formatRupiahCompact(Math.abs(budget.remaining))}`}
                  </p>
                  <ArrowUpRight
                    size={11}
                    className="shrink-0 text-slate-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-400"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <div className="relative overflow-hidden rounded-[25px] border border-sky-200/[0.085] bg-[linear-gradient(135deg,rgba(47,122,194,0.14),rgba(10,24,42,0.3))] p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-sky-300/15 blur-3xl"
          />
          <div className="relative flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] border border-sky-100/10 bg-sky-200/[0.08] text-glacier">
              <Lightbulb size={16} strokeWidth={1.8} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-100/60">
                  Insight budget
                </p>
                <Sparkles size={10} className="text-glacier/60" />
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-300">
                {daysLeft} hari lagi. Kamu bisa pakai sekitar{" "}
                <span className="font-semibold text-glacier">
                  {formatRupiah(Math.round(totalRemaining / daysLeft))}
                </span>{" "}
                per hari agar budget tetap aman.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
