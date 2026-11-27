import {
  addDays,
  averageMonthlyExpense,
  endOfDay,
  startOfDay,
  summarize,
} from "./analytics.js";
import { debtTotals } from "./debts.js";
import { formatRupiah, formatRupiahCompact } from "./format.js";

/**
 * Mesin saran keuangan sederhana namun relevan. Aturannya transparan:
 * arus kas, tabungan, budget, dana darurat, dan hutang. Tidak memakai AI,
 * tidak mengirim data ke mana pun.
 */

const TONE_ORDER = { danger: 0, warning: 1, info: 2, good: 3 };

export function buildInsights({
  transactions = [],
  budgets = {},
  budgetCategories = [],
  totalBudget = 0,
  totalSpent = 0,
  monthlyIncome = 0,
  monthlyExpense = 0,
  totalBalance = 0,
  debts = [],
  settings = {},
  now = new Date(),
} = {}) {
  const insights = [];

  // Installasi baru benar-benar kosong: jangan tampilkan angka "Rp1/bulan".
  if (
    transactions.length === 0 &&
    debts.length === 0 &&
    totalBalance === 0 &&
    totalBudget === 0
  ) {
    return [
      {
        id: "start-here",
        tone: "info",
        priority: 1,
        title: "Mulai dari tiga langkah sederhana",
        body: "Tambah kartu/dompet, catat transaksi pertama, lalu atur budget bulanan. Semua data tetap tersimpan di perangkat ini.",
        action: { label: "Lihat beranda", tab: "overview" },
      },
    ];
  }

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const savingsTarget = Number(settings.savingsTargetPercent) || 20;
  const emergencyTarget = Number(settings.emergencyFundMonths) || 3;
  const debt = debtTotals(debts);
  const net = monthlyIncome - monthlyExpense;
  const savingsRate =
    monthlyIncome > 0 ? (net / monthlyIncome) * 100 : null;
  const topCategory = [...budgetCategories]
    .filter((budget) => budget.limit > 0)
    .sort((a, b) => b.spent - a.spent)[0];
  const overBudget = budgetCategories
    .filter((budget) => budget.limit > 0 && budget.percent >= 100)
    .sort((a, b) => b.percent - a.percent);
  const nearLimit = budgetCategories
    .filter((budget) => budget.limit > 0 && budget.percent >= 80 && budget.percent < 100)
    .sort((a, b) => b.percent - a.percent);

  if (monthlyIncome > 0 && net < 0) {
    insights.push({
      id: "cashflow-negative",
      tone: "danger",
      priority: 1,
      title: "Pengeluaran lebih besar dari pemasukan",
      body: `Bulan ini kamu belanja ${formatRupiah(monthlyExpense)} dan menerima ${formatRupiah(monthlyIncome)}. Selisihnya ${formatRupiah(Math.abs(net))}. Tahan pengeluaran tidak wajib sampai arus kas kembali positif.`,
      action: { label: "Lihat rekap", tab: "recap" },
    });
  } else if (monthlyIncome > 0 && savingsRate !== null && savingsRate < savingsTarget) {
    insights.push({
      id: "savings-below-target",
      tone: "warning",
      priority: 3,
      title: `Tabungan ${Math.round(savingsRate)}% dari target ${savingsTarget}%`,
      body: `Dari pemasukan ${formatRupiah(monthlyIncome)}, kamu menyisihkan ${formatRupiah(Math.max(net, 0))}. Kurangi sekitar ${formatRupiah(Math.max(Math.ceil((savingsTarget - savingsRate) * monthlyIncome / 100), 0))} pada pengeluaran tidak wajib agar target tercapai.`,
      action: { label: "Atur target", tab: "settings" },
    });
  } else if (monthlyIncome > 0 && savingsRate !== null) {
    insights.push({
      id: "savings-on-track",
      tone: "good",
      priority: 7,
      title: "Tabungan bulan ini sesuai target",
      body: `Kamu menyisihkan ${Math.round(savingsRate)}% dari pemasukan (${formatRupiah(Math.max(net, 0))}). Pertahankan dan pertimbangkan menambah ke dana darurat.`,
      action: { label: "Lihat rekap", tab: "recap" },
    });
  } else if (monthlyExpense > 0) {
    insights.push({
      id: "no-income",
      tone: "info",
      priority: 6,
      title: "Belum ada pemasukan bulan ini",
      body: `Pengeluaran tercatat ${formatRupiah(monthlyExpense)}. Catat pemasukan agar rasio tabungan dan proyeksi bulanan lebih akurat.`,
      action: { label: "Catat pemasukan", tab: "transactions" },
    });
  }

  if (totalBudget > 0) {
    const projected = (monthlyExpense / Math.max(dayOfMonth, 1)) * daysInMonth;
    if (projected > totalBudget * 1.05) {
      insights.push({
        id: "budget-projection",
        tone: "warning",
        priority: 2,
        title: "Proyeksi belanja melewati budget",
        body: `Dengan pola belanja saat ini, akhir bulan diperkirakan ${formatRupiah(projected)} atau ${formatRupiah(projected - totalBudget)} di atas budget ${formatRupiah(totalBudget)}. Sisa ${daysInMonth - dayOfMonth} hari perlu dijaga.`,
        action: { label: "Buka budget", tab: "budgets" },
      });
    } else if (dayOfMonth >= 5 && totalSpent > 0) {
      insights.push({
        id: "budget-on-track",
        tone: "good",
        priority: 8,
        title: "Belanja masih di jalur budget",
        body: `Terpakai ${formatRupiah(totalSpent)} dari ${formatRupiah(totalBudget)}. Proyeksi akhir bulan ${formatRupiah(projected)}, masih dalam batas.`,
        action: { label: "Buka budget", tab: "budgets" },
      });
    }
  } else {
    insights.push({
      id: "budget-empty",
      tone: "info",
      priority: 5,
      title: "Budget bulanan belum diatur",
      body: "Tetapkan batas per kategori agar pengeluaran lebih terkendali. Kamu bisa memakai pola 50/30/20 atau rata-rata 3 bulan terakhir.",
      action: { label: "Atur budget", tab: "budgets" },
    });
  }

  if (overBudget.length > 0) {
    const first = overBudget[0];
    insights.push({
      id: "budget-over",
      tone: "danger",
      priority: 1,
      title: `${first.label} melewati budget`,
      body: `Terpakai ${formatRupiah(first.spent)} dari ${formatRupiah(first.limit)} (${first.percent}%). Kurangi pengeluaran kategori ini, atau sesuaikan budget bila memang kebutuhan tetap.`,
      action: { label: "Sesuaikan budget", tab: "budgets" },
    });
  } else if (nearLimit.length > 0) {
    const first = nearLimit[0];
    insights.push({
      id: "budget-near",
      tone: "warning",
      priority: 4,
      title: `${first.label} hampir habis`,
      body: `Sisa ${formatRupiah(Math.max(first.remaining, 0))} dari budget ${formatRupiah(first.limit)}. Prioritaskan kebutuhan sampai akhir bulan.`,
      action: { label: "Lihat budget", tab: "budgets" },
    });
  }

  const averageExpense = averageMonthlyExpense(transactions, 3, now);
  const essentialBudget = budgetCategories
    .filter((budget) =>
      ["makan", "transport", "tagihan", "kesehatan"].includes(budget.category),
    )
    .reduce((total, budget) => total + budget.limit, 0);
  const baseline = Math.max(averageExpense, essentialBudget, 1);
  const emergencyMonths = totalBalance / baseline;

  if (emergencyMonths < emergencyTarget) {
    insights.push({
      id: "emergency-low",
      tone: totalBalance <= 0 ? "danger" : "warning",
      priority: totalBalance <= 0 ? 1 : 4,
      title: `Dana darurat ${emergencyMonths.toFixed(1)} bulan`,
      body: `Target ${emergencyTarget} bulan dari biaya hidup sekitar ${formatRupiah(baseline)}/bulan. Masih perlu ${formatRupiah(Math.max((emergencyTarget - emergencyMonths) * baseline, 0))} agar lebih aman saat pemasukan terganggu.`,
      action: { label: "Atur target", tab: "settings" },
    });
  } else {
    insights.push({
      id: "emergency-safe",
      tone: "good",
      priority: 9,
      title: "Dana darurat di atas target",
      body: `Saldo ${formatRupiah(totalBalance)} setara ${emergencyMonths.toFixed(1)} bulan biaya hidup. Target kamu ${emergencyTarget} bulan.`,
      action: { label: "Lihat saldo", tab: "overview" },
    });
  }

  if (debt.overdueCount > 0) {
    insights.push({
      id: "debt-overdue",
      tone: "danger",
      priority: 0,
      title: `${debt.overdueCount} catatan lewat jatuh tempo`,
      body: `Sisa piutang ${formatRupiah(debt.receivable)} dan hutang ${formatRupiah(debt.payable)}. Selesaikan yang lewat tempo lebih dulu agar tidak menumpuk.`,
      action: { label: "Buka buku hutang", tab: "debts" },
    });
  } else if (debt.dueSoonCount > 0) {
    insights.push({
      id: "debt-due-soon",
      tone: "warning",
      priority: 2,
      title: `${debt.dueSoonCount} catatan jatuh tempo minggu ini`,
      body: `Total kewajiban berjalan ${formatRupiah(debt.payable)} dan piutang ${formatRupiah(debt.receivable)}. Siapkan dana atau ingatkan pihak terkait.`,
      action: { label: "Lihat hutang", tab: "debts" },
    });
  } else if (debt.payable > 0 && monthlyIncome > 0) {
    const ratio = (debt.payable / monthlyIncome) * 100;
    if (ratio > 30) {
      insights.push({
        id: "debt-ratio",
        tone: "warning",
        priority: 3,
        title: "Hutang cukup besar dibanding pemasukan",
        body: `Sisa hutang ${formatRupiah(debt.payable)} setara ${Math.round(ratio)}% pemasukan bulan ini. Prioritaskan pelunasan sebelum menambah cicilan baru.`,
        action: { label: "Kelola pelunasan", tab: "debts" },
      });
    }
  }

  if (debt.receivable > 0 && debt.overdueCount === 0) {
    insights.push({
      id: "receivable-open",
      tone: "info",
      priority: 6,
      title: "Ada piutang yang bisa ditagih",
      body: `Total piutang berjalan ${formatRupiah(debt.receivable)}. Catat pelunasan agar arus kas dan posisi bersih tetap akurat.`,
      action: { label: "Buka piutang", tab: "debts" },
    });
  }

  const last7 = summarize(
    transactions,
    startOfDay(addDays(now, -6)),
    endOfDay(now),
  ).expense;
  const previous7 = summarize(
    transactions,
    startOfDay(addDays(now, -13)),
    endOfDay(addDays(now, -7)),
  ).expense;

  if (
    previous7 > 0 &&
    last7 > previous7 * 1.35 &&
    last7 - previous7 > 100_000
  ) {
    insights.push({
      id: "spending-spike",
      tone: "info",
      priority: 5,
      title: "Belanja 7 hari terakhir naik",
      body: `Naik ${Math.round(((last7 - previous7) / previous7) * 100)}% dibanding minggu sebelumnya (${formatRupiah(last7)} vs ${formatRupiah(previous7)}). Cek kategori terbesar sebelum melanjutkan belanja.`,
      action: { label: "Lihat rekap", tab: "recap" },
    });
  }

  if (topCategory && topCategory.percent < 100) {
    insights.push({
      id: "top-category",
      tone: "info",
      priority: 10,
      title: `Pengeluaran terbesar: ${topCategory.label}`,
      body: `${formatRupiah(topCategory.spent)} (${topCategory.percent}% dari budget kategori) bulan ini. Kategori ini paling berpengaruh pada sisa budget.`,
      action: { label: "Lihat transaksi", tab: "transactions" },
    });
  }

  const unique = [];
  const seen = new Set();
  insights
    .sort((a, b) => {
      const toneDiff = TONE_ORDER[a.tone] - TONE_ORDER[b.tone];
      if (toneDiff !== 0) return toneDiff;
      return (a.priority ?? 99) - (b.priority ?? 99);
    })
    .forEach((insight) => {
      if (seen.has(insight.id)) return;
      seen.add(insight.id);
      unique.push(insight);
    });

  return unique.slice(0, 7);
}

export function insightSummary(insights) {
  if (!insights.length) {
    return {
      tone: "info",
      title: "Belum ada saran",
      body: "Catat beberapa transaksi agar ZhKas bisa memberi saran yang relevan.",
    };
  }
  return insights[0];
}

export function formatInsightMetric(insight) {
  return insight?.title ?? formatRupiahCompact(0);
}
