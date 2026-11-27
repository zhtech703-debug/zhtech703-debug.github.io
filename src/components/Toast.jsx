import { Check } from "lucide-react";

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[106px] z-[90] flex justify-center px-6"
      aria-live="polite"
      role="status"
    >
      <div
        key={toast.id}
        className="toast-in flex max-w-[320px] items-center gap-2.5 rounded-full border border-white/[0.1] bg-[#101927]/95 py-2.5 pl-2.5 pr-4 shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-glacier text-[#06131F]">
          <Check size={13} strokeWidth={2.8} />
        </span>
        <p className="text-[9.5px] font-medium leading-snug text-slate-200">
          {toast.message}
        </p>
      </div>
    </div>
  );
}
