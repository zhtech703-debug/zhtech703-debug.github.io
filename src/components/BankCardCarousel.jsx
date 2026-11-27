import { useRef, useState } from "react";
import { CreditCard, Wifi } from "lucide-react";
import { useFinance } from "../lib/store";
import { formatRupiah } from "../lib/format";

function NetworkMark({ network }) {
  const value = String(network ?? "GPN").toUpperCase();

  if (value === "VISA") {
    return (
      <span className="font-sans text-[15px] font-extrabold italic tracking-[-0.06em] text-white/85">
        VISA
      </span>
    );
  }

  if (value === "MASTERCARD") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-[0.04em] text-white/80">
        <span className="h-3 w-3 rounded-full bg-[#EB001B]" />
        <span className="-ml-2 h-3 w-3 rounded-full bg-[#F79E1B]/90" />
        MC
      </span>
    );
  }

  return (
    <span className="text-[11px] font-extrabold tracking-[0.08em] text-white/75">
      {value}
    </span>
  );
}

function BankCard({ account, showBalance }) {
  return (
    <article
      className="bank-card relative h-[224px] select-none overflow-hidden rounded-[30px] border border-white/[0.14] px-5 py-5 shadow-[0_28px_50px_-26px_rgba(0,0,0,0.95)]"
      style={{ backgroundImage: account.background }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full blur-3xl"
        style={{ background: account.glow }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full border border-white/[0.08]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-white/[0.06]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,transparent_12%,rgba(255,255,255,0.07)_48%,transparent_56%)]"
      />
      <div aria-hidden="true" className="card-noise pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: account.accent,
                  boxShadow: `0 0 12px ${account.accent}`,
                }}
              />
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
                Saldo tersedia
              </p>
            </div>
            <p className="mt-2 flex items-baseline gap-1.5 text-[30px] font-semibold leading-none tracking-[-0.055em] text-white tabular-nums">
              <span className="text-[15px] font-medium tracking-[-0.02em] text-white/60">
                Rp
              </span>
              <span>
                {showBalance
                  ? formatRupiah(account.balance).slice(2)
                  : "•••••••"}
              </span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[17px] font-bold leading-none tracking-[-0.04em] text-white/90">
              {account.bank}
            </p>
            <p className="mt-1.5 text-[8px] font-medium uppercase tracking-[0.16em] text-white/40">
              {account.kind}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative h-[25px] w-[34px] overflow-hidden rounded-[7px] border border-white/25 bg-[linear-gradient(135deg,#ecf5fc_0%,#9db4c8_45%,#d8e7f1_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,.7)]">
                <span className="absolute left-1/2 top-0 h-full w-px bg-[#60768c]/35" />
                <span className="absolute left-0 top-1/2 h-px w-full bg-[#60768c]/35" />
                <span className="absolute left-[31%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[#60768c]/30" />
                <span className="absolute right-[31%] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[#60768c]/30" />
              </div>
              <Wifi
                size={18}
                strokeWidth={1.7}
                className="rotate-90 text-white/55"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded-full border border-white/20 bg-white/10" />
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="max-w-[64px] truncate text-[8px] uppercase tracking-[0.14em] text-white/45">
                {account.cardType || "debit"}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[10px] font-medium tracking-[0.19em] text-white/70 tabular-nums">
            {account.cardNumber}
          </p>

          <div className="mt-3 flex items-end justify-between gap-4 border-t border-white/[0.08] pt-3">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  Pemilik
                </p>
                <p className="mt-1 text-[9px] font-semibold tracking-[0.11em] text-white/75">
                  {account.holder}
                </p>
              </div>
              <div>
                <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  Berlaku
                </p>
                <p className="mt-1 text-[9px] font-semibold tracking-[0.12em] text-white/75 tabular-nums">
                  {account.expiry}
                </p>
              </div>
            </div>
            <NetworkMark network={account.network} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BankCardCarousel({ showBalance }) {
  const { accounts } = useFinance();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const safeIndex = Math.min(activeIndex, Math.max(accounts.length - 1, 0));

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    dragRef.current = {
      startX: event.clientX,
      startedAt: performance.now(),
      width: viewportRef.current?.clientWidth ?? 360,
      offset: 0,
    };
    setIsDragging(true);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic events and some browsers may not allow pointer capture.
    }
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;

    let offset = event.clientX - dragRef.current.startX;
    const atStart = safeIndex === 0 && offset > 0;
    const atEnd = safeIndex === accounts.length - 1 && offset < 0;
    if (atStart || atEnd) offset *= 0.28;

    const limit = dragRef.current.width * 0.92;
    const nextOffset = Math.max(-limit, Math.min(limit, offset));
    dragRef.current.offset = nextOffset;
    setDragOffset(nextOffset);
  }

  function settleCard(event) {
    if (!dragRef.current) return;

    const elapsed = Math.max(performance.now() - dragRef.current.startedAt, 1);
    const finalOffset = dragRef.current.offset;
    const velocity = Math.abs(finalOffset) / elapsed;
    const threshold = Math.min(dragRef.current.width * 0.16, 64);
    let nextIndex = safeIndex;

    if (finalOffset < -threshold || (finalOffset < -22 && velocity > 0.45)) {
      nextIndex = Math.min(safeIndex + 1, accounts.length - 1);
    } else if (
      finalOffset > threshold ||
      (finalOffset > 22 && velocity > 0.45)
    ) {
      nextIndex = Math.max(safeIndex - 1, 0);
    }

    setActiveIndex(nextIndex);
    setDragOffset(0);
    setIsDragging(false);
    dragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture can already be released by the browser.
    }
  }

  function cancelDrag(event) {
    setDragOffset(0);
    setIsDragging(false);
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture can already be released by the browser.
    }
  }

  return (
    <section aria-label="Kartu rekening" className="mt-3.5">
      <div
        ref={viewportRef}
        className="overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={settleCard}
        onPointerCancel={cancelDrag}
      >
        <div
          className="flex will-change-transform"
          style={{
            transform: `translate3d(calc(${-safeIndex * 100}% + ${dragOffset}px), 0, 0)`,
            transition: isDragging
              ? "none"
              : "transform 660ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {accounts.map((account) => (
            <div
              key={account.id}
              className="w-full shrink-0 px-5"
              aria-hidden={account.id !== accounts[safeIndex]?.id}
            >
              <BankCard account={account} showBalance={showBalance} />
            </div>
          ))}
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="mx-5 mt-1 rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.015] px-4 py-6 text-center">
          <CreditCard
            size={18}
            strokeWidth={1.6}
            className="mx-auto text-slate-600"
          />
          <p className="mt-2 text-[10px] font-semibold text-slate-300">
            Belum ada kartu
          </p>
          <p className="mt-1 text-[8.5px] leading-relaxed text-slate-600">
            Buka tab Kartu untuk menambah rekening atau dompet pertama Anda.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          {accounts.map((account, index) => (
            <button
              key={account.id}
              type="button"
              aria-label={`Tampilkan kartu ${account.bank}`}
              aria-pressed={index === safeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === safeIndex
                  ? "w-5 bg-glacier shadow-[0_0_12px_rgba(155,217,255,.55)]"
                  : "w-1.5 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>
        <span className="h-2.5 w-px bg-white/10" />
        <p className="text-[10px] font-medium tabular-nums tracking-[0.08em] text-slate-500">
          {String(safeIndex + 1).padStart(2, "0")}
          <span className="text-slate-700"> / </span>
          {String(accounts.length).padStart(2, "0")}
        </p>
      </div>
    </section>
  );
}
