/**
 * Utilitas buku hutang/piutang. `receivable` berarti kita memberi pinjaman
 * (orang lain berutang ke kita), `payable` berarti kita menerima pinjaman.
 */

export const DEBT_DIRECTIONS = {
  receivable: {
    label: "Piutang",
    helper: "Saya memberi pinjaman",
    short: "Memberi",
    accent: "#67E4B8",
    soft: "rgba(103, 228, 184, 0.11)",
  },
  payable: {
    label: "Hutang",
    helper: "Saya menerima pinjaman",
    short: "Menerima",
    accent: "#FFCE8F",
    soft: "rgba(255, 206, 143, 0.11)",
  },
};

export function debtPaid(debt) {
  return (debt.payments ?? []).reduce(
    (total, payment) => total + payment.amount,
    0,
  );
}

export function debtOutstanding(debt) {
  return Math.max(debt.amount - debtPaid(debt), 0);
}

export function debtIsPaid(debt) {
  return debtOutstanding(debt) <= 0;
}

export function debtTotals(debts) {
  let receivable = 0;
  let payable = 0;
  let receivableCount = 0;
  let payableCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  const now = new Date();

  debts.forEach((debt) => {
    const outstanding = debtOutstanding(debt);
    if (outstanding <= 0) {
      paidCount += 1;
      return;
    }

    if (debt.direction === "receivable") {
      receivable += outstanding;
      receivableCount += 1;
    } else {
      payable += outstanding;
      payableCount += 1;
    }

    const due = debtDueMeta(debt, now);
    if (due.tone === "danger") overdueCount += 1;
    if (due.tone === "warning") dueSoonCount += 1;
  });

  return {
    receivable,
    payable,
    net: receivable - payable,
    receivableCount,
    payableCount,
    paidCount,
    overdueCount,
    dueSoonCount,
    openCount: receivableCount + payableCount,
  };
}

/**
 * Status jatuh tempo untuk badge dan saran.
 * `days` negatif berarti sudah lewat.
 */
export function debtDueMeta(debt, now = new Date()) {
  if (!debt.dueDate) {
    return { label: "Tanpa jatuh tempo", tone: "neutral", days: null };
  }

  if (debtIsPaid(debt)) {
    return { label: "Lunas", tone: "success", days: null };
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(debt.dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86_400_000);

  if (days < 0) {
    return {
      label: `Lewat ${Math.abs(days)} hari`,
      tone: "danger",
      days,
    };
  }
  if (days === 0) {
    return { label: "Jatuh tempo hari ini", tone: "warning", days };
  }
  if (days <= 7) {
    return {
      label: `${days} hari lagi`,
      tone: "warning",
      days,
    };
  }

  return {
    label: new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(debt.dueDate),
    tone: "neutral",
    days,
  };
}

export function sortDebts(debts) {
  return [...debts].sort((a, b) => {
    const paidA = debtIsPaid(a);
    const paidB = debtIsPaid(b);
    if (paidA !== paidB) return paidA ? 1 : -1;
    const dueA = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
    const dueB = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;
    return b.date - a.date;
  });
}
