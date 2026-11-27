import { useEffect, useState } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";

function currentTime() {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(":", ".");
}

export default function StatusBar() {
  const [time, setTime] = useState(currentTime);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(currentTime()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="status-bar relative z-30 flex shrink-0 items-center justify-between px-6 pb-2 pt-3.5 text-[11px] font-semibold tracking-[-0.01em] text-white/90"
    >
      <span className="tabular-nums">{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal size={14} strokeWidth={2.6} />
        <Wifi size={14} strokeWidth={2.6} />
        <BatteryFull size={18} strokeWidth={2.2} className="ml-0.5" />
      </div>
      <div data-status-notch className="pointer-events-none absolute left-1/2 top-2 hidden h-[23px] w-[88px] -translate-x-1/2 rounded-full bg-[#010203] shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] sm:block">
        <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#0d1c2f] shadow-[inset_0_0_2px_rgba(125,211,252,.35)]" />
      </div>
    </div>
  );
}
