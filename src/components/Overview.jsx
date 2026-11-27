import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Eye,
  EyeOff,
  FileUp,
  PieChart,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useFinance } from "../lib/store";
import { buildInsights } from "../lib/insights";
import {
  formatHeaderDate,
  formatMonthYear,
  formatRupiah,
  formatRupiahCompact,
} from "../lib/format";
import BankCardCarousel from "./BankCardCarousel";
import Logo from "./Logo";
import TransactionRow from "./TransactionRow";

export default function Overview({
  showBalance,
  onToggleBalance,
  onNavigate,
  onAddTransaction,
  onImportCsv,
  onOpenData,
  onNotify,
  onSelectTransaction,
  onShowAllTransactions,
}) {
  const {
    accounts,
    budgetCategories,
    budgetPercent,
    dailySpending,
    debts,
    debtSummary,
    historyDays,
    monthlyExpense,
    monthlyIncome,
    settings,
    totalBalance,
    totalBudget,
    totalRemaining,
    transactions,
  } = useFinance();
  const maxDaily = Math.max(...dailySpending.map((day) => day.total), 1);
  const weekTotal = dailySpending.reduce((total, day) => total + day.total, 0);
  const currentMonth = formatMonthYear().split(" ")[0];

  const quickActions = [
    {
      label: "Catat",
      icon: Plus,
      color: "#A9DEFF",
      background: "rgba(112, 190, 255, 0.12)",
      onClick: () => onAddTransaction("expense"),
    },
    {
      label: "Pemasukan",
      icon: ArrowDownLeft,
      color: "#8FEBC9",
      background: "rgba(103, 228, 184, 0.1)",
      onClick: () => onAddTransaction("income"),
    },
    {
      label: "Hutang",
      icon: ArrowUpRight,
      color: "#FFCE8F",
      background: "rgba(255, 206, 143, 0.1)",
      onClick: () => onNavigate("debts"),
    },
    {
      label: "Budget",
      icon: PieChart,
      color: "#8BE8F3",
      background: "rgba(87, 220, 236, 0.1)",
      onClick: () => onNavigate("budgets"),
    },
  ];

  const insights = buildInsights({
    transactions,
    budgets: {},
    budgetCategories,
    totalBudget,
    totalSpent: totalBudget - totalRemaining,
    monthlyIncome,
    monthlyExpense,
    totalBalance,
    debts,
    settings,
  });

  return (
    <div className="wide-grid min-h-full">
      <header className="px-5 pt-1">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifikasi"
              onClick={() => onNotify("Belum ada notifikasi baru.")}
              className="relative grid h-9 w-9 place-items-center rounded-[14px] border border-white/[0.075] bg-white/[0.035] text-slate-300 transition hover:bg-white/[0.06] active:scale-95"
            >
              <Bell size={16} strokeWidth={1.9} />
              <span className="pulse-dot absolute right-[9px] top-[9px] h-1.5 w-1.5 rounded-full bg-glacier" />
            </button>
            <button
              type="button"
              aria-label={`Buka profil ${settings.name}`}
              onClick={() => onNavigate("settings")}
              className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[14px] border border-white/20 bg-[linear-gradient(145deg,#cceaff,#5f9fd9_58%,#244260)] text-[12px] font-bold text-[#071523] shadow-[inset_0_1px_0_rgba(255,255,255,.5)] transition active:scale-95"
            >
              {(settings.name || "Z").charAt(0).toUpperCase()}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-tl-[7px] border-l border-t border-[#0A1220] bg-mint" />
            </button>
          </div>
        </div>

        <div className="mt-7">
          <p className="eyebrow">{formatHeaderDate()}</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-white">
            Halo, {settings.name}<span className="text-glacier">.</span>
          </h1>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Semua yang penting, dalam satu pandangan.
          </p>
        </div>
      </header>

      <section data-fold="full" className="mt-7">
        <div className="flex items-end justify-between px-5">
          <div>
            <p className="eyebrow">Dompet saya</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-[19px] font-semibold leading-none tracking-[-0.035em] text-slate-100 tabular-nums">
                {showBalance ? formatRupiah(totalBalance) : "Rp•••••••"}
              </p>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-slate-500">
                {accounts.length} kartu
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleBalance}
            aria-label={showBalance ? "Sembunyikan saldo" : "Tampilkan saldo"}
            className="grid h-8 w-8 place-items-center rounded-[12px] border border-white/[0.07] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200 active:scale-95"
          >
            {showBalance ? (
              <Eye size={15} strokeWidth={1.9} />
            ) : (
              <EyeOff size={15} strokeWidth={1.9} />
            )}
          </button>
        </div>

        <BankCardCarousel showBalance={showBalance} />
      </section>

      <section data-fold="half" className="mt-7 px-5" aria-label="Aksi cepat">
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="fade-up group flex flex-col items-center gap-2 rounded-[21px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.043),rgba(255,255,255,.014))] px-1 pb-2.5 pt-3 transition duration-200 hover:border-white/[0.12] hover:bg-white/[0.055] active:scale-[0.97]"
                style={{ animationDelay: `${80 + index * 45}ms` }}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-[13px] border border-white/[0.055] transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{
                    color: action.color,
                    background: action.background,
                  }}
                >
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span className="text-[10px] font-medium tracking-[-0.01em] text-slate-400">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section data-fold="half" className="mt-6 px-5">
        <div className="surface relative overflow-hidden rounded-[28px] p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="eyebrow">Pengeluaran</p>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  {currentMonth}
                </span>
              </div>
              <p className="mt-2.5 text-[23px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums">
                {formatRupiah(monthlyExpense)}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-mint/[0.09] py-0.5 pl-1 pr-1.5 text-[9px] font-semibold text-mint">
                  <TrendingDown size={11} strokeWidth={2.2} />
                  12,4%
                </span>
                <span className="text-[8px] font-medium text-slate-600">
                  vs bulan lalu
                </span>
              </div>
            </div>

            <div className="w-[108px] shrink-0 pt-0.5">
              <div className="flex items-center justify-between">
                <p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  7 hari
                </p>
                <span className="h-1 w-1 rounded-full bg-glacier shadow-[0_0_7px_rgba(155,217,255,.7)]" />
              </div>
              <div className="mt-2 flex h-[42px] items-end gap-1">
                {dailySpending.map((day, index) => {
                  const height = Math.max((day.total / maxDaily) * 100, 7);
                  const isToday = index === dailySpending.length - 1;
                  return (
                    <div
                      key={day.date.toISOString()}
                      className={`bar-grow w-full rounded-[4px] ${
                        isToday
                          ? "bg-[linear-gradient(180deg,#D8F4FF_0%,#67BDF6_100%)] shadow-[0_0_16px_rgba(103,189,246,.28)]"
                          : "bg-[linear-gradient(180deg,rgba(154,191,224,.34),rgba(120,154,190,.12))]"
                      }`}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${120 + index * 45}ms`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("budgets")}
            className="group relative mt-4 w-full border-t border-white/[0.06] pt-4 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-sky-200/10 bg-sky-300/[0.08] text-glacier">
                  <PieChart size={15} strokeWidth={1.9} />
                </span>
                <div>
                  <p className="text-[10.5px] font-medium text-slate-200">
                    Budget bulan ini
                  </p>
                  <p className="mt-0.5 text-[8.5px] text-slate-500">
                    {budgetPercent}% terpakai
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-100 tabular-nums">
                    {formatRupiah(totalRemaining)}
                  </p>
                  <p className="mt-0.5 text-[8px] text-slate-500">
                    dari {formatRupiahCompact(totalBudget)}
                  </p>
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-slate-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </div>
            <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-white/[0.055]">
              <div
                className="budget-bar h-full rounded-full bg-[linear-gradient(90deg,#4BBDF7,#D2F2FF)] shadow-[0_0_12px_rgba(123,207,255,.3)]"
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
          </button>
        </div>
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <div className="rounded-[23px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Hutang & piutang
              </p>
              <p className="mt-1 text-[15px] font-semibold text-white tabular-nums">
                {formatRupiah(debtSummary.net)}
              </p>
              <p className="mt-0.5 text-[8.5px] font-medium text-slate-500">
                {debtSummary.receivableCount} piutang · {debtSummary.payableCount} hutang
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("debts")}
              className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[8.5px] font-semibold text-slate-300 transition hover:bg-white/[0.06]"
            >
              Buka
            </button>
          </div>
          {(debtSummary.overdueCount > 0 || debtSummary.dueSoonCount > 0) && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[8.5px] font-medium text-[#FFD9A8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFCE8F]" />
              {debtSummary.overdueCount > 0
                ? `${debtSummary.overdueCount} catatan lewat jatuh tempo`
                : `${debtSummary.dueSoonCount} catatan jatuh tempo minggu ini`}
            </p>
          )}
        </div>
      </section>

      {insights.length > 0 && (
        <section data-fold="half" className="mt-5 px-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-slate-100">
              Saran untuk kamu
            </p>
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="text-[9px] font-semibold text-glacier/75 transition hover:text-glacier"
            >
              Lihat semua
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {insights.slice(0, 3).map((insight) => (
              <button
                key={insight.id}
                type="button"
                onClick={() => insight.action?.tab && onNavigate(insight.action.tab)}
                className="flex w-full items-start gap-3 rounded-[20px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))] p-3.5 text-left transition hover:border-white/[0.12]"
              >
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    insight.tone === "danger"
                      ? "bg-[#FF9C9C]"
                      : insight.tone === "warning"
                        ? "bg-[#FFCE8F]"
                        : insight.tone === "good"
                          ? "bg-mint"
                          : "bg-glacier"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-slate-200">
                    {insight.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[8.5px] font-medium leading-relaxed text-slate-500">
                    {insight.body}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section data-fold="full" className="mt-7 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-slate-100">
              Transaksi terbaru
            </p>
            <p className="mt-0.5 text-[9px] font-medium text-slate-600">
              {transactions.length} transaksi dalam {historyDays} hari
            </p>
          </div>
          <button
            type="button"
            onClick={onShowAllTransactions}
            className="group flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] py-1.5 pl-3 pr-2 text-[9px] font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            Lihat semua
            <ArrowUpRight
              size={12}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
        </div>

        <div className="mt-3 rounded-[26px] border border-white/[0.065] bg-[linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.013))] p-1.5">
          {transactions.slice(0, 5).map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onClick={onSelectTransaction}
            />
          ))}
        </div>
      </section>

      <section data-fold="half" className="mt-5 px-5">
        <button
          type="button"
          onClick={() => onNavigate("budgets")}
          className="group relative w-full overflow-hidden rounded-[25px] border border-sky-200/[0.09] bg-[linear-gradient(135deg,rgba(54,133,205,0.15),rgba(13,31,55,0.28))] p-4 text-left transition hover:border-sky-200/[0.16]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-sky-300/20 blur-3xl"
          />
          <div className="relative flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] border border-sky-100/10 bg-sky-200/[0.09] text-glacier">
              <Sparkles size={16} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-100/60">
                Insight mingguan
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-300">
                Kamu belanja {formatRupiahCompact(weekTotal)} dalam 7 hari terakhir.
                Masih ada {formatRupiah(totalRemaining)} di budget bulan ini.
              </p>
            </div>
            <ArrowUpRight
              size={15}
              className="shrink-0 text-sky-200/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </div>
        </button>
      </section>

      <section data-fold="half" className="mt-3 px-5">
        <div className="rounded-[23px] border border-white/[0.065] bg-white/[0.022] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] border border-mint/[0.12] bg-mint/[0.07] text-mint">
              <ShieldCheck size={15} strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-200">
                Mode aman &amp; gratis
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                Transaksi, impor CSV, dan backup diproses lokal di perangkat ini.
                Tanpa koneksi bank, PIN, OTP, atau langganan berbayar.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenData}
              className="shrink-0 self-center rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[8px] font-semibold text-slate-500 transition hover:border-white/[0.14] hover:text-slate-300"
            >
              Kelola data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
