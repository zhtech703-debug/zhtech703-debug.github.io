import {
  ArrowLeftRight,
  BookOpen,
  LayoutDashboard,
  PieChart,
  Settings as SettingsIcon,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Beranda", icon: LayoutDashboard },
  { id: "transactions", label: "Transaksi", icon: ArrowLeftRight },
  { id: "recap", label: "Rekap", icon: PieChart },
  { id: "debts", label: "Hutang", icon: BookOpen },
  { id: "settings", label: "Atur", icon: SettingsIcon },
];

export default function BottomNav({ activeTab, onChange, wide = false }) {
  const index = Math.max(
    tabs.findIndex((tab) => tab.id === activeTab),
    0,
  );

  const indicatorStyle = wide
    ? {
        top: 6,
        left: 6,
        right: 6,
        bottom: "auto",
        width: "calc(100% - 12px)",
        height: "calc((100% - 12px) / 5)",
        transform: `translate3d(0, ${index * 100}%, 0)`,
      }
    : {
        transform: `translate3d(${index * 100}%, 0, 0)`,
      };

  return (
    <nav
      aria-label="Navigasi utama"
      className={`main-nav glass-dock relative rounded-[25px] p-1.5 ${
        wide ? "h-[330px] w-full" : ""
      }`}
    >
      <div
        aria-hidden="true"
        className="nav-indicator absolute inset-y-1.5 left-1.5 w-[calc((100%_-_20px)/5)] rounded-[19px] border transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={indicatorStyle}
      />
      <div
        className={`relative grid ${
          wide ? "h-full grid-cols-1 grid-rows-5" : "grid-cols-5"
        }`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 items-center rounded-[19px] transition-colors duration-300 ${
                wide
                  ? "min-h-[44px] justify-start gap-3 px-3.5 text-[11px]"
                  : "flex-col justify-center gap-1 px-0.5 py-2 text-[9px] leading-none"
              } ${
                active ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon
                size={wide ? 17 : 16}
                strokeWidth={active ? 2.2 : 1.8}
                className={active ? "nav-icon-active" : ""}
              />
              <span className="block max-w-full truncate font-semibold tracking-[0.015em]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
