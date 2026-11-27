import { categoryMeta } from "../data.js";

/**
 * Parser CSV lokal untuk ZhKas. Semua pemrosesan terjadi di browser:
 * tidak ada file yang diunggah dan tidak ada request jaringan.
 */

const MONTHS = {
  jan: 0,
  januari: 0,
  january: 0,
  feb: 1,
  februari: 1,
  february: 1,
  mar: 2,
  maret: 2,
  march: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  june: 5,
  jul: 6,
  juli: 6,
  july: 6,
  agu: 7,
  agt: 7,
  agustus: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
  december: 11,
};

export const expenseCategories = [
  "makan",
  "transport",
  "belanja",
  "tagihan",
  "hiburan",
  "kesehatan",
];

export const SAMPLE_CSV = [
  "tanggal,keterangan,jumlah,tipe",
  "26/11/2026,Kopi Kenangan,-24000,debit",
  "25/11/2026,Gojek ke kantor,-27000,debit",
  "24/11/2026,Gaji November,8500000,kredit",
  "23/11/2026,Belanja Indomaret,-87500,debit",
  "22/11/2026,Netflix,-54000,debit",
].join("\n");

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length) ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;

  candidates.forEach((delimiter) => {
    let count = 0;
    let inQuotes = false;

    for (let index = 0; index < firstLine.length; index += 1) {
      const character = firstLine[index];
      if (character === '"') {
        inQuotes = !inQuotes;
      } else if (character === delimiter && !inQuotes) {
        count += 1;
      }
    }

    if (count > bestCount) {
      bestCount = count;
      best = delimiter;
    }
  });

  return best;
}

/** Parse teks CSV menjadi headers + baris, mendukung kutip dan escaped quote. */
export function parseCsv(text) {
  const clean = String(text ?? "").replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < clean.length; index += 1) {
    const character = clean[index];

    if (inQuotes) {
      if (character === '"') {
        if (clean[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === delimiter) {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((item) =>
    item.some((cell) => String(cell).trim() !== ""),
  );

  if (nonEmpty.length === 0) {
    return { delimiter, headers: [], rows: [] };
  }

  const headers = nonEmpty[0].map(
    (header, index) => String(header).trim() || `Kolom ${index + 1}`,
  );

  return {
    delimiter,
    headers,
    rows: nonEmpty.slice(1).map((item) =>
      headers.map((_, index) => String(item[index] ?? "").trim()),
    ),
  };
}

/** Angka Indonesia/umum: "Rp25.000", "1.234,56", "(25.000)", "-24000". */
export function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;

  let text = String(raw).trim();
  if (!text) return null;

  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.includes("-")) negative = true;

  text = text.replace(/[^\d.,]/g, "");
  if (!text) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized = text;

  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  } else if (lastComma > -1) {
    const decimals = text.length - lastComma - 1;
    const singleComma = text.indexOf(",") === lastComma;
    normalized =
      singleComma && decimals > 0 && decimals <= 2
        ? text.replace(",", ".")
        : text.replace(/,/g, "");
  } else if (lastDot > -1) {
    const parts = text.split(".");
    const decimals = parts[parts.length - 1].length;
    normalized =
      parts.length > 2 || decimals === 3 ? text.replace(/\./g, "") : text;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  return negative ? -Math.abs(value) : value;
}

function buildDate(year, month, day, hours = 0, minutes = 0, seconds = 0) {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(
    fullYear,
    month,
    day,
    Math.min(Math.max(hours, 0), 23),
    Math.min(Math.max(minutes, 0), 59),
    Math.min(Math.max(seconds, 0), 59),
  );

  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Tanggal: ISO, DD/MM/YYYY, DD-MM-YY, 25 Nov 2026, Nov 25, 2026. */
export function parseDate(raw) {
  if (!raw) return null;

  const text = String(raw).trim().replace(/\s+/g, " ");
  if (!text) return null;

  const iso = text.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (iso) {
    return buildDate(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] ?? 0),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0),
    );
  }

  const numeric = text.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    let day = first;
    let month = second;

    if (first <= 12 && second > 12) {
      month = first;
      day = second;
    }

    return buildDate(
      Number(numeric[3]),
      month - 1,
      day,
      Number(numeric[4] ?? 0),
      Number(numeric[5] ?? 0),
      Number(numeric[6] ?? 0),
    );
  }

  const dayFirst = text.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})(?:.*?(\d{1,2}):(\d{2}))?/,
  );
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].toLowerCase()];
    if (month === undefined) return null;
    return buildDate(
      Number(dayFirst[3]),
      month,
      Number(dayFirst[1]),
      Number(dayFirst[4] ?? 0),
      Number(dayFirst[5] ?? 0),
    );
  }

  const monthFirst = text.match(
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{2,4})(?:.*?(\d{1,2}):(\d{2}))?/,
  );
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()];
    if (month === undefined) return null;
    return buildDate(
      Number(monthFirst[3]),
      month,
      Number(monthFirst[2]),
      Number(monthFirst[4] ?? 0),
      Number(monthFirst[5] ?? 0),
    );
  }

  return null;
}

function normalizeHeader(header) {
  return String(header).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Deteksi kolom umum dari header bank Indonesia/Inggris. */
export function detectColumns(headers) {
  const mapping = {
    date: -1,
    description: -1,
    amount: -1,
    debit: -1,
    credit: -1,
    type: -1,
  };

  headers.forEach((header, index) => {
    const key = normalizeHeader(header);
    if (!key) return;

    if (mapping.date === -1 && /^(tanggal|date|tgl|waktu|datetime|postingdate|transactiondate|valuedate)$/.test(key)) {
      mapping.date = index;
      return;
    }
    if (
      mapping.description === -1 &&
      /^(keterangan|description|deskripsi|merchant|nama|name|detail|memo|berita|uraian|narasi|remark|note|notes)$/.test(key)
    ) {
      mapping.description = index;
      return;
    }
    if (mapping.debit === -1 && /^(debit|debet|keluar|pengeluaran|out|withdrawal|db|debitamount)$/.test(key)) {
      mapping.debit = index;
      return;
    }
    if (mapping.credit === -1 && /^(kredit|credit|masuk|pemasukan|in|deposit|cr|creditamount)$/.test(key)) {
      mapping.credit = index;
      return;
    }
    if (mapping.type === -1 && /^(tipe|type|jenis|jenistransaksi|transactiontype|dc|debitcredit)$/.test(key)) {
      mapping.type = index;
      return;
    }
    if (
      mapping.amount === -1 &&
      /^(jumlah|amount|nominal|nilai|total|value|mutasi|trxamount|transactionamount)$/.test(key)
    ) {
      mapping.amount = index;
    }
  });

  return mapping;
}

/**
 * Lengkapi hasil deteksi header dengan sampling data, supaya file tanpa nama
 * kolom standar tetap bisa dipetakan otomatis.
 */
export function suggestMapping({ headers, rows }) {
  const mapping = detectColumns(headers);
  const sample = rows.slice(0, 8);

  function score(index, predicate) {
    return sample.filter((row) => row[index] && predicate(row[index])).length;
  }

  if (mapping.date === -1) {
    let best = -1;
    let bestScore = 0;
    headers.forEach((_, index) => {
      const current = score(index, (value) => parseDate(value) !== null);
      if (current > bestScore) {
        bestScore = current;
        best = index;
      }
    });
    if (bestScore > 0) mapping.date = best;
  }

  if (mapping.description === -1) {
    let best = -1;
    let bestScore = 0;
    const used = new Set([
      mapping.date,
      mapping.amount,
      mapping.debit,
      mapping.credit,
      mapping.type,
    ]);

    headers.forEach((_, index) => {
      if (used.has(index)) return;
      const current = score(
        index,
        (value) =>
          value.trim().length > 2 &&
          parseAmount(value) === null &&
          parseDate(value) === null,
      );
      if (current > bestScore) {
        bestScore = current;
        best = index;
      }
    });

    if (bestScore > 0) mapping.description = best;
  }

  if (
    mapping.amount === -1 &&
    mapping.debit === -1 &&
    mapping.credit === -1
  ) {
    let best = -1;
    let bestScore = 0;
    headers.forEach((_, index) => {
      if (index === mapping.date) return;
      const current = score(index, (value) => parseAmount(value) !== null);
      if (current > bestScore) {
        bestScore = current;
        best = index;
      }
    });
    if (bestScore > 0) mapping.amount = best;
  }

  return mapping;
}

const CATEGORY_KEYWORDS = [
  {
    category: "makan",
    words: [
      "kopi", "cafe", "coffee", "resto", "restaurant", "warung", "makan",
      "food", "gofood", "grabfood", "bakery", "bakso", "sate", "pizza",
      "sushi", "kfc", "mcd", "mcdonald", "starbucks", "mixue", "roti",
      "warteg", "bakmi", "nasi", "kantin", "catering",
    ],
  },
  {
    category: "transport",
    words: [
      "gojek", "grab", "mrt", "transjakarta", "bensin", "pertalite",
      "pertamax", "parkir", "tol", "taxi", "taksi", "ojek", "kereta",
      "bus", "bluebird", "bengkel", "servis motor", "bbm", "spbu",
    ],
  },
  {
    category: "belanja",
    words: [
      "shopee", "tokopedia", "lazada", "blibli", "indomaret", "alfamart",
      "supermarket", "mall", "uniqlo", "h&m", "ace hardware", "ikea",
      "sociolla", "belanja", "grocery", "minimarket", "hypermart",
    ],
  },
  {
    category: "tagihan",
    words: [
      "pln", "listrik", "telkom", "indihome", "pdam", "air", "internet",
      "netflix", "spotify", "icloud", "google", "tagihan", "bpjs", "pulsa",
      "telkomsel", "indosat", "xl", "tri", "langganan", "subscription",
      "iuran", "cicilan", "asuransi",
    ],
  },
  {
    category: "hiburan",
    words: [
      "bioskop", "cinema", "xxi", "cgv", "steam", "game", "konser",
      "karaoke", "bowling", "hiburan", "tiket", "spotify premium",
    ],
  },
  {
    category: "kesehatan",
    words: [
      "apotek", "pharmacy", "klinik", "hospital", "rumah sakit", "gym",
      "dokter", "vitamin", "guardian", "kimia farma", "sehat", "medis",
    ],
  },
];

export function guessCategory(description) {
  const text = String(description ?? "").toLowerCase();
  if (!text) return null;

  const match = CATEGORY_KEYWORDS.find((entry) =>
    entry.words.some((word) => text.includes(word)),
  );

  return match?.category ?? null;
}

function normalizeType(raw) {
  const value = String(raw ?? "").toLowerCase().trim();
  if (!value) return null;

  if (/^(kredit|credit|cr|c|masuk|pemasukan|income|in|deposit)$/.test(value)) {
    return "income";
  }
  if (/^(debit|debet|db|d|keluar|pengeluaran|expense|out|withdrawal)$/.test(value)) {
    return "expense";
  }
  return null;
}

/**
 * Ubah baris CSV menjadi kandidat transaksi. Pemetaan kolom dipilih pengguna,
 * dan setiap baris diberi alasan bila tidak valid.
 */
export function buildImportRows({
  rows,
  mapping,
  defaultType = "expense",
  categoryMode = "auto",
  defaultCategory = "belanja",
}) {
  return rows.map((row, index) => {
    const base = {
      rowNumber: index + 2,
      valid: false,
      reason: "",
      date: null,
      name: "",
      amount: 0,
      type: defaultType,
      category: defaultCategory,
      note: "Diimpor dari CSV (lokal)",
    };

    if (mapping.date < 0) {
      return { ...base, reason: "Kolom tanggal belum dipilih" };
    }

    const date = parseDate(row[mapping.date]);
    if (!date) {
      return { ...base, reason: "Tanggal tidak dikenali" };
    }

    const name =
      (mapping.description >= 0 && row[mapping.description]?.trim()) ||
      "Transaksi impor";

    const debit =
      mapping.debit >= 0 ? parseAmount(row[mapping.debit]) : null;
    const credit =
      mapping.credit >= 0 ? parseAmount(row[mapping.credit]) : null;
    const amountValue =
      mapping.amount >= 0 ? parseAmount(row[mapping.amount]) : null;
    const typeValue =
      mapping.type >= 0 ? normalizeType(row[mapping.type]) : null;

    let type = null;
    let amount = 0;

    if (debit !== null && debit !== 0) {
      type = "expense";
      amount = Math.abs(debit);
    } else if (credit !== null && credit !== 0) {
      type = "income";
      amount = Math.abs(credit);
    } else if (amountValue !== null && amountValue !== 0) {
      if (typeValue) {
        type = typeValue;
        amount = Math.abs(amountValue);
      } else if (amountValue < 0) {
        type = "expense";
        amount = Math.abs(amountValue);
      } else {
        type = defaultType;
        amount = amountValue;
      }
    }

    if (!type || amount <= 0) {
      return { ...base, date, name, reason: "Nominal tidak dikenali" };
    }

    let category = "pemasukan";
    if (type === "expense") {
      category =
        categoryMode === "auto"
          ? guessCategory(name) ?? defaultCategory
          : defaultCategory;
    }

    return {
      ...base,
      valid: true,
      date,
      name,
      amount,
      type,
      category,
      label: categoryMeta[category]?.label ?? category,
    };
  });
}

export function formatPreviewAmount(amount, type) {
  const formatted = new Intl.NumberFormat("id-ID").format(amount);
  return `${type === "income" ? "+" : "−"}Rp${formatted}`;
}
