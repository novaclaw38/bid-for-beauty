import { cn } from "@/lib/utils";

/**
 * Shared visual treatment for the "active/inactive toggle" chip pattern used
 * across filter bars, category/specialty pickers, and suggestion pills.
 * Exposed as a class-string builder (not a component) because call sites
 * mix <button> and <Link> elements.
 */
export function toggleChipClasses(active: boolean, className?: string) {
  return cn(
    "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-all",
    active
      ? "bg-ink text-cream ring-ink"
      : "bg-surface text-ink-2 ring-line-strong hover:ring-ink-3",
    className,
  );
}
