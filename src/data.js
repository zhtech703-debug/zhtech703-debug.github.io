const TODAY = new Date();

function dateAt(offset, hour, minute) {
  const date = new Date(TODAY);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export const categoryMeta = {
  makan: {
    label: "Makan & Minum",
    accent: "#9BD9FF",
    soft: "rgba(139, 211, 255, 0.12)",
    bar: "linear-gradient(90deg, #5CC6FF, #B6E7FF)",
  },
  transport: {
    label: "Transportasi",
    accent: "#8CAEFF",
    soft: "rgba(140, 174, 255, 0.12)",
    bar: "linear-gradient(90deg, #6D95FF, #B8C9FF)",
  },
  belanja: {
    label: "Belanja",
    accent: "#B5C6FF",
    soft: "rgba(181, 198, 255, 0.12)",
    bar: "linear-gradient(90deg, #8EA5FF, #D6DFFF)",
  },
  tagihan: {
    label: "Tagihan",
    accent: "#76E2EF",
    soft: "rgba(118, 226, 239, 0.11)",
    bar: "linear-gradient(90deg, #46D2E5, #A7F2FB)",
  },
  hiburan: {
    label: "Hiburan",
    accent: "#AABAD6",
    soft: "rgba(170, 186, 214, 0.11)",
    bar: "linear-gradient(90deg, #7D98C5, #C3D1E8)",
  },
  kesehatan: {
    label: "Kesehatan",
    accent: "#7BE7C7",
    soft: "rgba(123, 231, 199, 0.11)",
    bar: "linear-gradient(90deg, #50DDB7, #A9F5DE)",
  },
  hutang: {
    label: "Hutang & Piutang",
    accent: "#FFCE8F",
    soft: "rgba(255, 206, 143, 0.11)",
    bar: "linear-gradient(90deg, #F4B860, #FFE3B8)",
  },
  pemasukan: {
    label: "Pemasukan",
    accent: "#67E4B8",
    soft: "rgba(103, 228, 184, 0.12)",
    bar: "linear-gradient(90deg, #4BD8A6, #A5F3D3)",
  },
};

/** Kategori pengeluaran yang punya budget bulanan. */
export const budgetCategoryKeys = [
  "makan",
  "transport",
  "belanja",
  "tagihan",
  "hiburan",
  "kesehatan",
];

export const bankAccounts = [
  {
    id: "bca",
    bank: "BCA",
    theme: "midnight",
    kind: "Tahungan Utama",
    cardType: "Debit",
    balance: 1_000_000,
    cardNumber: "5412  ••••  ••••  8821",
    holder: "RAKA ADITYA",
    expiry: "09/29",
    network: "VISA",
    background:
      "linear-gradient(135deg, #1A497D 0%, #0D2A54 44%, #060F22 100%)",
    glow: "rgba(125, 211, 252, 0.36)",
    accent: "#BFEAFF",
  },
  {
    id: "mandiri",
    bank: "mandiri",
    theme: "ocean",
    kind: "Dana Darurat",
    cardType: "Tabungan",
    balance: 2_450_000,
    cardNumber: "5274  ••••  ••••  4470",
    holder: "RAKA ADITYA",
    expiry: "03/30",
    network: "GPN",
    background:
      "linear-gradient(135deg, #114852 0%, #0A2B36 46%, #05151D 100%)",
    glow: "rgba(103, 232, 249, 0.25)",
    accent: "#A5F3FC",
  },
  {
    id: "blu",
    bank: "blu",
    theme: "indigo",
    kind: "Dompet Harian",
    cardType: "Dompet digital",
    balance: 750_000,
    cardNumber: "5399  ••••  ••••  2036",
    holder: "RAKA ADITYA",
    expiry: "11/28",
    network: "VISA",
    background:
      "linear-gradient(135deg, #252D68 0%, #121943 45%, #070B21 100%)",
    glow: "rgba(147, 197, 253, 0.3)",
    accent: "#D7E6FF",
  },
];

const curatedExpenses = [
  // Hari ini
  {
    offset: 0,
    hour: 8,
    minute: 12,
    name: "Kopi Kenangan",
    category: "makan",
    amount: 24_000,
    account: "BCA",
    note: "Iced Americano · Grand Indonesia",
  },
  {
    offset: 0,
    hour: 12,
    minute: 35,
    name: "GoFood",
    category: "makan",
    amount: 68_000,
    account: "BCA",
    note: "Nasi ayam geprek + es teh",
  },
  {
    offset: 0,
    hour: 19,
    minute: 20,
    name: "Tokopedia",
    category: "belanja",
    amount: 189_000,
    account: "blu",
    note: "Keyboard wireless · free shipping",
  },
  // Kemarin
  {
    offset: 1,
    hour: 7,
    minute: 40,
    name: "Gojek",
    category: "transport",
    amount: 27_000,
    account: "BCA",
    note: "GoRide · Sudirman",
  },
  {
    offset: 1,
    hour: 13,
    minute: 10,
    name: "Sushi Tei",
    category: "makan",
    amount: 185_000,
    account: "BCA",
    note: "Lunch bersama tim",
  },
  {
    offset: 1,
    hour: 18,
    minute: 45,
    name: "H&M",
    category: "belanja",
    amount: 379_000,
    account: "blu",
    note: "Oversized knit sweater",
  },
  // 2 hari lalu
  {
    offset: 2,
    hour: 9,
    minute: 5,
    name: "MRT Jakarta",
    category: "transport",
    amount: 14_000,
    account: "blu",
    note: "Lebak Bulus → Bundaran HI",
  },
  {
    offset: 2,
    hour: 12,
    minute: 20,
    name: "Fore Coffee",
    category: "makan",
    amount: 28_000,
    account: "BCA",
    note: "Kopi susu aren",
  },
  {
    offset: 2,
    hour: 20,
    minute: 0,
    name: "Bioskop XXI",
    category: "hiburan",
    amount: 100_000,
    account: "BCA",
    note: "Tiket film · Plaza Senayan",
  },
  // 3 hari lalu
  {
    offset: 3,
    hour: 10,
    minute: 20,
    name: "Shopee",
    category: "belanja",
    amount: 156_000,
    account: "blu",
    note: "Sepatu lari + kaos kaki",
  },
  {
    offset: 3,
    hour: 13,
    minute: 30,
    name: "Bakso Pak Kumis",
    category: "makan",
    amount: 45_000,
    account: "BCA",
    note: "Bakso campur + es jeruk",
  },
  {
    offset: 3,
    hour: 17,
    minute: 50,
    name: "Gojek",
    category: "transport",
    amount: 32_000,
    account: "BCA",
    note: "GoCar · pulang kantor",
  },
  // 4 hari lalu
  {
    offset: 4,
    hour: 8,
    minute: 0,
    name: "Kopi Kenangan",
    category: "makan",
    amount: 22_000,
    account: "BCA",
    note: "Kopi pandan latte",
  },
  {
    offset: 4,
    hour: 12,
    minute: 45,
    name: "Pizza Hut",
    category: "makan",
    amount: 130_000,
    account: "BCA",
    note: "Meal box for two",
  },
  {
    offset: 4,
    hour: 19,
    minute: 30,
    name: "Spotify",
    category: "tagihan",
    amount: 59_900,
    account: "blu",
    note: "Premium individual · auto debit",
  },
  // 5 hari lalu
  {
    offset: 5,
    hour: 9,
    minute: 15,
    name: "Gym FitPlus",
    category: "kesehatan",
    amount: 250_000,
    account: "Mandiri",
    note: "Monthly membership",
  },
  {
    offset: 5,
    hour: 16,
    minute: 0,
    name: "Indomaret",
    category: "belanja",
    amount: 87_000,
    account: "BCA",
    note: "Belanja mingguan",
  },
  {
    offset: 5,
    hour: 20,
    minute: 10,
    name: "Grab",
    category: "transport",
    amount: 38_000,
    account: "blu",
    note: "GrabCar · dinner",
  },
  // 6 hari lalu
  {
    offset: 6,
    hour: 10,
    minute: 0,
    name: "Uniqlo",
    category: "belanja",
    amount: 249_000,
    account: "blu",
    note: "AIRism tee · 2 pcs",
  },
  {
    offset: 6,
    hour: 13,
    minute: 0,
    name: "Warung Bu Tini",
    category: "makan",
    amount: 35_000,
    account: "BCA",
    note: "Nasi campur",
  },
  {
    offset: 6,
    hour: 21,
    minute: 0,
    name: "Steam",
    category: "hiburan",
    amount: 145_000,
    account: "BCA",
    note: "Game library · autumn sale",
  },
];

const incomeEntries = [
  {
    offset: 24,
    hour: 8,
    minute: 0,
    name: "Gaji bulan ini",
    category: "pemasukan",
    amount: 8_500_000,
    account: "BCA",
    note: "Payroll · PT Nusantara Digital",
  },
  {
    offset: 16,
    hour: 15,
    minute: 20,
    name: "Proyek freelance",
    category: "pemasukan",
    amount: 1_250_000,
    account: "BCA",
    note: "Transfer masuk · Studio Karsa",
  },
  {
    offset: 10,
    hour: 20,
    minute: 12,
    name: "Cashback Shopee",
    category: "pemasukan",
    amount: 47_500,
    account: "blu",
    note: "Cashback campaign",
  },
  {
    offset: 5,
    hour: 19,
    minute: 45,
    name: "Transfer dari Dinda",
    category: "pemasukan",
    amount: 250_000,
    account: "Mandiri",
    note: "Patungan tiket konser",
  },
  {
    offset: 2,
    hour: 6,
    minute: 30,
    name: "Bunga tabungan",
    category: "pemasukan",
    amount: 12_500,
    account: "Mandiri",
    note: "Bunga bulanan",
  },
];

const expensePools = {
  makan: [
    ["Kopi Kenangan", 24_000],
    ["GoFood", 68_000],
    ["Fore Coffee", 28_000],
    ["Janji Jiwa", 22_000],
    ["Nasi Goreng Mafia", 38_000],
    ["Sate Taichan", 42_000],
    ["Mixue", 18_000],
    ["Roti O", 35_000],
    ["Warteg Bahari", 25_000],
    ["Pizza Hut", 130_000],
    ["Sushi Tei", 185_000],
    ["Toko Kopi Tuku", 32_000],
    ["Bakmi GM", 55_000],
  ],
  transport: [
    ["Gojek", 27_000],
    ["Grab", 42_000],
    ["MRT Jakarta", 14_000],
    ["TransJakarta", 3_500],
    ["Pertalite", 85_000],
    ["Parkir Mall", 10_000],
    ["Kereta Bandara", 70_000],
    ["Bluebird", 58_000],
    ["Bengkel Motor", 95_000],
  ],
  belanja: [
    ["Shopee", 187_000],
    ["Tokopedia", 156_000],
    ["Indomaret", 87_000],
    ["H&M", 379_000],
    ["Uniqlo", 249_000],
    ["Alfamart", 62_000],
    ["ACE Hardware", 215_000],
    ["Sociolla", 178_000],
  ],
  tagihan: [
    ["Netflix", 54_000],
    ["Spotify", 59_900],
    ["Listrik PLN", 245_000],
    ["Telkomsel", 100_000],
    ["Air PDAM", 87_000],
    ["IndiHome", 350_000],
    ["iCloud", 59_000],
  ],
  hiburan: [
    ["Bioskop XXI", 100_000],
    ["Steam", 145_000],
    ["Bowling", 120_000],
    ["Konser", 450_000],
    ["Karaoke", 150_000],
    ["DLC Game", 89_000],
  ],
  kesehatan: [
    ["Apotek K-24", 65_000],
    ["Gym FitPlus", 250_000],
    ["Vitamin", 89_000],
    ["Klinik Sehat", 180_000],
    ["Sports Drink", 25_000],
  ],
};

const weightedCategories = [
  ...Array(34).fill("makan"),
  ...Array(22).fill("transport"),
  ...Array(16).fill("belanja"),
  ...Array(10).fill("tagihan"),
  ...Array(9).fill("hiburan"),
  ...Array(9).fill("kesehatan"),
];

function createRandom(seed) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const random = createRandom(2_026_112_5);

const accounts = ["BCA", "Mandiri", "blu"];
const timeSlots = [
  [7, 25],
  [8, 50],
  [11, 10],
  [12, 45],
  [15, 20],
  [17, 35],
  [19, 15],
  [20, 40],
];

function pick(list) {
  return list[Math.floor(random() * list.length)];
}

function pickCategory() {
  return pick(weightedCategories);
}

const generatedExpenses = [];
for (let offset = 7; offset < 33; offset += 1) {
  const roll = random();
  const count = roll < 0.16 ? 1 : roll < 0.62 ? 2 : 3;
  const shuffledTimes = [...timeSlots]
    .map((slot) => ({ slot, order: random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, count)
    .map(({ slot }) => slot)
    .sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));

  shuffledTimes.forEach(([hour, minute], index) => {
    const category = pickCategory();
    const [name, amount] = pick(expensePools[category]);
    generatedExpenses.push({
      offset,
      hour,
      minute,
      name,
      category,
      amount,
      account: pick(accounts),
      note: category === "tagihan" ? "Pembayaran otomatis" : "Pembayaran berhasil",
      generated: true,
      index,
    });
  });
}

let transactionCounter = 0;

function normalizeTransaction(entry) {
  transactionCounter += 1;
  const isIncome = entry.category === "pemasukan";
  const date = dateAt(entry.offset, entry.hour, entry.minute);

  return {
    id: `ZHK-${String(transactionCounter).padStart(4, "0")}`,
    name: entry.name,
    category: entry.category,
    amount: entry.amount,
    type: isIncome ? "income" : "expense",
    date,
    account: entry.account,
    note: entry.note,
    status: "Berhasil",
  };
}

const rawTransactions = [
  ...curatedExpenses,
  ...generatedExpenses,
  ...incomeEntries,
]
  .sort((a, b) => {
    const dateA = dateAt(a.offset, a.hour, a.minute).getTime();
    const dateB = dateAt(b.offset, b.hour, b.minute).getTime();
    return dateB - dateA;
  })
  .map(normalizeTransaction);

export const transactions = rawTransactions;

export const HISTORY_DAYS = new Set(
  rawTransactions.map(
    (transaction) =>
      `${transaction.date.getFullYear()}-${transaction.date.getMonth()}-${transaction.date.getDate()}`,
  ),
).size;

export const totalBalance = bankAccounts.reduce(
  (total, account) => total + account.balance,
  0,
);

export const budgetLimits = {
  makan: 2_500_000,
  transport: 1_000_000,
  belanja: 2_600_000,
  tagihan: 1_000_000,
  hiburan: 900_000,
  kesehatan: 800_000,
};

function isThisMonth(date) {
  return (
    date.getFullYear() === TODAY.getFullYear() &&
    date.getMonth() === TODAY.getMonth()
  );
}

export const thisMonthTransactions = transactions.filter((transaction) =>
  isThisMonth(transaction.date),
);

export const monthlyExpense = thisMonthTransactions
  .filter((transaction) => transaction.type === "expense")
  .reduce((total, transaction) => total + transaction.amount, 0);

export const monthlyIncome = thisMonthTransactions
  .filter((transaction) => transaction.type === "income")
  .reduce((total, transaction) => total + transaction.amount, 0);

export const budgetCategories = Object.entries(budgetLimits).map(
  ([category, limit]) => {
    const spent = thisMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense" && transaction.category === category,
      )
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      category,
      label: categoryMeta[category].label,
      limit,
      spent,
      remaining: limit - spent,
      percent: Math.round((spent / limit) * 100),
    };
  },
);

export const totalBudget = budgetCategories.reduce(
  (total, budget) => total + budget.limit,
  0,
);

export const totalSpent = budgetCategories.reduce(
  (total, budget) => total + budget.spent,
  0,
);

export const totalRemaining = Math.max(totalBudget - totalSpent, 0);

export const budgetPercent = Math.round((totalSpent / totalBudget) * 100);

export const dailySpending = Array.from({ length: 7 }, (_, index) => {
  const offset = 6 - index;
  const date = dateAt(offset, 12, 0);
  const total = transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") return false;
      const target = transaction.date;
      return (
        target.getFullYear() === date.getFullYear() &&
        target.getMonth() === date.getMonth() &&
        target.getDate() === date.getDate()
      );
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return { date, total };
});

export function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function groupTransactions(items) {
  const groups = new Map();

  items.forEach((transaction) => {
    const key = getDateKey(transaction.date);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: transaction.date,
        items: [],
      });
    }
    groups.get(key).items.push(transaction);
  });

  return [...groups.values()].sort((a, b) => b.date - a.date);
}

export function getDayTotal(items, type = "expense") {
  return items
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

/**
 * Catatan hutang/piutang contoh. `receivable` = kita memberi pinjaman,
 * `payable` = kita menerima pinjaman. Nominal tidak otomatis mengubah saldo
 * rekening sampai pengguna memilih "catat ke kas".
 */
export const seedDebts = [
  {
    id: "DBT-DEMO-01",
    direction: "receivable",
    counterparty: "Bagas",
    amount: 350_000,
    date: dateAt(9, 10, 0),
    dueDate: dateAt(-5, 12, 0),
    note: "Talangan servis motor",
    payments: [
      {
        id: "DBT-PAY-01",
        amount: 100_000,
        date: dateAt(4, 19, 0),
        note: "Transfer BCA",
      },
    ],
    createdAt: dateAt(9, 10, 0),
  },
  {
    id: "DBT-DEMO-02",
    direction: "payable",
    counterparty: "Kas kantor",
    amount: 500_000,
    date: dateAt(12, 9, 30),
    dueDate: dateAt(-3, 12, 0),
    note: "Pinjaman darurat, dikembalikan setelah gajian",
    payments: [],
    createdAt: dateAt(12, 9, 30),
  },
  {
    id: "DBT-DEMO-03",
    direction: "receivable",
    counterparty: "Sinta",
    amount: 150_000,
    date: dateAt(20, 14, 0),
    dueDate: dateAt(10, 12, 0),
    note: "Patungan kado kantor",
    payments: [
      {
        id: "DBT-PAY-02",
        amount: 150_000,
        date: dateAt(7, 16, 0),
        note: "Lunas via blu",
      },
    ],
    createdAt: dateAt(20, 14, 0),
  },
];

export const seedSettings = {
  name: "Raka",
  incomeTarget: 8_500_000,
  savingsTargetPercent: 20,
  emergencyFundMonths: 3,
  theme: "dark",
  accent: "glacier",
  cloud: {
    clientId: "",
    email: "",
    lastSyncAt: null,
  },
};

export const accentPalettes = {
  glacier: {
    label: "Glacier Biru",
    color: "#9BD9FF",
    darkColor: "#2563EB",
    lightColor: "#1D4ED8",
    soft: "rgba(155, 217, 255, 0.16)",
    lightSoft: "rgba(29, 78, 216, 0.10)",
    contrast: "#06131F",
  },
  mint: {
    label: "Mint Hijau",
    color: "#67E4B8",
    darkColor: "#059669",
    lightColor: "#047857",
    soft: "rgba(103, 228, 184, 0.16)",
    lightSoft: "rgba(4, 120, 87, 0.10)",
    contrast: "#04140F",
  },
  gold: {
    label: "Emas",
    color: "#FFCE8F",
    darkColor: "#B45309",
    lightColor: "#92400E",
    soft: "rgba(255, 206, 143, 0.16)",
    lightSoft: "rgba(146, 64, 14, 0.10)",
    contrast: "#2A1A05",
  },
  violet: {
    label: "Violet",
    color: "#C4B5FD",
    darkColor: "#7C3AED",
    lightColor: "#6D28D9",
    soft: "rgba(196, 181, 253, 0.16)",
    lightSoft: "rgba(109, 40, 217, 0.10)",
    contrast: "#160B2E",
  },
  rose: {
    label: "Rose",
    color: "#FDA4AF",
    darkColor: "#E11D48",
    lightColor: "#BE123C",
    soft: "rgba(253, 164, 175, 0.16)",
    lightSoft: "rgba(190, 18, 60, 0.10)",
    contrast: "#2A0710",
  },
  amber: {
    label: "Amber",
    color: "#FCD34D",
    darkColor: "#D97706",
    lightColor: "#A16207",
    soft: "rgba(252, 211, 77, 0.16)",
    lightSoft: "rgba(161, 98, 7, 0.12)",
    contrast: "#2A1A05",
  },
};

/** Tema visual kartu dompet. Tetap gelap agar tulisan putih selalu terbaca. */
export const cardThemes = {
  midnight: {
    label: "Midnight Biru",
    background: "linear-gradient(135deg,#1A497D 0%,#0D2A54 44%,#060F22 100%)",
    glow: "rgba(125, 211, 252, 0.36)",
    accent: "#BFEAFF",
  },
  ocean: {
    label: "Laut Hijau",
    background: "linear-gradient(135deg,#114852 0%,#0A2B36 46%,#05151D 100%)",
    glow: "rgba(103, 232, 249, 0.28)",
    accent: "#A5F3FC",
  },
  indigo: {
    label: "Indigo Malam",
    background: "linear-gradient(135deg,#252D68 0%,#121943 45%,#070B21 100%)",
    glow: "rgba(147, 197, 253, 0.30)",
    accent: "#D7E6FF",
  },
  forest: {
    label: "Hutan Mint",
    background: "linear-gradient(135deg,#164E3B 0%,#0A3327 48%,#04140F 100%)",
    glow: "rgba(103, 228, 184, 0.30)",
    accent: "#A7F3D0",
  },
  plum: {
    label: "Ungu Elegan",
    background: "linear-gradient(135deg,#4C1D95 0%,#2E1065 48%,#120424 100%)",
    glow: "rgba(196, 181, 253, 0.30)",
    accent: "#DDD6FE",
  },
  ember: {
    label: "Amber Hangat",
    background: "linear-gradient(135deg,#7C2D12 0%,#431407 48%,#1A0702 100%)",
    glow: "rgba(252, 211, 77, 0.26)",
    accent: "#FDE68A",
  },
  slate: {
    label: "Slate Netral",
    background: "linear-gradient(135deg,#334155 0%,#1E293B 48%,#0F172A 100%)",
    glow: "rgba(226, 232, 240, 0.20)",
    accent: "#E2E8F0",
  },
};

/** Pilihan kartu sumber dana yang menyerupai kartu bank nyata. */
export const cardKinds = [
  { id: "Debit", label: "Debit" },
  { id: "Kredit", label: "Kredit" },
  { id: "Tabungan", label: "Tabungan" },
  { id: "Dompet digital", label: "Dompet digital" },
  { id: "Tunai", label: "Tunai" },
];

export const cardNetworks = [
  { id: "VISA", label: "VISA" },
  { id: "MASTERCARD", label: "Mastercard" },
  { id: "GPN", label: "GPN" },
  { id: "QRIS", label: "QRIS" },
];

/** Ambang budget yang dipakai UI dan mesin saran. */
export const BUDGET_WARNING_PERCENT = 80;
export const BUDGET_DANGER_PERCENT = 100;
