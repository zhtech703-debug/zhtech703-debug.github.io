import { categoryMeta } from "../data";
import { formatRupiah, formatTime } from "../lib/format";
import CategoryIcon from "./CategoryIcon";

export default function TransactionRow({
  transaction,
  onClick,
  className = "",
  compact = false,
  style,
}) {
  const meta = categoryMeta[transaction.category];
  const isIncome = transaction.type === "income";

  return (
    <button
      type="button"
      onClick={() => onClick(transaction)}
      style={style}
      className={`group flex w-full items-center gap-3 rounded-[19px] px-2.5 text-left transition-colors duration-200 hover:bg-white/[0.035] active:bg-white/[0.055] ${compact ? "py-2.5" : "py-3"} ${className}`}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-white/[0.06]"
        style={{ background: meta.soft, color: meta.accent }}
      >
        <CategoryIcon category={transaction.category} size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-[13px] font-medium tracking-[-0.01em] text-slate-100">
            {transaction.name}
          </span>
          <span
            className={`shrink-0 text-[12.5px] font-semibold tracking-[-0.015em] tabular-nums ${
              isIncome ? "text-mint" : "text-slate-100"
            }`}
          >
            {isIncome ? "+" : "−"}
            {formatRupiah(transaction.amount)}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
          <span className="truncate">{meta.label}</span>
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-slate-600" />
          <span className="shrink-0">{formatTime(transaction.date)}</span>
          <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-slate-600" />
          <span className="truncate">{transaction.account}</span>
        </span>
      </span>
    </button>
  );
}
