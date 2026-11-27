import { useId } from "react";
import { formatRupiah, formatRupiahCompact } from "../lib/format";

/**
 * Grafik SVG ringan tanpa library chart. Semua data berasal dari state lokal
 * sehingga grafik ikut berubah begitu transaksi ditambah atau dihapus.
 */

export function CashflowChart({ data = [], height = 152 }) {
  const gradientId = useId().replace(/:/g, "");
  const width = 320;
  const padding = { top: 14, right: 10, bottom: 22, left: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  const values = data.map((item) => item.cumulative);
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (max === min) {
    max = min + 1;
  }
  const span = max - min;

  const x = (index) =>
    padding.left +
    (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value) =>
    padding.top + (1 - (value - min) / span) * plotHeight;

  const line = data
    .map((item, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(item.cumulative)}`)
    .join(" ");

  const baseline = padding.top + plotHeight;
  const area = `${line} L${x(data.length - 1)},${baseline} L${x(0)},${baseline} Z`;
  const zeroY = y(0);
  const last = data[data.length - 1];
  const positive = last.cumulative >= 0;
  const stroke = positive ? "#8FE4FF" : "#FFCE8F";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Grafik arus kas kumulatif, terakhir ${formatRupiah(last.cumulative)}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={`cash-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`line-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6FB8FF" />
          <stop offset="100%" stopColor="#D2F4FF" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((ratio) => {
        const gridY = padding.top + ratio * plotHeight;
        return (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={gridY}
            y2={gridY}
            stroke="var(--chart-grid, rgba(255,255,255,0.055))"
            strokeDasharray="2 5"
          />
        );
      })}

      {min < 0 && max > 0 && (
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.14)"
          strokeDasharray="3 4"
        />
      )}

      <path d={area} fill={`url(#cash-${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={`url(#line-${gradientId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        className="chart-line"
      />

      {data.map((item, index) =>
        index === data.length - 1 ? (
          <g key={item.date?.toISOString?.() ?? index}>
            <circle
              cx={x(index)}
              cy={y(item.cumulative)}
              r="6"
              fill={stroke}
              opacity="0.18"
            />
            <circle
              cx={x(index)}
              cy={y(item.cumulative)}
              r="2.8"
              fill={stroke}
              stroke="#07131F"
              strokeWidth="1.2"
            />
          </g>
        ) : null,
      )}

      <text
        x={padding.left}
        y={height - 4}
        fill="rgba(148,163,184,0.72)"
        fontSize="8"
      >
        {data[0]?.label}
      </text>
      <text
        x={width / 2}
        y={height - 4}
        textAnchor="middle"
        fill="rgba(148,163,184,0.72)"
        fontSize="8"
      >
        {data[Math.floor((data.length - 1) / 2)]?.label}
      </text>
      <text
        x={width - padding.right}
        y={height - 4}
        textAnchor="end"
        fill="rgba(148,163,184,0.72)"
        fontSize="8"
      >
        {last.label}
      </text>
    </svg>
  );
}

export function MonthlyBars({ data = [], height = 158 }) {
  const width = 320;
  const padding = { top: 12, right: 8, bottom: 22, left: 8 };
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(
    ...data.flatMap((item) => [item.income, item.expense]),
    1,
  );
  const groupWidth = (width - padding.left - padding.right) / Math.max(data.length, 1);
  const barWidth = Math.min(groupWidth * 0.24, 16);
  const gap = 4;

  if (!data.length) return <EmptyChart height={height} />;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Grafik pemasukan dan pengeluaran enam bulan terakhir"
      className="h-auto w-full"
    >
      {[0, 0.5, 1].map((ratio) => {
        const gridY = padding.top + ratio * plotHeight;
        return (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={gridY}
            y2={gridY}
            stroke="var(--chart-grid, rgba(255,255,255,0.055))"
            strokeDasharray="2 5"
          />
        );
      })}

      {data.map((item, index) => {
        const center = padding.left + groupWidth * index + groupWidth / 2;
        const incomeHeight = Math.max((item.income / max) * plotHeight, item.income > 0 ? 3 : 0);
        const expenseHeight = Math.max((item.expense / max) * plotHeight, item.expense > 0 ? 3 : 0);
        const baseline = padding.top + plotHeight;

        return (
          <g key={item.key}>
            <rect
              x={center - barWidth - gap / 2}
              y={baseline - incomeHeight}
              width={barWidth}
              height={incomeHeight}
              rx="3"
              fill="url(#incomeBar)"
            >
              <title>{`${item.fullLabel}: pemasukan ${formatRupiah(item.income)}`}</title>
            </rect>
            <rect
              x={center + gap / 2}
              y={baseline - expenseHeight}
              width={barWidth}
              height={expenseHeight}
              rx="3"
              fill="url(#expenseBar)"
            >
              <title>{`${item.fullLabel}: pengeluaran ${formatRupiah(item.expense)}`}</title>
            </rect>
            <text
              x={center}
              y={height - 5}
              textAnchor="middle"
              fill="rgba(148,163,184,0.72)"
              fontSize="8"
            >
              {item.label}
            </text>
          </g>
        );
      })}

      <defs>
        <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9DF2D3" />
          <stop offset="100%" stopColor="#3CB98D" />
        </linearGradient>
        <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B9E4FF" />
          <stop offset="100%" stopColor="#4E9FE0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CategoryDonut({ data = [], size = 132, total = 0 }) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = data.length > 1 ? 2.5 : 0;
  let offset = 0;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Komposisi pengeluaran per kategori"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-grid, rgba(255,255,255,0.055))"
          strokeWidth={stroke}
        />
        {data.map((item) => {
          const length = Math.max(
            (item.percent / 100) * circumference - gap,
            0,
          );
          const dashOffset = -offset;
          offset += (item.percent / 100) * circumference;

          return (
            <circle
              key={item.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.accent}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              opacity="0.92"
            >
              <title>{`${item.label}: ${formatRupiah(item.amount)} (${Math.round(item.percent)}%)`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          Total
        </p>
        <p className="mt-1 max-w-[92px] text-[13px] font-semibold leading-tight tracking-[-0.03em] text-white tabular-nums">
          {formatRupiahCompact(total)}
        </p>
      </div>
    </div>
  );
}

function EmptyChart({ height }) {
  return (
    <div
      className="grid place-items-center rounded-[16px] border border-dashed border-white/[0.07] bg-white/[0.015]"
      style={{ height }}
    >
      <p className="text-[9px] font-medium text-slate-600">
        Belum ada data untuk grafik ini.
      </p>
    </div>
  );
}
