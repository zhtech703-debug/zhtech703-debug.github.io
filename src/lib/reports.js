import { categoryMeta } from "../data.js";
import {
  buildMonthlySeries,
  categoryBreakdown,
  endOfDay,
  resolvePeriod,
  startOfDay,
  startOfMonth,
  summarize,
  topMerchants,
} from "./analytics.js";
import {
  DEBT_DIRECTIONS,
  debtDueMeta,
  debtOutstanding,
  debtPaid,
  debtTotals,
} from "./debts.js";
import { formatRupiah } from "./format.js";
import { buildInsights } from "./insights.js";
import { buildDocx, buildXlsx } from "./office.js";
import { localDateStamp, officeFileName } from "./backup.js";

export const EXPORT_VARIANTS = {
  excel: [
    {
      id: "mutation",
      title: "Mutasi lengkap",
      description: "Semua transaksi + ringkasan + rekap kategori.",
    },
    {
      id: "monthly",
      title: "Rekap bulanan",
      description: "Arus kas 6 bulan, budget, hutang, dan saran.",
    },
    {
      id: "debts",
      title: "Buku hutang",
      description: "Piutang, hutang, sisa, dan riwayat pelunasan.",
    },
  ],
  pdf: [
    {
      id: "mutation",
      title: "Laporan mutasi",
      description: "File .pdf berisi transaksi periode terpilih.",
    },
    {
      id: "monthly",
      title: "Laporan bulanan",
      description: "Ringkasan, budget, hutang, dan saran.",
    },
    {
      id: "debts",
      title: "Laporan hutang",
      description: "Posisi dan riwayat pelunasan.",
    },
  ],
  word: [
    {
      id: "mutation",
      title: "Laporan mutasi",
      description: "Dokumen transaksi siap cetak atau dikirim.",
    },
    {
      id: "monthly",
      title: "Laporan bulanan",
      description: "Ringkasan, budget, hutang, dan saran keuangan.",
    },
    {
      id: "debts",
      title: "Laporan hutang",
      description: "Posisi dan riwayat pelunasan piutang/hutang.",
    },
  ],
};

export function resolveExportRange(range, transactions, now = new Date()) {
  if (range === "all") {
    const times = transactions.map((transaction) => transaction.date.getTime());
    const earliest = times.length ? new Date(Math.min(...times)) : now;
    return {
      id: "all",
      label: "Semua data",
      start: startOfDay(earliest),
      end: endOfDay(now),
    };
  }
  if (range === "month") return resolvePeriod("month", now);
  return resolvePeriod("30d", now);
}

function dateStamp(date) {
  return localDateStamp(date);
}

function dateTimeStamp(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", ".");
}

function scopeData(data, range) {
  const now = new Date();
  const resolved = resolveExportRange(range, data.transactions, now);
  const scoped = data.transactions
    .filter(
      (transaction) =>
        transaction.date >= resolved.start && transaction.date <= resolved.end,
    )
    .sort((a, b) => b.date - a.date);
  return { ...resolved, scoped, now };
}

function summaryCells(summary) {
  return [
    ["Pemasukan", summary.income, "currency"],
    ["Pengeluaran", summary.expense, "currency"],
    ["Arus kas bersih", summary.net, "currency"],
    ["Rata-rata pengeluaran / hari", Math.round(summary.averageDailyExpense), "currency"],
    ["Jumlah transaksi", summary.count, "number"],
    ["Transaksi masuk", summary.incomeCount, "number"],
    ["Transaksi keluar", summary.expenseCount, "number"],
  ];
}

function debtStatusLabel(debt) {
  if (debtOutstanding(debt) <= 0) return "Lunas";
  return debtDueMeta(debt).label;
}

function mutationSheetRows(scoped, rangeLabel, now) {
  return [
    [{ value: "Laporan Mutasi ZhKas", kind: "title" }],
    [{ value: `Periode: ${rangeLabel}`, kind: "muted" }],
    [
      {
        value: `Dibuat ${dateTimeStamp(now)} · ${scoped.length} transaksi · data lokal`,
        kind: "muted",
      },
    ],
    [],
    [
      { value: "Tanggal", kind: "header" },
      { value: "Keterangan", kind: "header" },
      { value: "Kategori", kind: "header" },
      { value: "Tipe", kind: "header" },
      { value: "Jumlah", kind: "header" },
      { value: "Rekening", kind: "header" },
      { value: "Catatan", kind: "header" },
    ],
    ...scoped.map((transaction) => [
      { value: dateStamp(transaction.date), kind: "date" },
      transaction.name,
      categoryMeta[transaction.category]?.label ?? transaction.category,
      transaction.type === "income" ? "Masuk" : "Keluar",
      { value: transaction.amount, kind: "currency" },
      transaction.account,
      { value: transaction.note ?? "", kind: "wrap" },
    ]),
  ];
}

function summarySheetRows(scoped, start, rangeLabel, now, data) {
  const summary = summarize(scoped, start, now);
  const categories = categoryBreakdown(scoped, start, now);
  const merchants = topMerchants(scoped, start, now, 5);
  const months = buildMonthlySeries(data.transactions, 6, now);

  return [
    [{ value: "Ringkasan Keuangan", kind: "title" }],
    [{ value: `Periode: ${rangeLabel}`, kind: "muted" }],
    [{ value: `Dibuat ${dateTimeStamp(now)}`, kind: "muted" }],
    [],
    [
      { value: "Metrik", kind: "header" },
      { value: "Nilai", kind: "header" },
    ],
    ...summaryCells(summary).map(([label, value, kind]) => [
      label,
      { value, kind },
    ]),
    [],
    [{ value: "Pengeluaran per kategori", kind: "section" }],
    [
      { value: "Kategori", kind: "header" },
      { value: "Jumlah", kind: "header" },
      { value: "Porsi", kind: "header" },
      { value: "Transaksi", kind: "header" },
    ],
    ...categories.map((category) => [
      category.label,
      { value: category.amount, kind: "currency" },
      { value: category.percent / 100, kind: "percent" },
      { value: category.count, kind: "number" },
    ]),
    [],
    [{ value: "Arus kas 6 bulan", kind: "section" }],
    [
      { value: "Bulan", kind: "header" },
      { value: "Pemasukan", kind: "header" },
      { value: "Pengeluaran", kind: "header" },
      { value: "Arus kas", kind: "header" },
    ],
    ...months.map((month) => [
      month.fullLabel,
      { value: month.income, kind: "currency" },
      { value: month.expense, kind: "currency" },
      { value: month.net, kind: "currency" },
    ]),
    [],
    [{ value: "Merchant terbesar", kind: "section" }],
    [
      { value: "Merchant", kind: "header" },
      { value: "Total", kind: "header" },
      { value: "Transaksi", kind: "header" },
    ],
    ...merchants.map((merchant) => [
      merchant.name,
      { value: merchant.amount, kind: "currency" },
      { value: merchant.count, kind: "number" },
    ]),
  ];
}

function budgetRows(data, now) {
  return [
    [{ value: "Budget Bulan Ini", kind: "title" }],
    [{ value: `Dibuat ${dateTimeStamp(now)}`, kind: "muted" }],
    [],
    [
      { value: "Kategori", kind: "header" },
      { value: "Budget", kind: "header" },
      { value: "Terpakai", kind: "header" },
      { value: "Sisa", kind: "header" },
      { value: "Terpakai %", kind: "header" },
    ],
    ...data.budgetCategories.map((budget) => [
      budget.label,
      { value: budget.limit, kind: "currency" },
      { value: budget.spent, kind: "currency" },
      { value: budget.remaining, kind: "currency" },
      { value: budget.percent / 100, kind: "percent" },
    ]),
    [
      { value: "Total", kind: "section" },
      { value: data.totalBudget, kind: "currency" },
      { value: data.totalSpent, kind: "currency" },
      { value: data.totalRemaining, kind: "currency" },
      {
        value: data.totalBudget > 0 ? data.totalSpent / data.totalBudget : 0,
        kind: "percent",
      },
    ],
  ];
}

function debtRows(data, now) {
  const totals = debtTotals(data.debts);
  return [
    [{ value: "Buku Hutang & Piutang", kind: "title" }],
    [{ value: `Dibuat ${dateTimeStamp(now)}`, kind: "muted" }],
    [],
    [
      { value: "Posisi", kind: "header" },
      { value: "Nilai", kind: "header" },
    ],
    ["Piutang berjalan (saya memberi)", { value: totals.receivable, kind: "currency" }],
    ["Hutang berjalan (saya menerima)", { value: totals.payable, kind: "currency" }],
    ["Posisi bersih", { value: totals.net, kind: "currency" }],
    ["Catatan berjalan", { value: totals.openCount, kind: "number" }],
    ["Catatan lunas", { value: totals.paidCount, kind: "number" }],
    [],
    [
      { value: "Arah", kind: "header" },
      { value: "Pihak", kind: "header" },
      { value: "Total", kind: "header" },
      { value: "Dibayar", kind: "header" },
      { value: "Sisa", kind: "header" },
      { value: "Jatuh tempo", kind: "header" },
      { value: "Status", kind: "header" },
    ],
    ...data.debts.map((debt) => [
      DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
      debt.counterparty,
      { value: debt.amount, kind: "currency" },
      { value: debtPaid(debt), kind: "currency" },
      { value: debtOutstanding(debt), kind: "currency" },
      debt.dueDate ? dateStamp(debt.dueDate) : "—",
      debtStatusLabel(debt),
    ]),
  ];
}

function paymentRows(data) {
  const rows = [];
  data.debts.forEach((debt) => {
    (debt.payments ?? []).forEach((payment) => {
      rows.push({ debt, payment });
    });
  });
  rows.sort((a, b) => b.payment.date - a.payment.date);

  return [
    [{ value: "Riwayat Pelunasan", kind: "title" }],
    [],
    [
      { value: "Tanggal", kind: "header" },
      { value: "Pihak", kind: "header" },
      { value: "Arah", kind: "header" },
      { value: "Jumlah", kind: "header" },
      { value: "Catatan", kind: "header" },
    ],
    ...rows.map(({ debt, payment }) => [
      { value: dateStamp(payment.date), kind: "date" },
      debt.counterparty,
      DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
      { value: payment.amount, kind: "currency" },
      { value: payment.note ?? "", kind: "wrap" },
    ]),
  ];
}

function monthlySummaryRows(data, now) {
  const months = buildMonthlySeries(data.transactions, 6, now);
  return [
    [{ value: "Rekap Bulanan", kind: "title" }],
    [{ value: `Dibuat ${dateTimeStamp(now)} · 6 bulan terakhir`, kind: "muted" }],
    [],
    [
      { value: "Bulan", kind: "header" },
      { value: "Pemasukan", kind: "header" },
      { value: "Pengeluaran", kind: "header" },
      { value: "Arus kas", kind: "header" },
      { value: "Transaksi", kind: "header" },
    ],
    ...months.map((month) => [
      month.fullLabel,
      { value: month.income, kind: "currency" },
      { value: month.expense, kind: "currency" },
      { value: month.net, kind: "currency" },
      { value: month.count, kind: "number" },
    ]),
  ];
}

function buildInsightList(data, now) {
  return buildInsights({
    transactions: data.transactions,
    budgets: data.budgets,
    budgetCategories: data.budgetCategories,
    totalBudget: data.totalBudget,
    totalSpent: data.totalSpent,
    monthlyIncome: data.monthlyIncome,
    monthlyExpense: data.monthlyExpense,
    totalBalance: data.totalBalance,
    debts: data.debts,
    settings: data.settings,
    now,
  });
}

function buildExcelMutation(data, range) {
  const { scoped, label, start, now } = scopeData(data, range);
  return {
    fileName: officeFileName("mutasi", "xlsx"),
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bytes: buildXlsx([
      {
        name: "Mutasi",
        columns: [12, 30, 18, 10, 15, 14, 34],
        rows: mutationSheetRows(scoped, label, now),
        freezeRows: 5,
      },
      {
        name: "Ringkasan",
        columns: [32, 18, 14, 12],
        rows: summarySheetRows(scoped, start, label, now, data),
      },
    ]),
    summary: `${scoped.length} transaksi · ${label}`,
  };
}

function buildExcelMonthly(data) {
  const now = new Date();
  const insights = buildInsightList(data, now);
  return {
    fileName: officeFileName("rekap-bulanan", "xlsx"),
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bytes: buildXlsx([
      {
        name: "Rekap bulanan",
        columns: [20, 16, 16, 16, 12],
        rows: monthlySummaryRows(data, now),
      },
      {
        name: "Budget",
        columns: [24, 16, 16, 16, 12],
        rows: budgetRows(data, now),
      },
      {
        name: "Hutang",
        columns: [12, 20, 14, 14, 14, 14, 16],
        rows: debtRows(data, now),
      },
      {
        name: "Saran",
        columns: [34, 80],
        rows: [
          [{ value: "Saran Keuangan", kind: "title" }],
          [{ value: `Dibuat ${dateTimeStamp(now)}`, kind: "muted" }],
          [],
          [
            { value: "Saran", kind: "header" },
            { value: "Penjelasan", kind: "header" },
          ],
          ...insights.map((insight) => [
            insight.title,
            { value: insight.body, kind: "wrap" },
          ]),
        ],
      },
    ]),
    summary: `${insights.length} saran · 6 bulan rekap`,
  };
}

function buildExcelDebts(data) {
  const now = new Date();
  return {
    fileName: officeFileName("buku-hutang", "xlsx"),
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    bytes: buildXlsx([
      {
        name: "Hutang",
        columns: [12, 20, 14, 14, 14, 14, 16],
        rows: debtRows(data, now),
      },
      {
        name: "Pelunasan",
        columns: [14, 20, 12, 14, 30],
        rows: paymentRows(data),
      },
    ]),
    summary: `${data.debts.length} catatan hutang`,
  };
}

function summaryWordTable(data, now) {
  const summary = summarize(
    data.transactions,
    startOfMonth(now),
    now,
  );
  return {
    headers: ["Metrik", "Nilai"],
    rows: summaryCells(summary).map(([label, value, kind]) => [
      label,
      kind === "currency" ? formatRupiah(value) : String(value),
    ]),
    widths: [3, 2],
    align: ["left", "right"],
  };
}

function budgetWordTable(data) {
  return {
    headers: ["Kategori", "Budget", "Terpakai", "Sisa", "%"],
    rows: data.budgetCategories.map((budget) => [
      budget.label,
      formatRupiah(budget.limit),
      formatRupiah(budget.spent),
      formatRupiah(budget.remaining),
      `${budget.percent}%`,
    ]),
    widths: [3, 2, 2, 2, 1],
    align: ["left", "right", "right", "right", "right"],
  };
}

function debtWordTable(data) {
  return {
    headers: ["Arah", "Pihak", "Total", "Sisa", "Status"],
    rows: data.debts.map((debt) => [
      DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
      debt.counterparty,
      formatRupiah(debt.amount),
      formatRupiah(debtOutstanding(debt)),
      debtStatusLabel(debt),
    ]),
    widths: [1.4, 2.2, 1.8, 1.8, 2],
    align: ["left", "left", "right", "right", "left"],
  };
}

function monthlyWordTable(data, now) {
  return {
    headers: ["Bulan", "Pemasukan", "Pengeluaran", "Arus kas"],
    rows: buildMonthlySeries(data.transactions, 6, now).map((month) => [
      month.fullLabel,
      formatRupiah(month.income),
      formatRupiah(month.expense),
      formatRupiah(month.net),
    ]),
    widths: [2, 2, 2, 2],
    align: ["left", "right", "right", "right"],
  };
}

function categoryWordTable(data, now) {
  return {
    headers: ["Kategori", "Total", "Porsi"],
    rows: categoryBreakdown(data.transactions, startOfMonth(now), now).map(
      (category) => [
        category.label,
        formatRupiah(category.amount),
        `${Math.round(category.percent)}%`,
      ],
    ),
    widths: [3, 2, 1],
    align: ["left", "right", "right"],
  };
}

function buildWordMutation(data, range) {
  const { scoped, label, start, now } = scopeData(data, range);
  const summary = summarize(scoped, start, now);

  return {
    fileName: officeFileName("mutasi", "docx"),
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: buildDocx({
      title: "Laporan Mutasi",
      subtitle: `Periode ${label}`,
      meta: [
        `Dibuat ${dateTimeStamp(now)} · ${scoped.length} transaksi`,
        "Sumber: ZhKas · data lokal di perangkat",
      ],
      blocks: [
        { type: "heading", text: "Ringkasan" },
        {
          type: "table",
          headers: ["Metrik", "Nilai"],
          rows: summaryCells(summary).map(([title, value, kind]) => [
            title,
            kind === "currency" ? formatRupiah(value) : String(value),
          ]),
          widths: [3, 2],
          align: ["left", "right"],
        },
        { type: "heading", text: "Daftar Transaksi" },
        {
          type: "table",
          headers: ["Tanggal", "Keterangan", "Kategori", "Tipe", "Jumlah", "Rekening"],
          rows: scoped.map((transaction) => [
            dateStamp(transaction.date),
            transaction.name,
            categoryMeta[transaction.category]?.label ?? transaction.category,
            transaction.type === "income" ? "Masuk" : "Keluar",
            formatRupiah(transaction.amount),
            transaction.account,
          ]),
          widths: [1.3, 3, 2, 1, 1.8, 1.4],
          align: ["left", "left", "left", "left", "right", "left"],
        },
        {
          type: "note",
          text: "Dokumen ini dibuat otomatis dari catatan lokal ZhKas. Periksa kembali sebelum digunakan untuk keperluan resmi.",
        },
      ],
    }),
    summary: `${scoped.length} transaksi · ${label}`,
  };
}

function buildWordMonthly(data) {
  const now = new Date();
  const insights = buildInsightList(data, now);
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(now);

  return {
    fileName: officeFileName("laporan-bulanan", "docx"),
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: buildDocx({
      title: "Laporan Keuangan Bulanan",
      subtitle: monthLabel,
      meta: [
        `Dibuat ${dateTimeStamp(now)} · ${data.settings.name ?? "Pengguna"} ZhKas`,
        "Sumber: ZhKas · data lokal di perangkat",
      ],
      blocks: [
        { type: "heading", text: "Ringkasan Bulan Ini" },
        { type: "table", ...summaryWordTable(data, now) },
        { type: "heading", text: "Pengeluaran per Kategori" },
        { type: "table", ...categoryWordTable(data, now) },
        { type: "heading", text: "Budget" },
        { type: "table", ...budgetWordTable(data) },
        { type: "heading", text: "Arus Kas 6 Bulan" },
        { type: "table", ...monthlyWordTable(data, now) },
        { type: "heading", text: "Hutang & Piutang" },
        { type: "paragraph", text: `Piutang berjalan ${formatRupiah(debtTotals(data.debts).receivable)}, hutang berjalan ${formatRupiah(debtTotals(data.debts).payable)}.` },
        { type: "table", ...debtWordTable(data) },
        { type: "heading", text: "Saran Keuangan" },
        { type: "bullets", items: insights.map((insight) => `${insight.title}: ${insight.body}`) },
        {
          type: "note",
          text: "Saran dihasilkan dari aturan arus kas, budget, dana darurat, dan hutang. Bukan nasihat investasi resmi.",
        },
      ],
    }),
    summary: `${insights.length} saran · ${monthLabel}`,
  };
}

function buildWordDebts(data) {
  const now = new Date();
  const totals = debtTotals(data.debts);
  const payments = [];
  data.debts.forEach((debt) => {
    (debt.payments ?? []).forEach((payment) => {
      payments.push({
        date: payment.date,
        counterparty: debt.counterparty,
        direction: DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
        amount: payment.amount,
        note: payment.note,
      });
    });
  });
  payments.sort((a, b) => b.date - a.date);

  return {
    fileName: officeFileName("laporan-hutang", "docx"),
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: buildDocx({
      title: "Buku Hutang & Piutang",
      subtitle: "Posisi dan riwayat pelunasan",
      meta: [`Dibuat ${dateTimeStamp(now)} · ${data.debts.length} catatan`],
      blocks: [
        { type: "heading", text: "Posisi Saat Ini" },
        {
          type: "table",
          headers: ["Posisi", "Nilai"],
          rows: [
            ["Piutang berjalan (saya memberi)", formatRupiah(totals.receivable)],
            ["Hutang berjalan (saya menerima)", formatRupiah(totals.payable)],
            ["Posisi bersih", formatRupiah(totals.net)],
            ["Catatan berjalan", String(totals.openCount)],
            ["Catatan lunas", String(totals.paidCount)],
          ],
          widths: [4, 2],
          align: ["left", "right"],
        },
        { type: "heading", text: "Daftar Catatan" },
        { type: "table", ...debtWordTable(data) },
        { type: "heading", text: "Riwayat Pelunasan" },
        {
          type: "table",
          headers: ["Tanggal", "Pihak", "Arah", "Jumlah", "Catatan"],
          rows: payments.map((payment) => [
            dateStamp(payment.date),
            payment.counterparty,
            payment.direction,
            formatRupiah(payment.amount),
            payment.note,
          ]),
          widths: [1.3, 2, 1.2, 1.5, 2.4],
          align: ["left", "left", "left", "right", "left"],
        },
        {
          type: "note",
          text: "Catatan hutang membantu memantau kewajiban, bukan pengganti perjanjian tertulis.",
        },
      ],
    }),
    summary: `${data.debts.length} catatan · ${payments.length} pelunasan`,
  };
}

export async function createExport({ format, variant, data, range = "month" }) {
  if (format === "pdf") return buildPdfReport({ variant, data, range });
  if (format === "excel") {
    if (variant === "monthly") return buildExcelMonthly(data);
    if (variant === "debts") return buildExcelDebts(data);
    return buildExcelMutation(data, range);
  }

  if (variant === "monthly") return buildWordMonthly(data);
  if (variant === "debts") return buildWordDebts(data);
  return buildWordMutation(data, range);
}

/**
 * Satu model laporan untuk semua format. Dipakai oleh buildPrintableReport
 * (HTML/cetak) dan buildPdfReport (file .pdf asli).
 */
function buildReportModel({ variant, data, range = "month" }) {
  const now = new Date();
  const dateTime = dateTimeStamp(now);
  const money = (value) => formatRupiah(value);
  const sections = [];
  let title = "Laporan ZhKas";
  let subtitle = "";

  if (variant === "monthly") {
    title = "Laporan Keuangan Bulanan";
    subtitle = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(now);
    const months = buildMonthlySeries(data.transactions, 6, now);
    const totals = debtTotals(data.debts);
    const insights = buildInsights({
      transactions: data.transactions,
      budgets: data.budgets,
      budgetCategories: data.budgetCategories,
      totalBudget: data.totalBudget,
      totalSpent: data.totalSpent,
      monthlyIncome: data.monthlyIncome,
      monthlyExpense: data.monthlyExpense,
      totalBalance: data.totalBalance,
      debts: data.debts,
      settings: data.settings,
      now,
    });
    sections.push(
      {
        type: "table",
        heading: "Ringkasan Bulan Ini",
        headers: ["Metrik", "Nilai"],
        rows: [
          ["Pemasukan", money(data.monthlyIncome)],
          ["Pengeluaran", money(data.monthlyExpense)],
          ["Arus kas bersih", money(data.monthlyIncome - data.monthlyExpense)],
          ["Total saldo", money(data.totalBalance)],
        ],
        widths: [3, 2],
      },
      {
        type: "table",
        heading: "Pengeluaran per Kategori",
        headers: ["Kategori", "Total", "Porsi"],
        rows: categoryBreakdown(
          data.transactions,
          startOfMonth(now),
          now,
        ).map((category) => [
          category.label,
          money(category.amount),
          `${Math.round(category.percent)}%`,
        ]),
        widths: [3, 2, 1],
      },
      {
        type: "table",
        heading: "Budget",
        headers: ["Kategori", "Budget", "Terpakai", "Sisa"],
        rows: data.budgetCategories.map((budget) => [
          budget.label,
          money(budget.limit),
          money(budget.spent),
          money(budget.remaining),
        ]),
        widths: [3, 2, 2, 2],
      },
      {
        type: "table",
        heading: "Arus Kas 6 Bulan",
        headers: ["Bulan", "Pemasukan", "Pengeluaran", "Arus kas"],
        rows: months.map((month) => [
          month.fullLabel,
          money(month.income),
          money(month.expense),
          money(month.net),
        ]),
        widths: [2, 2, 2, 2],
      },
      {
        type: "table",
        heading: "Hutang & Piutang",
        intro: `Piutang berjalan ${money(totals.receivable)}, hutang berjalan ${money(totals.payable)}.`,
        headers: ["Arah", "Pihak", "Total", "Sisa", "Status"],
        rows: data.debts.map((debt) => [
          DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
          debt.counterparty,
          money(debt.amount),
          money(debtOutstanding(debt)),
          debtStatusLabel(debt),
        ]),
        widths: [1.4, 2.2, 1.8, 1.8, 2],
      },
      {
        type: "list",
        heading: "Saran Keuangan",
        items: insights.map((insight) => ({
          title: insight.title,
          body: insight.body,
        })),
      },
    );
  } else if (variant === "debts") {
    title = "Buku Hutang & Piutang";
    subtitle = "Posisi dan riwayat pelunasan";
    const totals = debtTotals(data.debts);
    const payments = [];
    data.debts.forEach((debt) => {
      (debt.payments ?? []).forEach((payment) => {
        payments.push({
          date: payment.date,
          counterparty: debt.counterparty,
          direction: DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
          amount: payment.amount,
          note: payment.note,
        });
      });
    });
    payments.sort((a, b) => b.date - a.date);
    sections.push(
      {
        type: "table",
        heading: "Posisi Saat Ini",
        headers: ["Posisi", "Nilai"],
        rows: [
          ["Piutang berjalan (saya memberi)", money(totals.receivable)],
          ["Hutang berjalan (saya menerima)", money(totals.payable)],
          ["Posisi bersih", money(totals.net)],
          ["Catatan berjalan", String(totals.openCount)],
          ["Catatan lunas", String(totals.paidCount)],
        ],
        widths: [4, 2],
      },
      {
        type: "table",
        heading: "Daftar Catatan",
        headers: ["Arah", "Pihak", "Total", "Sisa", "Status"],
        rows: data.debts.map((debt) => [
          DEBT_DIRECTIONS[debt.direction]?.label ?? debt.direction,
          debt.counterparty,
          money(debt.amount),
          money(debtOutstanding(debt)),
          debtStatusLabel(debt),
        ]),
        widths: [1.4, 2.2, 1.8, 1.8, 2],
      },
      {
        type: "table",
        heading: "Riwayat Pelunasan",
        headers: ["Tanggal", "Pihak", "Arah", "Jumlah", "Catatan"],
        rows: payments.map((payment) => [
          localDateStamp(payment.date),
          payment.counterparty,
          payment.direction,
          money(payment.amount),
          payment.note ?? "",
        ]),
        widths: [1.3, 2, 1.2, 1.5, 2.4],
      },
    );
  } else {
    const resolved = resolveExportRange(range, data.transactions, now);
    const scoped = data.transactions
      .filter(
        (transaction) =>
          transaction.date >= resolved.start &&
          transaction.date <= resolved.end,
      )
      .sort((a, b) => b.date - a.date);
    const summary = summarize(scoped, resolved.start, now);
    title = "Laporan Mutasi";
    subtitle = `Periode ${resolved.label}`;
    sections.push(
      {
        type: "table",
        heading: "Ringkasan",
        headers: ["Metrik", "Nilai"],
        rows: [
          ["Pemasukan", money(summary.income)],
          ["Pengeluaran", money(summary.expense)],
          ["Arus kas bersih", money(summary.net)],
          [
            "Rata-rata pengeluaran / hari",
            money(Math.round(summary.averageDailyExpense)),
          ],
          ["Jumlah transaksi", String(summary.count)],
        ],
        widths: [3, 2],
      },
      {
        type: "table",
        heading: "Daftar Transaksi",
        headers: [
          "Tanggal",
          "Keterangan",
          "Kategori",
          "Tipe",
          "Jumlah",
          "Rekening",
        ],
        rows: scoped.map((transaction) => [
          localDateStamp(transaction.date),
          transaction.name,
          categoryMeta[transaction.category]?.label ?? transaction.category,
          transaction.type === "income" ? "Masuk" : "Keluar",
          money(transaction.amount),
          transaction.account,
        ]),
        widths: [1.3, 3, 2, 1, 1.8, 1.4],
      },
    );
  }

  return { title, subtitle, dateTime, sections };
}

/** HTML siap cetak (cadangan; dialog cetak browser). */
export function buildPrintableReport(args) {
  const { title, subtitle, dateTime, sections } = buildReportModel(args);
  const table = (headers, rows) => {
    const head = headers
      .map((header) => `<th>${escapeHtml(header)}</th>`)
      .join("");
    const body = rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}</tr>`,
      )
      .join("");
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  };

  const content = sections
    .map((section) => {
      const intro = section.intro
        ? `<p>${escapeHtml(section.intro)}</p>`
        : "";
      if (section.type === "table") {
        return `<h2>${escapeHtml(section.heading)}</h2>${intro}${table(section.headers, section.rows)}`;
      }
      if (section.type === "list") {
        return `<h2>${escapeHtml(section.heading)}</h2><ul>${section.items
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.body)}</li>`,
          )
          .join("")}</ul>`;
      }
      return `<h2>${escapeHtml(section.heading)}</h2>${intro}<p>${escapeHtml(section.text ?? "")}</p>`;
    })
    .join("");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: "Segoe UI", Calibri, sans-serif; color: #1f2937; margin: 24px; }
  h1 { font-size: 22px; color: #0b2a4a; margin: 0 0 4px; border-bottom: 2px solid #d9a84e; padding-bottom: 6px; }
  h2 { font-size: 15px; color: #0b2a4a; margin: 18px 0 8px; }
  .meta { font-size: 11px; color: #6b7280; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; }
  th, td { border: 1px solid #d9e2ec; padding: 6px 8px; }
  th { background: #0b2a4a; color: #fff; text-align: left; }
  tr:nth-child(even) td { background: #f7fafc; }
  ul { font-size: 11px; line-height: 1.6; }
  .footer { margin-top: 24px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  @media print { body { margin: 12px; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="meta">${escapeHtml(subtitle)}</p>` : ""}
  <p class="meta">Dibuat ${escapeHtml(dateTime)} · ZhKas · data lokal di perangkat</p>
  ${content}
  <p class="footer">Dibuat dengan ZhKas · ZhStoreLsw Corp. · data diproses lokal di perangkat.</p>
</body>
</html>`;
}

/** File PDF asli (bukan dialog cetak), dibuat sepenuhnya di perangkat. */
export async function buildPdfReport(args) {
  const { jsPDF } = await import("jspdf");
  const { title, subtitle, dateTime, sections } = buildReportModel(args);
  const variant = args.variant;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const ink = [11, 42, 74];
  const muted = [107, 114, 128];
  const line = [217, 226, 236];
  const fontSize = 8;
  const lineHeight = 3.6;
  let y = margin;

  function ensureSpace(height) {
    if (y + height > pageHeight - margin - 6) {
      doc.addPage();
      y = margin;
    }
  }

  function wrapText(value, maxWidth) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    const words = String(value ?? "").split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (doc.getTextWidth(candidate) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  function writeParagraph(text, x, maxWidth, style = "normal", color = ink) {
    const lines = wrapText(text, maxWidth);
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    lines.forEach((value) => {
      ensureSpace(lineHeight);
      doc.text(value, x, y);
      y += lineHeight;
    });
  }

  function drawTable(section) {
    const weights = section.widths ?? section.headers.map(() => 1);
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    const columns = weights.map((value) => (contentWidth * value) / totalWeight);
    const padding = 1.6;

    const drawHeader = () => {
      ensureSpace(7);
      const top = y;
      doc.setFillColor(...ink);
      doc.rect(margin, top, contentWidth, 6, "F");
      let x = margin;
      section.headers.forEach((header, index) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(255, 255, 255);
        const value = wrapText(header, columns[index] - padding * 2)[0] ?? "";
        doc.text(value, x + padding, top + 4);
        x += columns[index];
      });
      y = top + 6;
    };

    drawHeader();
    section.rows.forEach((row, rowIndex) => {
      const cells = row.map((cell, index) =>
        wrapText(cell, columns[index] - padding * 2),
      );
      const height =
        Math.max(...cells.map((lines) => lines.length)) * lineHeight + 1.6;
      ensureSpace(height);
      const top = y;
      if (rowIndex % 2 === 0) {
        doc.setFillColor(247, 250, 252);
        doc.rect(margin, top, contentWidth, height, "F");
      }
      let x = margin;
      cells.forEach((lines, index) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(31, 41, 55);
        lines.forEach((value, lineIndex) => {
          doc.text(value, x + padding, top + 2.8 + lineIndex * lineHeight);
        });
        x += columns[index];
      });
      doc.setDrawColor(...line);
      doc.setLineWidth(0.15);
      x = margin;
      columns.forEach((width) => {
        doc.line(x, top, x, top + height);
        x += width;
      });
      doc.line(margin, top + height, margin + contentWidth, top + height);
      y = top + height;
    });
    y += 3;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...ink);
  doc.text(title, margin, y);
  y += 6;
  doc.setDrawColor(217, 168, 78);
  doc.setLineWidth(0.8);
  doc.line(margin, y - 2.5, margin + 28, y - 2.5);
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(subtitle, margin, y + 2);
    y += 6;
  }
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text(
    `Dibuat ${dateTime} · ZhKas · data lokal di perangkat`,
    margin,
    y + 2,
  );
  y += 9;

  sections.forEach((section) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    doc.text(section.heading, margin, y);
    y += 6;
    if (section.intro) {
      writeParagraph(section.intro, margin, contentWidth, "normal", muted);
      y += 1;
    }
    if (section.type === "table") {
      drawTable(section);
    } else if (section.type === "list") {
      section.items.forEach((item, index) => {
        writeParagraph(
          `${index + 1}. ${item.title}: ${item.body}`,
          margin + 2,
          contentWidth - 2,
        );
        y += 0.6;
      });
      y += 2;
    } else {
      writeParagraph(section.text ?? "", margin, contentWidth);
      y += 2;
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      "ZhKas · ZhStoreLsw Corp. · data diproses lokal di perangkat",
      margin,
      pageHeight - 7,
    );
    doc.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 7, {
      align: "right",
    });
  }

  const prefix =
    variant === "monthly"
      ? "laporan-bulanan"
      : variant === "debts"
        ? "laporan-hutang"
        : "laporan-mutasi";
  return {
    fileName: officeFileName(prefix, "pdf"),
    mime: "application/pdf",
    bytes: new Uint8Array(doc.output("arraybuffer")),
    summary: `${sections.length} bagian laporan · ${dateTime}`,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
