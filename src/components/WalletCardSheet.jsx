import { useEffect, useMemo, useState } from "react";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { cardKinds, cardNetworks, cardThemes } from "../data";
import { useFinance } from "../lib/store";
import { formatRupiah } from "../lib/format";
import {
  AmountField,
  CancelButton,
  ErrorNote,
  FormField,
  InfoNote,
  PillGroup,
  SheetShell,
  SubmitButton,
  TextInput,
} from "./SheetKit";

function maskCardNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 16);
  if (!digits) return "••••  ••••  ••••  ••••";
  if (digits.length <= 4) {
    return `••••  ••••  ••••  ${digits.padStart(4, "•")}`;
  }
  return `${digits.slice(0, 4)}  ••••  ••••  ${digits.slice(-4)}`;
}

function themePreview(themeKey) {
  const theme = cardThemes[themeKey] ?? cardThemes.midnight;
  return {
    backgroundImage: theme.background,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,.2), 0 12px 24px -18px ${theme.glow}`,
  };
}

export default function WalletCardSheet({ open, onClose, onNotify }) {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount } =
    useFinance();
  const [editingId, setEditingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [targetId, setTargetId] = useState("");
  const [bank, setBank] = useState("");
  const [kind, setKind] = useState("Rekening");
  const [cardType, setCardType] = useState("Debit");
  const [balance, setBalance] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [network, setNetwork] = useState("GPN");
  const [themeKey, setThemeKey] = useState("midnight");
  const [error, setError] = useState("");

  const editing = accounts.find((account) => account.id === editingId) ?? null;
  const otherAccounts = accounts.filter((account) => account.id !== pendingDelete);

  const usage = useMemo(() => {
    const counts = {};
    accounts.forEach((account) => {
      counts[account.id] = transactions.filter(
        (transaction) =>
          transaction.accountId === account.id ||
          (!transaction.accountId &&
            String(transaction.account ?? "").toLowerCase() ===
              account.bank.toLowerCase()),
      ).length;
    });
    return counts;
  }, [accounts, transactions]);

  useEffect(() => {
    if (!open) return;
    setEditingId(null);
    setPendingDelete(null);
    setTargetId("");
    setBank("");
    setKind("Rekening");
    setCardType("Debit");
    setBalance("");
    setCardNumber("");
    setHolder("");
    setExpiry("");
    setNetwork("GPN");
    setThemeKey("midnight");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!pendingDelete) return;
    setTargetId(otherAccounts[0]?.id ?? "");
  }, [pendingDelete, otherAccounts]);

  function startEdit(account) {
    setEditingId(account.id);
    setPendingDelete(null);
    setBank(account.bank);
    setKind(account.kind || "Rekening");
    setCardType(account.cardType || "Debit");
    setBalance(String(account.balance ?? 0));
    setCardNumber(account.cardNumber || "");
    setHolder(account.holder || "");
    setExpiry(account.expiry || "");
    setNetwork(account.network || "GPN");
    setThemeKey(
      account.theme && cardThemes[account.theme] ? account.theme : "midnight",
    );
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setBank("");
    setKind("Rekening");
    setCardType("Debit");
    setBalance("");
    setCardNumber("");
    setHolder("");
    setExpiry("");
    setNetwork("GPN");
    setThemeKey("midnight");
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!bank.trim()) {
      setError("Nama bank atau kartu wajib diisi.");
      return;
    }

    const theme = cardThemes[themeKey] ?? cardThemes.midnight;
    const payload = {
      bank: bank.trim(),
      kind: kind.trim() || "Rekening",
      cardType,
      balance: Math.round(Number(balance) || 0),
      cardNumber: maskCardNumber(cardNumber),
      holder: holder.trim() || "PEMILIK",
      expiry: expiry.trim() || "--/--",
      network,
      theme: themeKey,
      background: theme.background,
      glow: theme.glow,
      accent: theme.accent,
    };

    if (editingId) {
      updateAccount(editingId, payload);
      onNotify?.(`Kartu ${payload.bank} diperbarui.`);
    } else {
      addAccount(payload);
      onNotify?.(`Kartu ${payload.bank} ditambahkan.`);
    }
    resetForm();
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const account = accounts.find((item) => item.id === pendingDelete);
    const moved = deleteAccount(pendingDelete, targetId || null);
    onNotify?.(
      moved > 0
        ? `Kartu ${account?.bank ?? ""} dihapus. ${moved} transaksi dipindahkan.`
        : `Kartu ${account?.bank ?? ""} dihapus.`,
    );
    setPendingDelete(null);
    setTargetId("");
    resetForm();
  }

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      label="Kartu sumber dana"
      title="Kartu sumber dana"
      subtitle="Tambah, ubah, atau hapus kartu dompet. Data kartu hanya disimpan di perangkat ini."
      badge={
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/15 bg-sky-300/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-glacier">
          <CreditCard size={10} strokeWidth={2} /> {accounts.length} kartu
        </span>
      }
    >
      <section className="mt-4 space-y-2">
        {accounts.map((account) => {
          return (
            <div
              key={account.id}
              className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-11 w-16 shrink-0 rounded-[10px] border border-white/20"
                  style={themePreview(account.theme ?? "midnight")}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-white">
                    {account.bank}
                  </p>
                  <p className="mt-0.5 truncate text-[8px] font-medium text-slate-500">
                    {account.cardType || "Debit"} · {account.network} ·{" "}
                    {usage[account.id] ?? 0} transaksi
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-200 tabular-nums">
                    {formatRupiah(account.balance)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(account)}
                    aria-label={`Ubah kartu ${account.bank}`}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.07] bg-white/[0.035] text-slate-400 transition hover:border-sky-200/25 hover:text-white"
                  >
                    <Pencil size={13} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete(account.id);
                      setEditingId(null);
                      setError("");
                    }}
                    aria-label={`Hapus kartu ${account.bank}`}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.07] bg-white/[0.035] text-slate-400 transition hover:border-[#FF9C9C]/30 hover:text-[#FFC2C2]"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {pendingDelete && (
        <section className="mt-4 rounded-[20px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.05] p-3.5">
          <p className="text-[10px] font-semibold text-[#FFD9A8]">
            Hapus kartu ini?
          </p>
          <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
            Saldo dan transaksi akan dipindahkan ke kartu pilihan agar catatan
            tetap seimbang.
          </p>
          {otherAccounts.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {otherAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setTargetId(account.id)}
                  className={`rounded-full border px-3 py-2 text-[9px] font-semibold transition ${
                    targetId === account.id
                      ? "border-sky-200/25 bg-sky-300/[0.1] text-white"
                      : "border-white/[0.07] bg-white/[0.03] text-slate-400"
                  }`}
                >
                  {account.bank}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[8.5px] text-slate-400">
              Kartu “Tanpa kartu” akan dibuat otomatis sebagai pengganti.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="flex-1 rounded-[14px] border border-white/[0.08] bg-white/[0.035] py-2.5 text-[9px] font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-[14px] border border-[#FF9C9C]/25 bg-[#FF9C9C]/10 py-2.5 text-[9px] font-semibold text-[#FFC2C2]"
            >
              Ya, hapus
            </button>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[12px] font-semibold text-white">
            {editing ? `Ubah ${editing.bank}` : "Tambah kartu baru"}
          </h3>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 text-[9px] font-semibold text-glacier/75 transition hover:text-glacier"
            >
              <Plus size={11} /> Kartu baru
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <FormField id="wallet-bank" label="Nama bank / kartu" className="col-span-2">
            <TextInput
              id="wallet-bank"
              value={bank}
              onChange={setBank}
              placeholder="Contoh: BCA, Mandiri, blu"
              maxLength={40}
            />
          </FormField>
          <FormField
            id="wallet-kind"
            label="Keterangan kartu"
            className="col-span-2"
            hint="Contoh: Tahungan Utama, Dana Darurat, Dompet Harian."
          >
            <TextInput
              id="wallet-kind"
              value={kind}
              onChange={setKind}
              placeholder="Keterangan kartu"
              maxLength={24}
            />
          </FormField>
          <FormField id="wallet-holder" label="Nama pemilik">
            <TextInput
              id="wallet-holder"
              value={holder}
              onChange={setHolder}
              placeholder="NAMA PEMILIK"
              maxLength={40}
            />
          </FormField>
          <FormField id="wallet-expiry" label="Berlaku">
            <TextInput
              id="wallet-expiry"
              value={expiry}
              onChange={setExpiry}
              placeholder="MM/YY"
              maxLength={12}
            />
          </FormField>
          <FormField
            id="wallet-number"
            label="Nomor kartu"
            className="col-span-2"
            hint="Isi 4 digit terakhir atau nomor lengkap. ZhKas menyimpan versi tersembunyi, bukan data kartu asli."
          >
            <TextInput
              id="wallet-number"
              value={cardNumber}
              onChange={setCardNumber}
              placeholder="••••  ••••  ••••  8821"
              maxLength={32}
            />
          </FormField>
        </div>

        <div className="mt-2">
          <AmountField
            value={balance}
            onChange={setBalance}
            label="Saldo awal kartu"
            id="wallet-balance"
          />
        </div>

        <div className="mt-4 space-y-4">
          <PillGroup
            label="Jenis kartu"
            options={cardKinds}
            value={cardType}
            onChange={setCardType}
          />
          <PillGroup
            label="Jaringan"
            options={cardNetworks}
            value={network}
            onChange={setNetwork}
          />
        </div>

        <div className="mt-4">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Tampilan kartu
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Object.entries(cardThemes).map(([key, theme]) => {
              const active = themeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setThemeKey(key)}
                  aria-pressed={active}
                  className={`rounded-[14px] border p-1.5 text-left transition ${
                    active
                      ? "border-sky-200/40 bg-sky-300/[0.08]"
                      : "border-white/[0.07] bg-white/[0.02]"
                  }`}
                >
                  <span
                    className="block h-7 w-full rounded-[8px] border border-white/15"
                    style={themePreview(key)}
                  />
                  <span className="mt-1 block truncate text-[7.5px] font-semibold text-slate-400">
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ErrorNote>{error}</ErrorNote>
        <InfoNote tone="good">
          Mengubah nama kartu otomatis memperbarui label transaksi lama, sehingga
          saldo dan riwayat tetap cocok.
        </InfoNote>

        <div className="mt-4 flex gap-2">
          <CancelButton onClick={onClose}>Tutup</CancelButton>
          <SubmitButton>{editing ? "Simpan perubahan" : "Tambah kartu"}</SubmitButton>
        </div>
      </form>
    </SheetShell>
  );
}
