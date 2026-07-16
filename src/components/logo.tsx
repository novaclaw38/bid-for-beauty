import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <Sparkles className="size-[17px]" strokeWidth={2.25} />
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
