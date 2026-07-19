import { cn } from "@/lib/utils";

/**
 * Paddle + mirror in one silhouette (a raised auction paddle reads the same
 * as a hand mirror), with three ascending bars standing in for a bid climbing.
 */
function Mark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="size-[19px]"
      aria-hidden
      fill="none"
    >
      <circle cx="14" cy="13" r="8" stroke="currentColor" strokeWidth="2.3" />
      <path
        d="M19.66 18.66 25.5 27"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <rect x="9.85" y="14" width="1.9" height="3" rx="0.95" fill="currentColor" opacity="0.5" />
      <rect x="13.05" y="12" width="1.9" height="5" rx="0.95" fill="currentColor" opacity="0.75" />
      <rect x="16.25" y="10" width="1.9" height="7" rx="0.95" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  dark = false,
  className,
  compact = false,
}: {
  dark?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-[11px] bg-brand text-brand-ink shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--color-brand)_70%,transparent)]">
        <Mark />
      </span>
      {!compact ? (
        <span
          className={cn(
            "font-display text-[19px] font-semibold tracking-tight",
            dark ? "text-cream" : "text-ink",
          )}
        >
          Bid for <span className="text-brand">Beauty</span>
        </span>
      ) : null}
    </span>
  );
}
