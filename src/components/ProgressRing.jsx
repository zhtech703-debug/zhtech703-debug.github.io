import { useEffect, useId, useState } from "react";

export default function ProgressRing({
  value,
  size = 100,
  stroke = 8,
  gradientFrom = "#4BBDF7",
  gradientTo = "#D2F2FF",
  children,
  className = "",
}) {
  const [animated, setAnimated] = useState(false);
  const rawId = useId();
  const gradientId = `ring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(value, 100));
  const dashOffset = circumference * (1 - (animated ? clampedValue : 0) / 100);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(value)} persen`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.065)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition:
              "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 0 6px rgba(117, 207, 255, 0.32))",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
