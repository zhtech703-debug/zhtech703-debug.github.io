import { getDateKey } from "../data";

/** Kunci anti-duplikat untuk impor: hari, jam, nama, nominal, rekening, tipe. */
export function transactionKey(transaction) {
  const date = transaction.date;
  return [
    getDateKey(date),
    date.getHours(),
    date.getMinutes(),
    transaction.name.trim().toLowerCase(),
    Math.round(transaction.amount),
    transaction.account.toLowerCase(),
    transaction.type,
  ].join("|");
}
