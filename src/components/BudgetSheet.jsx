import { useEffect, useMemo, useState } from "react";
import { Lightbulb, RotateCcw, Sparkles, Wallet } from "lucide-react";
import { budgetCategoryKeys, budgetLimits, categoryMeta } from "../data";
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  summarize,
} from "../lib/analytics";
import { formatRupiah, formatRupiahCompact } from "../lib/format";
import { useFinance } from "../lib/store";
import {
  CancelButton,
  ErrorNote,
  InfoNote,
  SheetShell,
  SubmitButton,
  formatDigits,
} from "./SheetKit";

const roundTo = (value, step = 10_000) =>
  Math.max(Math.round(value / step) * step, 0);

export default function BudgetSheet({ open, onClose, onSaved }) {
  const {
    budgetCategories,
    budgets,
    settings,
    transactions,
    updateBudgets,
  } = useFinance();
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (!open) return;
    setValues(
      Object.fromEntries(
        budgetCategoryKeys.map((category) => [
          category,
          String(Math.round(budgets[category] ?? 0)),
        ]),
      ),
    );
    setError("");
    setHint("");
  }, [open, budgets]);

  const spentByCategory = useMemo(
    () =>
      Object.fromEntries(
        budgetCategories.map((budget) => [budget.category, budget.spent]),
      ),
    [budgetCategories],
  );

  const total = budgetCategoryKeys.reduce(
    (sum, category) => sum + Number(values[category] || 0),
    0,
  );

  function applyProfileSuggestion() {
    const income = Number(settings.incomeTarget) || 0;
    if (income <= 0) {
      setError(
        "Isi pendapatan acuan bulanan di Profil terlebih dahulu agar saran 50/30/20 bisa dihitung.",
      );
      return;
    }

    const needs = income * 0.5;
    const wants = income * 0.3;
    const next = {
      makan: roundTo(needs * 0.4),
      transport: roundTo(needs * 0.15),
      tagihan: roundTo(needs * 0.3),
      kesehatan: roundTo(needs * 0.15),
      belanja: roundTo(wants * 0.6),
      hiburan: roundTo(wants * 0.4),
    };

    setValues(
      Object.fromEntries(
        budgetCategoryKeys.map((category) => [category, String(next[category])]),
      ),
    );
    setError("");
    setHint(
      `Pola 50/30/20: kebutuhan 50%, keinginan 30%, tabungan 20% dari ${formatRupiah(income)}.`,
    );
  }

  function applyAverageSuggestion() {
    const now = new Date();
    const totals = Object.fromEntries(
      budgetCategoryKeys.map((category) => [category, 0]),
    );
    let monthsWithData = 0;

    for (let index = 0; index < 3; index += 1) {
      const month = addMonths(now, -index);
      const summary = summarize(
        transactions,
        startOfMonth(month),
        endOfMonth(month),
      );
      if (summary.count > 0) monthsWithData += 1;
      summary.items.forEach((transaction) => {
        if (transaction.type !== "expense") return;
        if (totals[transaction.category] === undefined) return;
        totals[transaction.category] += transaction.amount;
      });
    }

    if (monthsWithData === 0) {
      setError("Belum ada transaksi untuk menghitung rata-rata 3 bulan.");
      return;
    }

    const next = Object.fromEntries(
      budgetCategoryKeys.map((category) => [
        category,
        roundTo((totals[category] / monthsWithData) * 1.05),
      ]),
    );

    setValues(
      Object.fromEntries(
        budgetCategoryKeys.map((category) => [category, String(next[category])]),
      ),
    );
    setError("");
    setHint(
      "Budget disesuaikan dari rata-rata 3 bulan terakhir + 5% ruang aman.",
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const patch = Object.fromEntries(
      budgetCategoryKeys.map((category) => [
        category,
        Math.max(Math.round(Number(values[category] || 0)), 0),
      ]),
    );

    updateBudgets(patch);
    onSaved?.(
      `Budget ${formatRupiah(
        Object.values(patch).reduce((sum, value) => sum + value, 0),
      )} disimpan.`,
    );
    onClose();
  }

  function handleReset() {
    setValues(
      Object.fromEntries(
        budgetCategoryKeys.map((category) => [
          category,
          String(budgetLimits[category]),
        ]),
      ),
    );
    setHint("Nilai budget contoh dipulihkan. Tekan simpan untuk menerapkan.");
    setError("");
  }

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      label="Atur budget bulanan"
      title="Atur budget"
      subtitle="Tentukan batas belanja per kategori. Semua angka bisa diubah kapan saja."
      badge={
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/15 bg-sky-300/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-glacier">
          <Wallet size={10} strokeWidth={2.1} />
          Bulan berjalan
        </span>
      }
    >
      <div className="mt-4 rounded-[22px] border border-white/[0.07] bg-[linear-gradient(150deg,rgba(255,255,255,.05),rgba(255,255,255,.015))] px-4 py-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Total budget
            </p>
            <p className="mt-1 text-[21px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">
              {formatRupiah(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[8px] font-semibold text-slate-500 transition hover:text-slate-300"
          >
            <RotateCcw size={10} strokeWidth={2} />
            Contoh
          </button>
        </div>
        <p className="mt-1 text-[8px] text-slate-600">
          {formatRupiahCompact(total)} per bulan · {budgetCategoryKeys.length} kategori
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={applyProfileSuggestion}
          className="flex items-start gap-2 rounded-[16px] border border-sky-200/[0.1] bg-sky-300/[0.05] px-3 py-2.5 text-left transition hover:bg-sky-300/[0.09]"
        >
          <Sparkles size={13} className="mt-0.5 shrink-0 text-glacier" />
          <span>
            <span className="block text-[8.5px] font-semibold text-slate-200">
              Saran 50/30/20
            </span>
            <span className="mt-0.5 block text-[7.5px] leading-relaxed text-slate-500">
              Dari pendapatan acuan
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={applyAverageSuggestion}
          className="flex items-start gap-2 rounded-[16px] border border-mint/[0.1] bg-mint/[0.04] px-3 py-2.5 text-left transition hover:bg-mint/[0.08]"
        >
          <Lightbulb size={13} className="mt-0.5 shrink-0 text-mint" />
          <span>
            <span className="block text-[8.5px] font-semibold text-slate-200">
              Ikuti 3 bulan
            </span>
            <span className="mt-0.5 block text-[7.5px] leading-relaxed text-slate-500">
              Rata-rata + 5% aman
            </span>
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="space-y-2">
          {budgetCategoryKeys.map((category) => {
            const meta = categoryMeta[category];
            const spent = spentByCategory[category] ?? 0;
            const limit = Number(values[category] || 0);
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            return (
              <div
                key={category}
                className="rounded-[18px] border border-white/[0.06] bg-white/[0.022] px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: meta.accent }}
                    />
                    <span className="text-[10px] font-semibold text-slate-200">
                      {meta.label}
                    </span>
                  </span>
                  <span
                    className={`text-[8px] font-semibold tabular-nums ${
                      percent >= 100
                        ? "text-[#FFC2C2]"
                        : percent >= 80
                          ? "text-[#FFD9A8]"
                          : "text-slate-600"
                    }`}
                  >
                    {percent}% terpakai
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2 rounded-[13px] border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 focus-within:border-sky-200/25">
                  <span className="text-[10px] font-medium text-slate-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatDigits(values[category] ?? "")}
                    onChange={(event) => {
                      const digits = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);
                      setValues((current) => ({
                        ...current,
                        [category]: digits,
                      }));
                      setError("");
                      setHint("");
                    }}
                    aria-label={`Budget ${meta.label}`}
                    placeholder="0"
                    className="w-full bg-transparent text-[12px] font-semibold text-white tabular-nums outline-none placeholder:text-slate-700"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[7.5px] font-medium text-slate-600">
                  <span>Terpakai {formatRupiahCompact(spent)}</span>
                  <span>
                    {limit > 0
                      ? `Sisa ${formatRupiahCompact(Math.max(limit - spent, 0))}`
                      : "Belum diatur"}
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(percent, 100)}%`,
                      background: meta.bar,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {hint && <InfoNote tone="good">{hint}</InfoNote>}
        <ErrorNote>{error}</ErrorNote>

        <InfoNote>
          Budget membantu membatasi pengeluaran, bukan mengunci rekening. Kamu
          tetap bisa mencatat transaksi apa pun.
        </InfoNote>

        <div className="mt-5 flex items-center gap-2.5">
          <CancelButton onClick={onClose} />
          <SubmitButton disabled={total <= 0}>Simpan budget</SubmitButton>
        </div>
      </form>
    </SheetShell>
  );
}
