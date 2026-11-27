import { categoryMeta } from "../data.js";

/**
 * Perhitungan rekap dan grafik. Semua fungsi murni: menerima daftar transaksi
 * dan mengembalikan angka siap tampil. Tidak ada network call.
 */

const MS_DAY = 86_400_000;

const dayLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
});

const monthFullFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date, amount) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfMonth(date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1, 0);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function inRange(date, start, end) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function daysInRange(start, end) {
  return Math.max(
    Math.round((startOfDay(end) - startOfDay(start)) / MS_DAY) + 1,
    1,
  );
}

/** Rentang tanggal untuk tab rekap. */
export function resolvePeriod(period, now = new Date()) {
  if (period === "7d") {
    return {
      id: period,
      label: "7 hari",
      start: startOfDay(addDays(now, -6)),
      end: endOfDay(now),
      days: 7,
    };
  }
  if (period === "month") {
    return {
      id: period,
      label: "Bulan ini",
      start: startOfMonth(now),
      end: endOfDay(now),
      days: daysInRange(startOfMonth(now), now),
    };
  }
  if (period === "6m") {
    return {
      id: period,
      label: "6 bulan",
      start: startOfMonth(addMonths(now, -5)),
      end: endOfDay(now),
      days: daysInRange(startOfMonth(addMonths(now, -5)), now),
    };
  }
  return {
    id: "30d",
    label: "30 hari",
    start: startOfDay(addDays(now, -29)),
    end: endOfDay(now),
    days: 30,
  };
}

export function previousPeriod(period, now = new Date()) {
  if (period === "month") {
    const previousMonth = addMonths(now, -1);
    return {
      start: startOfMonth(previousMonth),
      end: endOfMonth(previousMonth),
      days: daysInRange(startOfMonth(previousMonth), endOfMonth(previousMonth)),
    };
  }
  if (period === "6m") {
    const end = endOfMonth(addMonths(now, -1));
    const start = startOfMonth(addMonths(now, -6));
    return { start, end, days: daysInRange(start, end) };
  }
  const days = period === "7d" ? 7 : 30;
  const end = endOfDay(addDays(now, -days));
  const start = startOfDay(addDays(end, -(days - 1)));
  return { start, end, days };
}

export function summarize(items, start, end) {
  const scoped = items.filter((item) => inRange(item.date, start, end));
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  scoped.forEach((item) => {
    if (item.type === "income") {
      income += item.amount;
      incomeCount += 1;
    } else {
      expense += item.amount;
      expenseCount += 1;
    }
  });

  const days = daysInRange(start, end);

  return {
    items: scoped,
    income,
    expense,
    net: income - expense,
    count: scoped.length,
    incomeCount,
    expenseCount,
    days,
    averageDailyExpense: expense / days,
    averageDailyNet: (income - expense) / days,
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : null,
  };
}

export function buildDailySeries(items, days = 30, end = new Date()) {
  const lastDay = startOfDay(end);
  const firstDay = startOfDay(addDays(lastDay, -(days - 1)));
  const buckets = new Map();

  for (let index = 0; index < days; index += 1) {
    const date = addDays(firstDay, index);
    buckets.set(dayKey(date), {
      date,
      label: dayLabelFormatter.format(date),
      income: 0,
      expense: 0,
      net: 0,
      cumulative: 0,
      count: 0,
    });
  }

  items.forEach((item) => {
    if (item.date < firstDay || item.date > endOfDay(end)) return;
    const bucket = buckets.get(dayKey(item.date));
    if (!bucket) return;

    if (item.type === "income") bucket.income += item.amount;
    else bucket.expense += item.amount;
    bucket.net += item.type === "income" ? item.amount : -item.amount;
    bucket.count += 1;
  });

  let cumulative = 0;
  return [...buckets.values()].map((bucket) => {
    cumulative += bucket.net;
    return { ...bucket, cumulative };
  });
}

export function buildMonthlySeries(items, months = 6, end = new Date()) {
  const buckets = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const monthDate = addMonths(end, -index);
    const start = startOfMonth(monthDate);
    const finish = endOfMonth(monthDate);
    buckets.push({
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      date: monthDate,
      label: monthLabelFormatter.format(monthDate),
      fullLabel: monthFullFormatter.format(monthDate),
      start,
      end: finish,
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
    });
  }

  const first = buckets[0]?.start;
  const last = buckets[buckets.length - 1]?.end;

  items.forEach((item) => {
    if (!first || !last) return;
    if (item.date < first || item.date > last) return;
    const bucket = buckets.find(
      (entry) => item.date >= entry.start && item.date <= entry.end,
    );
    if (!bucket) return;

    if (item.type === "income") bucket.income += item.amount;
    else bucket.expense += item.amount;
    bucket.net += item.type === "income" ? item.amount : -item.amount;
    bucket.count += 1;
  });

  return buckets;
}

export function categoryBreakdown(items, start, end, type = "expense") {
  const totals = new Map();

  items.forEach((item) => {
    if (item.type !== type) return;
    if (!inRange(item.date, start, end)) return;
    const current = totals.get(item.category) ?? { amount: 0, count: 0 };
    current.amount += item.amount;
    current.count += 1;
    totals.set(item.category, current);
  });

  const total = [...totals.values()].reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  return [...totals.entries()]
    .map(([category, entry]) => {
      const meta = categoryMeta[category] ?? categoryMeta.belanja;
      return {
        category,
        label: meta.label,
        accent: meta.accent,
        soft: meta.soft,
        bar: meta.bar,
        amount: entry.amount,
        count: entry.count,
        percent: total > 0 ? (entry.amount / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function topMerchants(items, start, end, limit = 5) {
  const totals = new Map();

  items.forEach((item) => {
    if (item.type !== "expense") return;
    if (!inRange(item.date, start, end)) return;
    const key = item.name.trim().toLowerCase();
    const current = totals.get(key) ?? {
      name: item.name.trim(),
      amount: 0,
      count: 0,
    };
    current.amount += item.amount;
    current.count += 1;
    totals.set(key, current);
  });

  return [...totals.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function averageMonthlyExpense(items, months = 3, end = new Date()) {
  const totals = [];

  for (let index = 0; index < months; index += 1) {
    const monthDate = addMonths(end, -index);
    const summary = summarize(items, startOfMonth(monthDate), endOfMonth(monthDate));
    totals.push(summary.expense);
  }

  return totals.reduce((sum, value) => sum + value, 0) / months;
}
