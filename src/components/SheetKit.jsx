import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

export function toDateInputValue(date) {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function parseDateInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const now = new Date();
  const date = new Date(year, month - 1, day, now.getHours(), now.getMinutes());
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDigits(digits) {
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function SheetShell({
  open,
  onClose,
  label,
  title,
  subtitle,
  badge,
  children,
  zIndex = "z-[96]",
  maxHeight = "94%",
}) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={`sheet-layer fixed inset-0 ${zIndex} flex flex-col justify-end`}>
      <button
        type="button"
        aria-label={`Tutup ${label ?? "panel"}`}
        onClick={onClose}
        className="backdrop-in absolute inset-0 bg-[#02050A]/80 backdrop-blur-[3px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        className="sheet-up sheet-panel app-scroll relative overflow-y-auto overscroll-contain rounded-t-[34px] border-t border-white/[0.18] bg-[#080D16]/72 pb-8 shadow-[0_-30px_80px_rgba(0,0,0,.6)] backdrop-blur-2xl"
        style={{ maxHeight }}
      >
        <div className="sheet-grabber sticky top-0 z-20 flex justify-center bg-gradient-to-b from-[#080D16] via-[#080D16] to-transparent pb-2 pt-3">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 z-30 grid h-8 w-8 place-items-center rounded-full border border-white/[0.07] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X size={14} strokeWidth={2} />
        </button>

        <div className="px-5 pt-2">
          {badge}
          {title && (
            <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em] text-white">
              {title}
              <span className="text-glacier">.</span>
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-[9.5px] font-medium leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function FormField({
  id,
  label,
  icon: Icon,
  children,
  className = "",
  hint,
}) {
  return (
    <div
      className={`rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 transition focus-within:border-sky-200/25 ${className}`}
    >
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500"
      >
        {Icon && <Icon size={11} strokeWidth={1.9} />}
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[8px] leading-relaxed text-slate-600">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ id, value, onChange, placeholder, maxLength = 80, type = "text" }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
      className="mt-1.5 w-full bg-transparent text-[12px] font-medium text-white outline-none placeholder:text-slate-600"
    />
  );
}

export function AmountField({
  value,
  onChange,
  label = "Nominal",
  quickAmounts = [],
  id = "sheet-amount",
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.075] bg-[linear-gradient(150deg,rgba(255,255,255,.05),rgba(255,255,255,.015))] px-4 py-4">
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[14px] font-medium text-slate-500">Rp</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={formatDigits(value)}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, 12))
          }
          placeholder="0"
          className="w-full bg-transparent text-[30px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums outline-none placeholder:text-slate-700"
        />
      </div>
      {quickAmounts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quickAmounts.map((quick) => (
            <button
              key={quick.value ?? quick}
              type="button"
              onClick={() => onChange(String(quick.value ?? quick))}
              className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[8.5px] font-semibold text-slate-400 transition hover:border-sky-200/20 hover:text-white"
            >
              {quick.label ?? new Intl.NumberFormat("id-ID").format(quick)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PillGroup({ options, value, onChange, label }) {
  return (
    <div>
      {label && (
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-2 text-[9px] font-semibold transition active:scale-[0.97] ${
                active
                  ? "border-sky-200/25 bg-sky-300/[0.1] text-white"
                  : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[9.5px] font-medium text-slate-300">{label}</p>
        {description && (
          <p className="mt-0.5 text-[8px] leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          checked
            ? "border-sky-200/30 bg-sky-300/80"
            : "border-white/[0.09] bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
            checked ? "left-[26px]" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function SubmitButton({ children, disabled, onClick, type = "submit", tone = "glacier" }) {
  const palette =
    tone === "gold"
      ? "bg-[#FFCE8F] text-[#2A1A05] hover:bg-[#FFDCA8]"
      : tone === "mint"
        ? "bg-mint text-[#04140F] hover:bg-[#8FF0D0]"
        : "accent-submit";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-[16px] py-3.5 text-[9.5px] font-bold transition active:scale-[0.98] ${
        disabled
          ? "cursor-not-allowed bg-white/[0.05] text-slate-600"
          : palette
      }`}
    >
      <Check size={13} strokeWidth={2.6} />
      {children}
    </button>
  );
}

export function CancelButton({ children = "Batal", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-4 py-3.5 text-[9.5px] font-semibold text-slate-300 transition hover:bg-white/[0.06] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="mt-3 rounded-[14px] border border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.07] px-3 py-2 text-[8.5px] font-medium leading-relaxed text-[#FFD9A8]"
    >
      {children}
    </p>
  );
}

export function InfoNote({ children, tone = "neutral" }) {
  const palette =
    tone === "good"
      ? "border-mint/[0.15] bg-mint/[0.06] text-mint"
      : tone === "warning"
        ? "border-[#FFCE8F]/20 bg-[#FFCE8F]/[0.06] text-[#FFD9A8]"
        : "border-white/[0.06] bg-white/[0.02] text-slate-500";
  return (
    <p
      className={`mt-3 rounded-[14px] border px-3 py-2 text-[8.5px] font-medium leading-relaxed ${palette}`}
    >
      {children}
    </p>
  );
}

export function AccountPicker({ accounts, value, onChange }) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Rekening kas
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {accounts.map((account) => {
          const active = value === account.bank;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onChange(account.bank)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-2 text-[9px] font-semibold transition ${
                active
                  ? "border-sky-200/25 bg-sky-300/[0.1] text-white"
                  : "border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12]"
              }`}
            >
              {account.bank}
            </button>
          );
        })}
      </div>
    </div>
  );
}
