import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Flexible";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function timeAgo(value: Date | string, now: Date = new Date()): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.max(1, Math.floor((now.getTime() - d.getTime()) / 1000));
  const intervals: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
  ];
  let unit = "second";
  let count = seconds;
  let remainder = seconds;
  for (const [divisor, name] of intervals) {
    if (remainder < divisor) break;
    remainder = remainder / divisor;
    unit = name;
    count = Math.floor(remainder);
  }
  if (unit === "second" && seconds < 8) return "just now";
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function avatarStyles(hue: number): { backgroundColor: string; color: string } {
  return {
    backgroundColor: `hsl(${hue} 38% 90%)`,
    color: `hsl(${hue} 45% 32%)`,
  };
}

/** Turn a Date (or ISO string) into yyyy-mm-dd for <input type="date"> */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}
