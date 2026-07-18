import { cn } from "@/lib/utils";

function Mark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="size-[19px]"
      aria-hidden
      fill="none"
    >
      <path
        d="M16 6.5c.55 3.9 1.6 4.95 5.5 5.5-3.9.55-4.95 1.6-5.5 5.5-.55-3.9-1.6-4.95-5.5-5.5 3.9-.55 4.95-1.6 5.5-5.5Z"
        fill="currentColor"
      />
      <path
        d="M23.5 18.5c.3 2.1.85 2.65 2.95 2.95-2.1.3-2.65.85-2.95 2.95-.3-2.1-.85-2.65-2.95-2.95 2.1-.3 2.65-.85 2.95-2.95Z"
        fill="currentColor"
        opacity="0.6"
      />
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
