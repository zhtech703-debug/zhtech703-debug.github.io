import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Search,
  X,
} from "lucide-react";
import {
  categoryMeta,
  getDayTotal,
  groupTransactions,
} from "../data";
import { useFinance } from "../lib/store";
import {
  formatGroupDate,
  formatRupiah,
} from "../lib/format";
import TransactionRow from "./TransactionRow";

const filters = [
  { id: "semua", label: "Semua" },
  ...Object.entries(categoryMeta).map(([id, meta]) => ({
    id,
    label: meta.label,
  })),
];

export default function Transactions({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSelectTransaction,
}) {
  const {
    historyDays,
    monthlyExpense,
    monthlyIncome,
    transactions,
  } = useFinance();
  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesFilter =
        activeFilter === "semua" || transaction.category === activeFilter;
      if (!matchesFilter) return false;

      if (!normalizedQuery) return true;

      const meta = categoryMeta[transaction.category];
      return [
        transaction.name,
        meta.label,
        transaction.account,
        transaction.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, searchQuery, transactions]);

  const groups = useMemo(
    () => groupTransactions(filteredTransactions),
    [filteredTransactions],
  );

  function resetFilters() {
    onFilterChange("semua");
    onSearchChange("");
  }

  const activeFilterLabel =
    filters.find((filter) => filter.id === activeFilter)?.label ?? "Semua";

  return (
    <div className="fold-column min-h-full">
      <header className="px-5 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Aktivitas</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-white">
              Transaksi<span className="text-glacier">.</span>
            </h1>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              {historyDays} hari terakhir · {transactions.length} transaksi
            </p>
          </div>
          <div className="mt-1 flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-[9px] font-medium text-slate-400">
            <CalendarDays size={12} strokeWidth={1.9} className="text-glacier" />
            {historyDays} hari
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2.5 rounded-[17px] border border-white/[0.075] bg-white/[0.035] px-3.5 py-3 transition duration-200 focus-within:border-sky-200/25 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_rgba(96,183,255,0.055)]">
          <Search size={15} strokeWidth={1.9} className="shrink-0 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari transaksi, merchant, atau kategori..."
            aria-label="Cari transaksi"
            className="w-full bg-transparent text-[11px] font-medium text-white outline-none placeholder:text-slate-600 focus:outline-none focus-visible:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.07] text-slate-400 transition hover:text-white"
            >
              <X size={11} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-[21px] border border-mint/[0.09] bg-[linear-gradient(145deg,rgba(60,201,153,0.09),rgba(255,255,255,0.014))] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-mint/70">
                Pemasukan
              </p>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-mint/[0.09] text-mint">
                <ArrowDownLeft size={12} strokeWidth={2.1} />
              </span>
            </div>
            <p className="mt-2.5 text-[14px] font-semibold tracking-[-0.03em] text-slate-100 tabular-nums">
              {formatRupiah(monthlyIncome)}
            </p>
            <p className="mt-1 text-[8px] font-medium text-slate-600">bulan ini</p>
          </div>

          <div className="rounded-[21px] border border-sky-200/[0.08] bg-[linear-gradient(145deg,rgba(87,165,239,0.09),rgba(255,255,255,0.014))] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-sky-200/60">
                Pengeluaran
              </p>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-300/[0.08] text-glacier">
                <ArrowUpRight size={12} strokeWidth={2.1} />
              </span>
            </div>
            <p className="mt-2.5 text-[14px] font-semibold tracking-[-0.03em] text-slate-100 tabular-nums">
              {formatRupiah(monthlyExpense)}
            </p>
            <p className="mt-1 text-[8px] font-medium text-slate-600">bulan ini</p>
          </div>
        </div>

        <div className="app-scroll -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-0.5">
          {filters.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? "border-transparent bg-[#CDEEFF] text-[#07131F] shadow-[0_7px_22px_-10px_rgba(174,227,255,.7)]"
                    : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-slate-200"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-5 flex items-center justify-between px-5">
        <p className="text-[9px] font-medium text-slate-500">
          <span className="font-semibold text-slate-300">{filteredTransactions.length}</span>{" "}
          transaksi · {activeFilterLabel}
        </p>
        {(activeFilter !== "semua" || searchQuery) && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[9px] font-semibold text-glacier/75 transition hover:text-glacier"
          >
            Reset
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="mx-5 mt-4 rounded-[26px] border border-dashed border-white/[0.09] bg-white/[0.018] px-6 py-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-[17px] border border-white/[0.06] bg-white/[0.035] text-slate-500">
            <Search size={20} strokeWidth={1.6} />
          </span>
          <p className="mt-4 text-[12px] font-semibold text-slate-200">
            Transaksi tidak ditemukan
          </p>
          <p className="mx-auto mt-1.5 max-w-[220px] text-[9.5px] leading-relaxed text-slate-500">
            Coba kata kunci lain atau reset filter untuk melihat semua aktivitas.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full border border-sky-200/15 bg-sky-300/[0.08] px-4 py-2 text-[9px] font-semibold text-glacier transition hover:bg-sky-300/[0.13]"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="pb-2">
          {groups.map((group, groupIndex) => {
            const expenseTotal = getDayTotal(group.items, "expense");
            const incomeTotal = getDayTotal(group.items, "income");
            const isToday = groupIndex === 0;

            return (
              <section key={group.key} className="mt-4 px-5">
                <div className="flex items-center justify-between gap-3 px-0.5">
                  <p
                    className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${
                      isToday ? "text-glacier" : "text-slate-500"
                    }`}
                  >
                    {formatGroupDate(group.date)}
                  </p>
                  <p className="text-[8.5px] font-medium tabular-nums text-slate-600">
                    {expenseTotal > 0
                      ? `−${formatRupiah(expenseTotal)}`
                      : `+${formatRupiah(incomeTotal)}`}
                  </p>
                </div>

                <div className="mt-2 rounded-[23px] border border-white/[0.06] bg-[linear-gradient(160deg,rgba(255,255,255,.032),rgba(255,255,255,.012))] p-1.5">
                  {group.items.map((transaction, index) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onClick={onSelectTransaction}
                      compact
                      className="fade-up"
                      style={{ animationDelay: `${Math.min(index * 35, 180)}ms` }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
