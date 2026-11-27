export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[13px] border border-white/30 bg-[linear-gradient(145deg,#d9f3ff_0%,#92d4ff_38%,#4b91ff_100%)] shadow-[0_8px_24px_-8px_rgba(96,183,255,.8),inset_0_1px_0_rgba(255,255,255,.7)]">
        <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/50 blur-[5px]" />
        <span className="relative -skew-x-6 text-[17px] font-extrabold tracking-[-0.12em] text-[#061423]">
          Z
        </span>
      </div>
      <div>
        <p className="text-[15px] font-semibold leading-none tracking-[-0.035em] text-white">
          ZhKas<span className="text-glacier">.</span>
        </p>
        <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.23em] text-slate-500">
          Personal finance
        </p>
      </div>
    </div>
  );
}
