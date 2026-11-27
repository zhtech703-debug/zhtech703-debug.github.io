const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

/** Rp1.000.000 — the compact, app-native Rupiah format. */
export function formatRupiah(value) {
  return rupiahFormatter.format(Math.round(value)).replace(/\s/g, "");
}

/** Rp1,2 jt / Rp850 rb for charts and tight spaces. */
export function formatRupiahCompact(value) {
  const number = Math.abs(value);
  if (number >= 1_000_000_000) {
    return `Rp${numberFormatter.format(value / 1_000_000_000)} M`;
  }
  if (number >= 1_000_000) {
    return `Rp${numberFormatter.format(value / 1_000_000)} jt`;
  }
  if (number >= 1_000) {
    return `Rp${Math.round(value / 1_000)} rb`;
  }
  return formatRupiah(value);
}

export function formatTime(date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", ".");
}

export function formatHeaderDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatMonthYear(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatGroupDate(date) {
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = Math.round((today - target) / 86_400_000);

  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatFullDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
