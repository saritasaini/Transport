import { format, parseISO, isValid } from "date-fns";

export function formatDateIN(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy");
}

export function formatCurrencyINR(amount: number | null | undefined): string {
  const n = amount ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatCurrencyCompactINR(amount: number | null | undefined): string {
  const n = amount ?? 0;
  if (Math.abs(n) >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(n) >= 100000) {
    return `₹${(n / 100000).toFixed(2)}L`;
  }
  if (Math.abs(n) >= 1000) {
    return `₹${(n / 1000).toFixed(2)}K`;
  }
  return `₹${n.toFixed(2)}`;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  if (!isValid(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function expiryBadgeVariant(days: number | null): "default" | "warning" | "danger" {
  if (days === null) return "default";
  if (days <= 7) return "danger";
  if (days <= 30) return "warning";
  return "default";
}
