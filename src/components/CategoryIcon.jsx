import {
  ArrowDownLeft,
  Car,
  Coffee,
  Film,
  HeartPulse,
  Receipt,
  ShoppingBag,
} from "lucide-react";

const iconMap = {
  makan: Coffee,
  transport: Car,
  belanja: ShoppingBag,
  tagihan: Receipt,
  hiburan: Film,
  kesehatan: HeartPulse,
  pemasukan: ArrowDownLeft,
};

export default function CategoryIcon({
  category,
  size = 18,
  strokeWidth = 1.9,
  className = "",
}) {
  const Icon = iconMap[category] ?? SparkleFallback;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}

function SparkleFallback({ size, strokeWidth, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    </svg>
  );
}
