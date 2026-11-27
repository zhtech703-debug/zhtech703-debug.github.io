import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Landmark,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { useFinance } from "../lib/store";
import {
  DEBT_DIRECTIONS,
  debtDueMeta,
  debtIsPaid,
  debtOutstanding,
  debtPaid,
  debtTotals,
  sortDebts,
} from "../lib/debts";
import { formatFullDate, formatRupiah, formatRupiahCompact } from "../lib/format";
import {
  AccountPicker,
  AmountField,
  CancelButton,
  ErrorNote,
  FormField,
  InfoNote,
  PillGroup,
  SheetShell,
  SubmitButton,
  TextInput,
  Toggle,
  parseDateInput,
  toDateInputValue,
} from "./SheetKit";

const filters = [
  { id: "all", label: "Semua" },
  { id: "receivable", label: "Piutang" },
  { id: "payable", label: "Hutang" },
  { id: "paid", label: "Lunas" },
];

export default function Debts({ onNotify }) {
  const {
    accounts,
    addDebt,
    addDebtPayment,
    debts,
    deleteDebt,
    transactions,
  } = useFinance();
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState(null);
  const [detailDebt, setDetailDebt] = useState(null);

  const totals = useMemo(() => debtTotals(debts), [debts]);
  const sorted = useMemo(() => sortDebts(debts), [debts]);
  const filtered = useMemo(() => {
    if (filter === "paid") return sorted.filter(debtIsPaid);
    if (filter === "all") return sorted;
    return sorted.filter(
      (debt) => debt.direction === filter && !debtIsPaid(debt),
    );
  }, [filter, sorted]);

  const counts = {
    all: debts.length,
    receivable: debts.filter(
      (debt) => debt.direction === "receivable" && !debtIsPaid(debt),
    ).length,
    payable: debts.filter(
      (debt) => debt.direction === "payable" && !debtIsPaid(debt),
    ).length,
    paid: debts.filter(debtIsPaid).length,
  };

  const composition =
    totals.receivable + totals.payable > 0
      ? (totals.receivable / (totals.receivable + totals.payable)) * 100
      : 50;

  function handleAdded(debt) {
    setAddOpen(false);
    onNotify(
      `${DEBT_DIRECTIONS[debt.direction].label} ${debt.counterparty} ${formatRupiah(debt.amount)} dicatat.`,
    );
  }

  function handlePaid(result, debt) {
    setPaymentDebt(null);
    setDetailDebt(null);
    if (result.remaining <= 0) {
      onNotify(`Lunas! ${DEBT_DIRECTIONS[debt.direction].label} ${debt.counterparty} selesai.`);
    } else {
      onNotify(
        `Pelunasan ${formatRupiah(result.payment.amount)} tersimpan · sisa ${formatRupiah(result.remaining)}.`,
      );
    }
  }

  function handleDelete(debt) {
    deleteDebt(debt.id);
    setDetailDebt(null);
    onNotify(`Catatan ${debt.counterparty} dihapus.`);
  }

  return (
    <div className="fold-column min-h-full">
      <header className="px-5 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Pinjam-meminjam</p>
            <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-white">
              Hutang<span className="text-glacier">.</span>
            </h1>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              Piutang &amp; kewajiban, terpisah dari saldo kas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-1 flex items-center gap-1.5 rounded-full border border-sky-200/15 bg-sky-300/[0.08] py-2 pl-2.5 pr-3.5 text-[9px] font-semibold text-glacier transition hover:bg-sky-300/[0.13] active:scale-95"
          >
            <Plus size={13} strokeWidth={2.2} />
            Catat
          </button>
        </div>
      </header>

      <section className="mt-6 px-5">
        <div className="relative overflow-hidden rounded-[30px] border border-sky-200/[0.11] bg-[linear-gradient(145deg,#102D50_0%,#0A1D34_48%,#07111F_100%)] p-5 shadow-[0_30px_60px_-34px_rgba(0,0,0,.9)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.075] bg-white/[0.045] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              <Wallet size={11} strokeWidth={1.9} className="text-glacier" />
              Posisi bersih
            </span>
            <p
              className={`mt-4 text-[26px] font-semibold leading-none tracking-[-0.045em] tabular-nums ${
                totals.net < 0 ? "text-[#FFD9A8]" : "text-white"
              }`}
            >
              {formatRupiah(totals.net)}
            </p>
            <p className="mt-1.5 text-[9px] font-medium text-slate-400">
              Piutang dikurangi hutang berjalan
            </p>

            <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#4BD8A6,#A5F3D3)]"
                style={{ width: `${composition}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
              <div>
                <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-mint/75">
                  <ArrowDownLeft size={10} strokeWidth={2.2} />
                  Piutang · memberi
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-100 tabular-nums">
                  {formatRupiah(totals.receivable)}
                </p>
                <p className="mt-0.5 text-[8px] text-slate-500">
                  {totals.receivableCount} catatan berjalan
                </p>
              </div>
              <div className="border-l border-white/[0.07] pl-3">
                <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-[#FFCE8F]/80">
                  <ArrowUpRight size={10} strokeWidth={2.2} />
                  Hutang · menerima
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-100 tabular-nums">
                  {formatRupiah(totals.payable)}
                </p>
                <p className="mt-0.5 text-[8px] text-slate-500">
                  {totals.payableCount} catatan berjalan
                </p>
              </div>
            </div>

            {(totals.overdueCount > 0 || totals.dueSoonCount > 0) && (
              <div className="mt-3 flex items-center gap-1.5 rounded-[13px] border border-[#FFCE8F]/15 bg-[#FFCE8F]/[0.06] px-2.5 py-2 text-[8.5px] font-medium text-[#FFD9A8]">
                <AlertTriangle size={11} strokeWidth={2} className="shrink-0" />
                {totals.overdueCount > 0
                  ? `${totals.overdueCount} catatan lewat jatuh tempo`
                  : `${totals.dueSoonCount} catatan jatuh tempo minggu ini`}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="app-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5">
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? "border-transparent bg-[#CDEEFF] text-[#07131F] shadow-[0_7px_22px_-10px_rgba(174,227,255,.7)]"
                    : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-slate-200"
                }`}
              >
                {item.label}
                <span
                  className={`ml-1.5 text-[8px] ${
                    active ? "text-[#07131F]/55" : "text-slate-600"
                  }`}
                >
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-4 px-5">
        {filtered.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-white/[0.09] bg-white/[0.018] px-6 py-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-[17px] border border-white/[0.06] bg-white/[0.035] text-slate-500">
              <Wallet size={20} strokeWidth={1.6} />
            </span>
            <p className="mt-4 text-[12px] font-semibold text-slate-200">
              {filter === "paid" ? "Belum ada catatan lunas" : "Belum ada catatan"}
            </p>
            <p className="mx-auto mt-1.5 max-w-[230px] text-[9.5px] leading-relaxed text-slate-500">
              Catat uang yang kamu pinjamkan atau pinjaman yang kamu terima agar
              tidak lupa pelunasannya.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-4 rounded-full border border-sky-200/15 bg-sky-300/[0.08] px-4 py-2 text-[9px] font-semibold text-glacier transition hover:bg-sky-300/[0.13]"
            >
              Catat sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onOpen={() => setDetailDebt(debt)}
                onPay={() => setPaymentDebt(debt)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[23px] border border-white/[0.065] bg-white/[0.022] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] border border-mint/[0.12] bg-mint/[0.07] text-mint">
              <ShieldCheck size={15} strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-slate-200">
                Pencatatan yang aman
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                Catatan hutang tersimpan lokal. Kamu bisa memilih untuk
                mencatatnya ke kas agar saldo rekening ikut menyesuaikan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <AddDebtSheet
        open={addOpen}
        accounts={accounts}
        onClose={() => setAddOpen(false)}
        onSaved={handleAdded}
        addDebt={addDebt}
      />
      <PaymentSheet
        debt={paymentDebt}
        accounts={accounts}
        onClose={() => setPaymentDebt(null)}
        onSaved={handlePaid}
        addDebtPayment={addDebtPayment}
      />
      <DebtDetailSheet
        debt={detailDebt}
        transactions={transactions}
        onClose={() => setDetailDebt(null)}
        onPay={() => {
          setPaymentDebt(detailDebt);
          setDetailDebt(null);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}

function DebtCard({ debt, onOpen, onPay }) {
  const meta = DEBT_DIRECTIONS[debt.direction];
  const paid = debtPaid(debt);
  const outstanding = debtOutstanding(debt);
  const due = debtDueMeta(debt);
  const isPaid = outstanding <= 0;
  const percent = Math.min(Math.round((paid / debt.amount) * 100), 100);
  const DirectionIcon =
    debt.direction === "receivable" ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="overflow-hidden rounded-[23px] border border-white/[0.065] bg-[linear-gradient(155deg,rgba(255,255,255,.042),rgba(255,255,255,.015))]">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-start gap-3 p-4 text-left transition hover:bg-white/[0.02]"
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-white/[0.055]"
          style={{ background: meta.soft, color: meta.accent }}
        >
          <DirectionIcon size={17} strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-slate-100">
                {debt.counterparty}
              </p>
              <p className="mt-0.5 truncate text-[8.5px] font-medium text-slate-500">
                {meta.label} · {meta.helper}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`text-[13px] font-semibold tabular-nums ${
                  isPaid ? "text-mint" : "text-white"
                }`}
              >
                {isPaid ? "Lunas" : formatRupiah(outstanding)}
              </p>
              <p className="mt-0.5 text-[8px] text-slate-600">
                dari {formatRupiahCompact(debt.amount)}
              </p>
            </div>
          </div>

          <div className="mt-2.5 h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${
                isPaid
                  ? "bg-[linear-gradient(90deg,#4BD8A6,#A5F3D3)]"
                  : "bg-[linear-gradient(90deg,#4BBDF7,#D2F2FF)]"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                due.tone === "danger"
                  ? "bg-[#FF9C9C]/10 text-[#FFC2C2]"
                  : due.tone === "warning"
                    ? "bg-[#FFCE8F]/10 text-[#FFD9A8]"
                    : due.tone === "success"
                      ? "bg-mint/[0.09] text-mint"
                      : "bg-white/[0.04] text-slate-500"
              }`}
            >
              {due.tone === "danger" ? (
                <AlertTriangle size={9} strokeWidth={2.2} />
              ) : due.tone === "success" ? (
                <CheckCircle2 size={9} strokeWidth={2.2} />
              ) : (
                <Clock3 size={9} strokeWidth={2.2} />
              )}
              {due.label}
            </span>
            <span className="text-[8px] font-medium text-slate-600">
              {paid > 0 ? `${formatRupiahCompact(paid)} dibayar` : "Belum ada pelunasan"}
            </span>
          </div>
        </div>

        <ChevronRight
          size={14}
          className="mt-1 shrink-0 text-slate-700 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
        />
      </button>

      {!isPaid && (
        <div className="flex items-center gap-2 border-t border-white/[0.05] px-4 py-2.5">
          <button
            type="button"
            onClick={onPay}
            className="flex items-center gap-1 rounded-full border border-sky-200/15 bg-sky-300/[0.07] px-3 py-1.5 text-[8.5px] font-semibold text-glacier transition hover:bg-sky-300/[0.12]"
          >
            <Wallet size={10} strokeWidth={2} />
            Catat pelunasan
          </button>
          <span className="text-[8px] font-medium text-slate-600">
            Sisa {formatRupiah(outstanding)}
          </span>
        </div>
      )}
    </div>
  );
}

function AddDebtSheet({ open, accounts, onClose, onSaved, addDebt }) {
  const [direction, setDirection] = useState("receivable");
  const [counterparty, setCounterparty] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [dateValue, setDateValue] = useState(toDateInputValue(new Date()));
  const [dueDateValue, setDueDateValue] = useState("");
  const [note, setNote] = useState("");
  const [recordCash, setRecordCash] = useState(true);
  const [account, setAccount] = useState(accounts[0]?.bank ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDirection("receivable");
    setCounterparty("");
    setAmountDigits("");
    setDateValue(toDateInputValue(new Date()));
    setDueDateValue("");
    setNote("");
    setRecordCash(true);
    setAccount(accounts[0]?.bank ?? "");
    setError("");
  }, [open, accounts]);

  const amount = Number(amountDigits || 0);
  const isValid =
    counterparty.trim().length > 0 &&
    amount > 0 &&
    (!recordCash || Boolean(account));

  function handleSubmit(event) {
    event.preventDefault();
    if (!counterparty.trim()) {
      setError("Isi nama pihak yang terlibat.");
      return;
    }
    if (amount <= 0) {
      setError("Nominal harus lebih dari Rp0.");
      return;
    }

    const debt = addDebt({
      direction,
      counterparty,
      amount,
      date: parseDateInput(dateValue) ?? new Date(),
      dueDate: parseDateInput(dueDateValue),
      note,
      recordCash,
      account,
    });

    if (!debt) {
      setError("Catatan belum bisa disimpan. Cek kembali datanya.");
      return;
    }
    onSaved(debt);
  }

  return (
    <SheetShell
      open={open}
      onClose={onClose}
      label="Catat hutang atau piutang"
      title="Catat hutang"
      subtitle="Pisahkan piutang (kamu memberi) dan hutang (kamu menerima) agar posisi keuangan jelas."
      badge={
        <span className="inline-flex items-center gap-1 rounded-full border border-mint/[0.14] bg-mint/[0.07] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-mint">
          <ShieldCheck size={10} strokeWidth={2.1} />
          Tersimpan lokal
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid grid-cols-2 gap-1.5 rounded-[18px] border border-white/[0.06] bg-white/[0.028] p-1.5">
          {Object.entries(DEBT_DIRECTIONS).map(([id, meta]) => {
            const active = direction === id;
            const Icon = id === "receivable" ? ArrowDownLeft : ArrowUpRight;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDirection(id);
                  setError("");
                }}
                aria-pressed={active}
                className={`rounded-[13px] px-2 py-2.5 text-left transition ${
                  active
                    ? "bg-[#CFEDFF] text-[#07131F] shadow-[0_8px_22px_-12px_rgba(180,228,255,.9)]"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold">
                  <Icon size={13} strokeWidth={2.2} />
                  {meta.short}
                </span>
                <span
                  className={`mt-0.5 block text-[8px] font-medium ${
                    active ? "text-[#07131F]/65" : "text-slate-600"
                  }`}
                >
                  {meta.helper}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <AmountField
            value={amountDigits}
            onChange={(next) => {
              setAmountDigits(next);
              setError("");
            }}
            label={direction === "receivable" ? "Nominal yang dipinjamkan" : "Nominal yang dipinjam"}
            quickAmounts={[100_000, 250_000, 500_000, 1_000_000]}
          />
        </div>

        <div className="mt-3">
          <FormField id="debt-party" label="Pihak" icon={Landmark}>
            <TextInput
              id="debt-party"
              value={counterparty}
              onChange={(value) => {
                setCounterparty(value);
                setError("");
              }}
              placeholder={direction === "receivable" ? "Contoh: Bagas" : "Contoh: Kas kantor"}
              maxLength={60}
            />
          </FormField>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <FormField id="debt-date" label="Tanggal" icon={CalendarDays}>
            <input
              id="debt-date"
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="mt-1 w-full bg-transparent text-[10px] font-medium text-slate-200 outline-none"
            />
          </FormField>
          <FormField id="debt-due" label="Jatuh tempo" icon={Clock3}>
            <input
              id="debt-due"
              type="date"
              value={dueDateValue}
              onChange={(event) => setDueDateValue(event.target.value)}
              className="mt-1 w-full bg-transparent text-[10px] font-medium text-slate-200 outline-none"
            />
          </FormField>
        </div>

        <div className="mt-3">
          <FormField id="debt-note" label="Catatan" icon={Wallet}>
            <TextInput
              id="debt-note"
              value={note}
              onChange={setNote}
              placeholder="Opsional · misalnya talangan servis motor"
              maxLength={120}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <Toggle
            checked={recordCash}
            onChange={setRecordCash}
            label="Catat ke kas"
            description={
              direction === "receivable"
                ? "Saldo rekening berkurang saat uang dipinjamkan."
                : "Saldo rekening bertambah saat pinjaman diterima."
            }
          />
          {recordCash && (
            <div className="mt-2">
              <AccountPicker
                accounts={accounts}
                value={account}
                onChange={setAccount}
              />
            </div>
          )}
        </div>

        {recordCash && amount > 0 && (
          <InfoNote>
            {direction === "receivable"
              ? `Saldo ${account} akan berkurang ${formatRupiah(amount)} dan tercatat sebagai pengeluaran Hutang & Piutang.`
              : `Saldo ${account} akan bertambah ${formatRupiah(amount)} dan tercatat sebagai pemasukan Hutang & Piutang.`}
          </InfoNote>
        )}

        <ErrorNote>{error}</ErrorNote>

        <div className="mt-5 flex items-center gap-2.5">
          <CancelButton onClick={onClose} />
          <SubmitButton disabled={!isValid}>Simpan catatan</SubmitButton>
        </div>
      </form>
    </SheetShell>
  );
}

function PaymentSheet({ debt, accounts, onClose, onSaved, addDebtPayment }) {
  const [amountDigits, setAmountDigits] = useState("");
  const [dateValue, setDateValue] = useState(toDateInputValue(new Date()));
  const [note, setNote] = useState("");
  const [recordCash, setRecordCash] = useState(true);
  const [account, setAccount] = useState(accounts[0]?.bank ?? "");
  const [error, setError] = useState("");

  const outstanding = debt ? debtOutstanding(debt) : 0;

  useEffect(() => {
    if (!debt) return;
    setAmountDigits(String(outstanding));
    setDateValue(toDateInputValue(new Date()));
    setNote("");
    setRecordCash(true);
    setAccount(accounts[0]?.bank ?? "");
    setError("");
  }, [debt, outstanding, accounts]);

  if (!debt) return null;

  const meta = DEBT_DIRECTIONS[debt.direction];
  const amount = Math.min(Number(amountDigits || 0), outstanding);
  const isValid = amount > 0 && (!recordCash || Boolean(account));
  const isReceivable = debt.direction === "receivable";

  function handleSubmit(event) {
    event.preventDefault();
    if (amount <= 0) {
      setError("Nominal pelunasan harus lebih dari Rp0.");
      return;
    }

    const result = addDebtPayment(debt.id, {
      amount,
      date: parseDateInput(dateValue) ?? new Date(),
      note,
      recordCash,
      account,
    });

    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result, debt);
  }

  return (
    <SheetShell
      open={Boolean(debt)}
      onClose={onClose}
      label={`Pelunasan ${debt.counterparty}`}
      title="Catat pelunasan"
      subtitle={`${meta.label} ${debt.counterparty} · sisa ${formatRupiah(outstanding)}`}
      badge={
        <span
          className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em]"
          style={{ background: meta.soft, color: meta.accent }}
        >
          {isReceivable ? (
            <ArrowDownLeft size={10} strokeWidth={2.2} />
          ) : (
            <ArrowUpRight size={10} strokeWidth={2.2} />
          )}
          {meta.helper}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="mt-4">
        <AmountField
          value={amountDigits}
          onChange={(next) => {
            setAmountDigits(next);
            setError("");
          }}
          label="Nominal pelunasan"
          quickAmounts={[
            { label: "25%", value: Math.round(outstanding * 0.25) },
            { label: "50%", value: Math.round(outstanding * 0.5) },
            { label: "Lunas", value: outstanding },
          ]}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <FormField id="pay-date" label="Tanggal" icon={CalendarDays}>
            <input
              id="pay-date"
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="mt-1 w-full bg-transparent text-[10px] font-medium text-slate-200 outline-none"
            />
          </FormField>
          <FormField id="pay-note" label="Catatan" icon={Wallet}>
            <TextInput
              id="pay-note"
              value={note}
              onChange={setNote}
              placeholder="Transfer, tunai…"
              maxLength={80}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <Toggle
            checked={recordCash}
            onChange={setRecordCash}
            label="Catat ke kas"
            description={
              isReceivable
                ? "Uang yang diterima menambah saldo rekening."
                : "Uang yang dibayarkan mengurangi saldo rekening."
            }
          />
          {recordCash && (
            <div className="mt-2">
              <AccountPicker
                accounts={accounts}
                value={account}
                onChange={setAccount}
              />
            </div>
          )}
        </div>

        <InfoNote>
          Sisa setelah pelunasan:{" "}
          <span className="font-semibold text-slate-200">
            {formatRupiah(Math.max(outstanding - amount, 0))}
          </span>
          {amount >= outstanding ? " · catatan akan lunas." : ""}
        </InfoNote>

        <ErrorNote>{error}</ErrorNote>

        <div className="mt-5 flex items-center gap-2.5">
          <CancelButton onClick={onClose} />
          <SubmitButton disabled={!isValid} tone={isReceivable ? "mint" : "gold"}>
            Simpan pelunasan
          </SubmitButton>
        </div>
      </form>
    </SheetShell>
  );
}

function DebtDetailSheet({ debt, transactions, onClose, onPay, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
  }, [debt]);

  if (!debt) return null;

  const meta = DEBT_DIRECTIONS[debt.direction];
  const paid = debtPaid(debt);
  const outstanding = debtOutstanding(debt);
  const due = debtDueMeta(debt);
  const percent = Math.min(Math.round((paid / debt.amount) * 100), 100);
  const linked = transactions.filter((item) => item.debtId === debt.id);
  const DirectionIcon =
    debt.direction === "receivable" ? ArrowDownLeft : ArrowUpRight;
  const payments = [...(debt.payments ?? [])].sort((a, b) => b.date - a.date);

  return (
    <SheetShell
      open={Boolean(debt)}
      onClose={onClose}
      label={`Detail ${debt.counterparty}`}
      zIndex="z-[95]"
    >
      <div className="flex flex-col items-center pt-3 text-center">
        <span
          className="grid h-16 w-16 place-items-center rounded-[22px] border border-white/[0.07]"
          style={{ background: meta.soft, color: meta.accent }}
        >
          <DirectionIcon size={26} strokeWidth={1.9} />
        </span>
        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {meta.label} · {meta.helper}
        </p>
        <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-white">
          {debt.counterparty}
        </h2>
        <p
          className={`mt-2 text-[28px] font-semibold leading-none tracking-[-0.055em] tabular-nums ${
            outstanding <= 0 ? "text-mint" : "text-white"
          }`}
        >
          {outstanding <= 0 ? "Lunas" : formatRupiah(outstanding)}
        </p>
        <p className="mt-1.5 text-[9px] text-slate-500">
          dari total {formatRupiah(debt.amount)}
        </p>
        <span
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8.5px] font-semibold ${
            due.tone === "danger"
              ? "bg-[#FF9C9C]/10 text-[#FFC2C2]"
              : due.tone === "warning"
                ? "bg-[#FFCE8F]/10 text-[#FFD9A8]"
                : due.tone === "success"
                  ? "bg-mint/[0.09] text-mint"
                  : "bg-white/[0.04] text-slate-400"
          }`}
        >
          <Clock3 size={10} strokeWidth={2.2} />
          {due.label}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-[6px] overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#4BBDF7,#D2F2FF)]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[8px] font-medium text-slate-600">
          <span>{formatRupiah(paid)} dibayar</span>
          <span>{percent}%</span>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-white/[0.065] bg-white/[0.022]">
        <DetailRow label="Arah" value={meta.label} />
        <DetailRow label="Tanggal dicatat" value={formatFullDate(debt.date)} />
        <DetailRow
          label="Jatuh tempo"
          value={debt.dueDate ? formatFullDate(debt.dueDate) : "Tidak diatur"}
        />
        <DetailRow label="Dibayar" value={formatRupiah(paid)} />
        <DetailRow label="Sisa" value={formatRupiah(outstanding)} />
      </div>

      {debt.note && (
        <div className="mt-3 rounded-[20px] border border-white/[0.055] bg-white/[0.02] px-4 py-3">
          <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-600">
            Catatan
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-300">
            {debt.note}
          </p>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-200">
            Riwayat pelunasan
          </p>
          <span className="text-[8px] font-medium text-slate-600">
            {payments.length} catatan
          </span>
        </div>
        {payments.length === 0 ? (
          <p className="mt-2 rounded-[16px] border border-dashed border-white/[0.08] px-3 py-4 text-center text-[8.5px] text-slate-600">
            Belum ada pelunasan.
          </p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-[18px] border border-white/[0.06] bg-white/[0.02]">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-3.5 py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[9.5px] font-semibold text-slate-200">
                    {formatRupiah(payment.amount)}
                  </p>
                  <p className="mt-0.5 truncate text-[8px] text-slate-600">
                    {formatFullDate(payment.date)} · {payment.note}
                  </p>
                </div>
                <CheckCircle2 size={13} className="shrink-0 text-mint" />
              </div>
            ))}
          </div>
        )}
      </div>

      {outstanding > 0 && (
        <button
          type="button"
          onClick={onPay}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#CFEDFF] py-3 text-[9.5px] font-bold text-[#07131F] transition hover:bg-[#E2F6FF] active:scale-[0.98]"
        >
          <Wallet size={13} strokeWidth={2.2} />
          Tambah pelunasan
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-2.5 w-full rounded-[16px] border border-white/[0.08] bg-white/[0.035] py-3 text-[9px] font-semibold text-slate-300 transition hover:bg-white/[0.06]"
      >
        Tutup detail
      </button>

      <button
        type="button"
        onClick={() => {
          if (confirmingDelete) {
            onDelete(debt);
            return;
          }
          setConfirmingDelete(true);
        }}
        className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[16px] border py-3 text-[9px] font-semibold transition active:scale-[0.98] ${
          confirmingDelete
            ? "border-[#FF9C9C]/30 bg-[#FF9C9C]/[0.1] text-[#FFC2C2]"
            : "border-white/[0.06] bg-transparent text-slate-500 hover:border-white/[0.12] hover:text-slate-300"
        }`}
      >
        <Trash2 size={12} strokeWidth={1.9} />
        {confirmingDelete
          ? "Tekan sekali lagi untuk menghapus"
          : "Hapus catatan ini"}
      </button>
      <p className="mt-2 text-center text-[8px] font-medium leading-relaxed text-slate-600">
        {linked.length > 0
          ? `${linked.length} transaksi kas terkait akan ikut dihapus dan saldo disesuaikan.`
          : "Penghapusan hanya berlaku di perangkat ini."}
      </p>
    </SheetShell>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] px-4 py-3 last:border-b-0">
      <span className="text-[9px] font-medium text-slate-500">{label}</span>
      <span className="text-right text-[9.5px] font-semibold text-slate-200">
        {value}
      </span>
    </div>
  );
}
