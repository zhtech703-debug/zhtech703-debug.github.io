import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  bankAccounts as seedAccounts,
  budgetCategoryKeys,
  budgetLimits,
  cardThemes,
  categoryMeta,
  getDateKey,
  accentPalettes,
  seedDebts,
  seedSettings,
  transactions as seedTransactions,
} from "../data";
import { normalizeAccount, normalizeBackup } from "./backup.js";
import {
  buildMonthlySeries,
  categoryBreakdown,
  summarize,
} from "./analytics.js";
import { debtOutstanding, debtPaid, debtTotals } from "./debts.js";
import { transactionKey } from "./transactionKey.js";

/**
 * ZhKas keeps every bit of data on this device. There is no server, no bank
 * connection, no credential storage, and no network request in this store.
 * The only persistence layer is the browser's localStorage.
 */
const STORAGE_KEY = "zhkas.state.v2";
const LEGACY_STORAGE_KEY = "zhkas.state.v1";
const STATE_VERSION = 2;

/**
 * Rilis produksi (termasuk APK/PWA yang dipublikasikan) SELALU mulai kosong.
 * Data contoh hanya dipakai saat `npm run dev` agar uji tampilan tetap mudah.
 * `import.meta.env.DEV` dipakai langsung di cabang-cabang di bawah supaya
 * bundler membuang seluruh kode/string demo dari build produksi.
 */

const emptyBudgets = Object.fromEntries(
  budgetCategoryKeys.map((category) => [category, 0]),
);

const cleanSettings = {
  name: "Pengguna",
  incomeTarget: 0,
  savingsTargetPercent: 20,
  emergencyFundMonths: 3,
  theme: "dark",
  accent: "glacier",
  cloud: { clientId: "", email: "", lastSyncAt: null },
};

const baseBudgets = import.meta.env.DEV ? budgetLimits : emptyBudgets;
const baseSettings = import.meta.env.DEV ? seedSettings : cleanSettings;

const FinanceContext = createContext(null);

function cloneDebt(debt) {
  return {
    ...debt,
    date: new Date(debt.date),
    dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
    createdAt: new Date(debt.createdAt ?? debt.date),
    payments: (debt.payments ?? []).map((payment) => ({
      ...payment,
      date: new Date(payment.date),
    })),
  };
}

function createSeedState() {
  const accounts = seedAccounts.map((account) => ({ ...account }));
  return {
    accounts,
    budgets: { ...budgetLimits },
    transactions: seedTransactions.map((transaction) =>
      tagTransactionAccount({ ...transaction, source: "demo" }, accounts),
    ),
    debts: seedDebts.map(cloneDebt),
    settings: {
      ...seedSettings,
      cloud: { ...seedSettings.cloud },
    },
  };
}

/** Kondisi awal rilis produksi: benar-benar kosong, tanpa data contoh. */
function createEmptyState() {
  return {
    accounts: [],
    budgets: { ...emptyBudgets },
    transactions: [],
    debts: [],
    settings: {
      ...cleanSettings,
      cloud: { ...cleanSettings.cloud },
    },
  };
}

function createInitialState() {
  return import.meta.env.DEV ? createSeedState() : createEmptyState();
}

function serialize(state) {
  return {
    version: STATE_VERSION,
    accounts: state.accounts,
    budgets: state.budgets,
    transactions: state.transactions.map((transaction) => ({
      ...transaction,
      date: transaction.date.toISOString(),
    })),
    debts: state.debts.map((debt) => ({
      ...debt,
      date: debt.date.toISOString(),
      dueDate: debt.dueDate ? debt.dueDate.toISOString() : null,
      createdAt: debt.createdAt ? debt.createdAt.toISOString() : null,
      payments: (debt.payments ?? []).map((payment) => ({
        ...payment,
        date: payment.date.toISOString(),
      })),
    })),
    settings: state.settings,
  };
}

function reviveDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function normalizeBudgets(raw) {
  const next = { ...baseBudgets };
  budgetCategoryKeys.forEach((category) => {
    const value = Number(raw?.[category]);
    if (Number.isFinite(value) && value >= 0) next[category] = Math.round(value);
  });
  return next;
}

function normalizeSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const cloud =
    source.cloud && typeof source.cloud === "object" ? source.cloud : {};

  return {
    ...baseSettings,
    name:
      String(source.name ?? baseSettings.name).trim().slice(0, 40) ||
      baseSettings.name,
    incomeTarget: Math.max(
      Math.round(Number(source.incomeTarget) || 0),
      0,
    ),
    savingsTargetPercent: Math.round(
      clamp(source.savingsTargetPercent, 0, 100, 20),
    ),
    emergencyFundMonths: Math.round(
      clamp(source.emergencyFundMonths, 0, 24, 3),
    ),
    theme: source.theme === "light" ? "light" : "dark",
    accent:
      accentPalettes && accentPalettes[source.accent]
        ? source.accent
        : "glacier",
    cloud: {
      clientId: String(cloud.clientId ?? "").trim().slice(0, 200),
      email: String(cloud.email ?? "").trim().slice(0, 120),
      lastSyncAt: reviveDate(cloud.lastSyncAt)
        ? new Date(cloud.lastSyncAt).toISOString()
        : null,
    },
  };
}

function reviveDebt(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const counterparty = String(raw.counterparty ?? "").trim();
  const amount = Math.round(Number(raw.amount));
  if (!counterparty || !Number.isFinite(amount) || amount <= 0) return null;

  const direction = raw.direction === "payable" ? "payable" : "receivable";
  const date = reviveDate(raw.date) ?? new Date();
  const dueDate = raw.dueDate ? reviveDate(raw.dueDate) : null;

  const payments = (Array.isArray(raw.payments) ? raw.payments : [])
    .map((payment, paymentIndex) => {
      const paymentAmount = Math.round(Number(payment?.amount));
      const paymentDate = reviveDate(payment?.date);
      if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0 ||
        !paymentDate
      ) {
        return null;
      }
      return {
        id: String(
          payment?.id ?? `DBT-PAY-R${index}-${paymentIndex}`,
        ),
        amount: paymentAmount,
        date: paymentDate,
        note: String(payment?.note ?? "Pelunasan"),
      };
    })
    .filter(Boolean);

  return {
    id: String(raw.id ?? `DBT-R${index}`),
    direction,
    counterparty,
    amount,
    date,
    dueDate,
    note: String(raw.note ?? "").slice(0, 200),
    payments,
    createdAt: reviveDate(raw.createdAt) ?? date,
  };
}

function revive(raw) {
  if (
    !raw ||
    !Array.isArray(raw.accounts) ||
    !Array.isArray(raw.transactions)
  ) {
    return null;
  }

  const isV2 = raw.version === STATE_VERSION;
  const seenAccountIds = new Set();
  const accounts = raw.accounts
    .map((account, index) => normalizeAccount(account, index))
    .filter(Boolean)
    .map((account) => {
      if (seenAccountIds.has(account.id)) {
        return { ...account, id: makeAccountId() };
      }
      seenAccountIds.add(account.id);
      return account;
    });

  return {
    accounts,
    budgets: normalizeBudgets(raw.budgets),
    transactions: raw.transactions
      .map((transaction) => ({
        ...transaction,
        date: new Date(transaction.date),
      }))
      .filter((transaction) => !Number.isNaN(transaction.date.getTime()))
      .map((transaction) => tagTransactionAccount(transaction, accounts)),
    // Data versi lama tidak diberi hutang contoh agar catatan pengguna tetap bersih.
    debts: isV2
      ? (Array.isArray(raw.debts) ? raw.debts : [])
          .map(reviveDebt)
          .filter(Boolean)
      : [],
    settings: normalizeSettings(isV2 ? raw.settings : undefined),
  };
}

function loadState() {
  try {
    // Data versi lama mungkin berisi contoh/demo — buang saat first launch.
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createInitialState();

    const restored = revive(JSON.parse(stored));
    return restored ?? createInitialState();
  } catch (error) {
    console.warn("ZhKas: data lokal tidak bisa dibaca, memakai data kosong.", error);
    return createInitialState();
  }
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function matchesAccount(bankName, accountName) {
  return (
    String(bankName ?? "").trim().toLowerCase() ===
    String(accountName ?? "").trim().toLowerCase()
  );
}

/** Transaksi baru memakai id kartu; transaksi lama tetap cocok lewat nama bank. */
function transactionUsesAccount(transaction, account) {
  if (transaction?.accountId && account?.id) {
    return transaction.accountId === account.id;
  }
  return matchesAccount(transaction?.account, account?.bank);
}

function tagTransactionAccount(transaction, accounts) {
  if (!transaction) return transaction;
  const match =
    accounts.find(
      (account) =>
        transaction.accountId && transaction.accountId === account.id,
    ) ??
    accounts.find((account) =>
      matchesAccount(transaction.account, account.bank),
    );
  if (!match) return transaction;
  return {
    ...transaction,
    account: match.bank,
    accountId: match.id,
  };
}

function makeAccountId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ACC-${crypto.randomUUID()}`;
  }
  return `ACC-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

function uniqueAccountBank(bank, accounts, exceptId = null) {
  const base = String(bank ?? "").trim().slice(0, 40) || "Rekening baru";
  let candidate = base;
  let suffix = 2;
  while (
    accounts.some(
      (account) =>
        account.id !== exceptId && matchesAccount(account.bank, candidate),
    )
  ) {
    candidate = `${base} ${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function createFallbackAccount(balance = 0) {
  const theme = cardThemes.slate;
  return {
    id: makeAccountId(),
    bank: "Tanpa kartu",
    theme: "slate",
    kind: "Dompet cadangan",
    cardType: "Dompet digital",
    balance: Number.isFinite(Number(balance)) ? Math.round(Number(balance)) : 0,
    cardNumber: "••••  ••••  ••••  ••••",
    holder: "PEMILIK",
    expiry: "--/--",
    network: "GPN",
    background: theme.background,
    glow: theme.glow,
    accent: theme.accent,
  };
}

function createTransaction(input, suffix = "") {
  const date =
    input.date instanceof Date && !Number.isNaN(input.date.getTime())
      ? input.date
      : new Date();
  const isIncome = input.category === "pemasukan";
  const amount = Math.max(Math.round(Number(input.amount) || 0), 0);

  if (!input.name?.trim() || amount <= 0) return null;

  return {
    id: `ZHK-M${Date.now().toString(36).toUpperCase()}${suffix ? `-${suffix}` : ""}`,
    name: input.name.trim(),
    category: input.category,
    amount,
    type: isIncome ? "income" : "expense",
    date,
    account: input.account,
    note:
      input.note?.trim() ||
      (isIncome ? "Pemasukan dicatat manual" : "Pengeluaran dicatat manual"),
    status: "Berhasil",
    source: "manual",
  };
}

function applyTransactions(previous, list) {
  const tagged = list.map((transaction) =>
    tagTransactionAccount(transaction, previous.accounts),
  );
  const deltas = new Map();

  tagged.forEach((transaction) => {
    const account = previous.accounts.find((item) =>
      transactionUsesAccount(transaction, item),
    );
    const key = account
      ? `id:${account.id}`
      : `name:${String(transaction.account ?? "").toLowerCase()}`;
    const delta =
      transaction.type === "income" ? transaction.amount : -transaction.amount;
    deltas.set(key, (deltas.get(key) ?? 0) + delta);
  });

  const accounts = previous.accounts.map((account) => {
    const delta =
      (deltas.get(`id:${account.id}`) ?? 0) +
      (deltas.get(`name:${account.bank.toLowerCase()}`) ?? 0);
    return delta ? { ...account, balance: account.balance + delta } : account;
  });

  return {
    ...previous,
    accounts,
    transactions: [...tagged, ...previous.transactions].sort(
      (a, b) => b.date - a.date,
    ),
  };
}

function createDebt(input) {
  const counterparty = String(input.counterparty ?? "").trim();
  const amount = Math.round(Number(input.amount) || 0);
  if (!counterparty || amount <= 0) return null;

  const direction = input.direction === "payable" ? "payable" : "receivable";
  const date =
    input.date instanceof Date && !Number.isNaN(input.date.getTime())
      ? input.date
      : new Date();
  const dueDate =
    input.dueDate instanceof Date && !Number.isNaN(input.dueDate.getTime())
      ? input.dueDate
      : null;

  return {
    id: `DBT-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`,
    direction,
    counterparty,
    amount,
    date,
    dueDate,
    note: String(input.note ?? "").trim().slice(0, 200),
    payments: [],
    createdAt: new Date(),
  };
}

function applyDebtCash(
  previous,
  { debt, amount, type, account, label, note, paymentId, date },
) {
  if (!account) return previous;

  const transaction = createTransaction(
    {
      name: label,
      amount,
      category: "hutang",
      account,
      note: note || "Dicatat otomatis dari buku hutang",
      date: date instanceof Date ? date : new Date(),
    },
    `D${Date.now().toString(36).toUpperCase()}`,
  );

  if (!transaction) return previous;

  const linked = {
    ...transaction,
    type,
    source: "debt",
    debtId: debt.id,
  };
  if (paymentId) linked.debtPaymentId = paymentId;

  return applyTransactions(previous, [linked]);
}

export function FinanceProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(state)));
    } catch (error) {
      console.warn("ZhKas: penyimpanan lokal tidak tersedia.", error);
    }
  }, [state]);

  const addTransaction = useCallback((input) => {
    const transaction = createTransaction(input);
    if (!transaction) return null;

    setState((previous) => applyTransactions(previous, [transaction]));
    return transaction;
  }, []);

  const importTransactions = useCallback(
    (inputs) => {
      const existing = new Set(state.transactions.map(transactionKey));
      const accepted = [];
      let duplicates = 0;
      let invalid = 0;

      inputs.forEach((input, index) => {
        const transaction = createTransaction(input, index + 1);

        if (!transaction) {
          invalid += 1;
          return;
        }

        const key = transactionKey(transaction);
        if (existing.has(key)) {
          duplicates += 1;
          return;
        }

        existing.add(key);
        accepted.push(transaction);
      });

      if (accepted.length > 0) {
        setState((previous) => applyTransactions(previous, accepted));
      }

      return { imported: accepted.length, duplicates, invalid };
    },
    [state.transactions],
  );

  const deleteTransaction = useCallback((id) => {
    setState((previous) => {
      const transaction = previous.transactions.find((item) => item.id === id);
      if (!transaction) return previous;

      const delta = transaction.type === "income" ? -transaction.amount : transaction.amount;
      const accounts = previous.accounts.map((account) =>
        transactionUsesAccount(transaction, account)
          ? { ...account, balance: account.balance + delta }
          : account,
      );

      return {
        ...previous,
        accounts,
        transactions: previous.transactions.filter((item) => item.id !== id),
      };
    });
  }, []);

  const addDebt = useCallback((input) => {
    const debt = createDebt(input);
    if (!debt) return null;

    setState((previous) => {
      let next = { ...previous, debts: [debt, ...previous.debts] };

      if (input.recordCash && input.account) {
        const isReceivable = debt.direction === "receivable";
        next = applyDebtCash(next, {
          debt,
          amount: debt.amount,
          type: isReceivable ? "expense" : "income",
          account: input.account,
          label: isReceivable
            ? `Piutang ke ${debt.counterparty}`
            : `Pinjaman dari ${debt.counterparty}`,
          note:
            debt.note ||
            (isReceivable
              ? "Uang keluar untuk piutang"
              : "Uang masuk dari pinjaman"),
          date: debt.date,
        });
      }

      return next;
    });

    return debt;
  }, []);

  const addDebtPayment = useCallback(
    (id, input) => {
      const debt = state.debts.find((item) => item.id === id);
      if (!debt) return { error: "Catatan hutang tidak ditemukan." };

      const outstanding = debtOutstanding(debt);
      if (outstanding <= 0) return { error: "Catatan ini sudah lunas." };

      const amount = Math.min(
        Math.max(Math.round(Number(input.amount) || 0), 0),
        outstanding,
      );
      if (amount <= 0) {
        return { error: "Nominal pelunasan harus lebih dari Rp0." };
      }

      const date =
        input.date instanceof Date && !Number.isNaN(input.date.getTime())
          ? input.date
          : new Date();
      const payment = {
        id: `DBT-PAY-${Date.now().toString(36).toUpperCase()}`,
        amount,
        date,
        note: String(input.note ?? "").trim().slice(0, 120) || "Pelunasan",
      };

      setState((previous) => {
        let next = {
          ...previous,
          debts: previous.debts.map((item) =>
            item.id === id
              ? { ...item, payments: [...(item.payments ?? []), payment] }
              : item,
          ),
        };

        if (input.recordCash && input.account) {
          const isReceivable = debt.direction === "receivable";
          next = applyDebtCash(next, {
            debt,
            amount,
            type: isReceivable ? "income" : "expense",
            account: input.account,
            label: isReceivable
              ? `Pelunasan piutang ${debt.counterparty}`
              : `Pembayaran hutang ${debt.counterparty}`,
            note: payment.note,
            paymentId: payment.id,
            date: payment.date,
          });
        }

        return next;
      });

      return { payment, remaining: outstanding - amount };
    },
    [state.debts],
  );

  const updateDebt = useCallback((id, patch) => {
    setState((previous) => ({
      ...previous,
      debts: previous.debts.map((debt) => {
        if (debt.id !== id) return debt;
        const next = { ...debt };
        if (patch.counterparty !== undefined) {
          const counterparty = String(patch.counterparty).trim();
          if (counterparty) next.counterparty = counterparty.slice(0, 60);
        }
        if (patch.note !== undefined) {
          next.note = String(patch.note).trim().slice(0, 200);
        }
        if (patch.dueDate !== undefined) {
          next.dueDate =
            patch.dueDate instanceof Date &&
            !Number.isNaN(patch.dueDate.getTime())
              ? patch.dueDate
              : null;
        }
        return next;
      }),
    }));
  }, []);

  const deleteDebt = useCallback((id) => {
    setState((previous) => {
      const debt = previous.debts.find((item) => item.id === id);
      if (!debt) return previous;

      const linked = previous.transactions.filter(
        (transaction) => transaction.debtId === id,
      );
      const deltas = new Map();

      linked.forEach((transaction) => {
        const account = previous.accounts.find((item) =>
          transactionUsesAccount(transaction, item),
        );
        const key = account
          ? `id:${account.id}`
          : `name:${String(transaction.account ?? "").toLowerCase()}`;
        const delta =
          transaction.type === "income"
            ? -transaction.amount
            : transaction.amount;
        deltas.set(key, (deltas.get(key) ?? 0) + delta);
      });

      const accounts = previous.accounts.map((account) => {
        const delta =
          (deltas.get(`id:${account.id}`) ?? 0) +
          (deltas.get(`name:${account.bank.toLowerCase()}`) ?? 0);
        return delta ? { ...account, balance: account.balance + delta } : account;
      });

      return {
        ...previous,
        accounts,
        transactions: previous.transactions.filter(
          (transaction) => transaction.debtId !== id,
        ),
        debts: previous.debts.filter((item) => item.id !== id),
      };
    });
  }, []);

  const addAccount = useCallback((input) => {
    const draft = normalizeAccount(
      { ...input, id: makeAccountId(), bank: uniqueAccountBank(input?.bank, []) },
      0,
    );
    if (!draft) return null;

    setState((previous) => {
      const account = {
        ...draft,
        id: makeAccountId(),
        bank: uniqueAccountBank(input?.bank, previous.accounts),
      };
      return { ...previous, accounts: [...previous.accounts, account] };
    });
    return draft.bank;
  }, []);

  const updateAccount = useCallback((id, patch) => {
    setState((previous) => {
      const existing = previous.accounts.find((account) => account.id === id);
      if (!existing) return previous;

      const merged = { ...existing, ...patch };
      const updated = normalizeAccount(
        { ...merged, id: existing.id, bank: uniqueAccountBank(merged.bank, previous.accounts, id) },
        0,
      );
      if (!updated) return previous;

      const renamed = updated.bank !== existing.bank;
      return {
        ...previous,
        accounts: previous.accounts.map((account) =>
          account.id === id ? updated : account,
        ),
        transactions: renamed
          ? previous.transactions.map((transaction) =>
              transactionUsesAccount(transaction, existing)
                ? { ...transaction, account: updated.bank, accountId: updated.id }
                : transaction,
            )
          : previous.transactions.map((transaction) =>
              transaction.accountId === id
                ? { ...transaction, account: updated.bank }
                : transaction,
            ),
      };
    });
  }, []);

  const deleteAccount = useCallback(
    (id, targetId = null) => {
      const account = state.accounts.find((item) => item.id === id);
      if (!account) return 0;

      const moved = state.transactions.filter((transaction) =>
        transactionUsesAccount(transaction, account),
      ).length;

      setState((previous) => {
        const current = previous.accounts.find((item) => item.id === id);
        if (!current) return previous;

        let target = previous.accounts.find(
          (item) => item.id === targetId && item.id !== id,
        );
        if (!target) {
          target =
            previous.accounts.find((item) => item.id !== id) ??
            createFallbackAccount(current.balance);
        }

        const others = previous.accounts.filter((item) => item.id !== id);
        const isNewFallback = !others.some((item) => item.id === target.id);
        const nextAccounts = isNewFallback
          ? [target]
          : others.map((item) =>
              item.id === target.id
                ? { ...item, balance: item.balance + current.balance }
                : item,
            );

        const transactions = previous.transactions.map((transaction) =>
          transactionUsesAccount(transaction, current)
            ? { ...transaction, account: target.bank, accountId: target.id }
            : transaction,
        );

        return { ...previous, accounts: nextAccounts, transactions };
      });

      return moved;
    },
    [state.accounts, state.transactions],
  );

  const updateBudgets = useCallback((patch) => {
    setState((previous) => ({
      ...previous,
      budgets: normalizeBudgets({ ...previous.budgets, ...patch }),
    }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((previous) => {
      const next = { ...previous.settings, ...patch };
      if (patch?.cloud) {
        next.cloud = { ...previous.settings.cloud, ...patch.cloud };
      }
      return {
        ...previous,
        settings: normalizeSettings(next),
      };
    });
  }, []);

  const resetData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      console.warn("ZhKas: penyimpanan lokal tidak tersedia.", error);
    }
    setState(createInitialState());
  }, []);

  const restoreData = useCallback((payload) => {
    const normalized = normalizeBackup(payload);
    setState({
      accounts: normalized.accounts,
      budgets: normalized.budgets,
      transactions: normalized.transactions,
      debts: normalized.debts,
      settings: normalized.settings,
    });
    return {
      transactions: normalized.transactions.length,
      debts: normalized.debts.length,
    };
  }, []);

  const value = useMemo(() => {
    const { accounts, budgets, transactions, debts, settings } = state;
    const now = new Date();

    const thisMonth = transactions.filter(
      (transaction) =>
        transaction.date.getFullYear() === now.getFullYear() &&
        transaction.date.getMonth() === now.getMonth(),
    );

    const monthlyExpense = thisMonth
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const monthlyIncome = thisMonth
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const budgetCategories = Object.entries(budgets).map(([category, limit]) => {
      const spent = thisMonth
        .filter(
          (transaction) =>
            transaction.type === "expense" && transaction.category === category,
        )
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        category,
        label: categoryMeta[category]?.label ?? category,
        limit,
        spent,
        remaining: limit - spent,
        percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      };
    });

    const totalBudget = budgetCategories.reduce(
      (total, budget) => total + budget.limit,
      0,
    );
    const totalSpent = budgetCategories.reduce(
      (total, budget) => total + budget.spent,
      0,
    );
    const totalRemaining = Math.max(totalBudget - totalSpent, 0);

    const dailySpending = Array.from({ length: 7 }, (_, index) => {
      const offset = 6 - index;
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const total = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" && sameDay(transaction.date, date),
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return { date, total };
    });

    const historyDays = new Set(
      transactions.map((transaction) => getDateKey(transaction.date)),
    ).size;

    const totalBalance = accounts.reduce(
      (total, account) => total + account.balance,
      0,
    );
    const debtSummary = debtTotals(debts);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const previousMonth = summarize(
      transactions,
      previousMonthStart,
      previousMonthEnd,
    );

    return {
      accounts,
      budgets,
      transactions,
      debts,
      settings,
      totalBalance,
      netWorth: totalBalance + debtSummary.net,
      monthlyExpense,
      monthlyIncome,
      monthlyNet: monthlyIncome - monthlyExpense,
      savingsRate:
        monthlyIncome > 0
          ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
          : null,
      previousMonthExpense: previousMonth.expense,
      previousMonthIncome: previousMonth.income,
      budgetCategories,
      totalBudget,
      totalSpent,
      totalRemaining,
      budgetPercent:
        totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      dailySpending,
      historyDays,
      monthStart,
      monthlySeries: buildMonthlySeries(transactions, 6, now),
      categoryBreakdown: categoryBreakdown(transactions, monthStart, now),
      debtSummary,
      addTransaction,
      importTransactions,
      deleteTransaction,
      addDebt,
      addDebtPayment,
      updateDebt,
      deleteDebt,
      addAccount,
      updateAccount,
      deleteAccount,
      updateBudgets,
      updateSettings,
      resetData,
      restoreData,
    };
  }, [
    state,
    addTransaction,
    importTransactions,
    deleteTransaction,
    addDebt,
    addDebtPayment,
    updateDebt,
    deleteDebt,
    addAccount,
    updateAccount,
    deleteAccount,
    updateBudgets,
    updateSettings,
    resetData,
    restoreData,
  ]);

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance harus dipakai di dalam FinanceProvider.");
  }
  return context;
}
