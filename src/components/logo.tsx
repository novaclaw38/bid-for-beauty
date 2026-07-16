import { Gavel } from "lucide-react";
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
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand text-brand-ink shadow-[0_6px_16px_-6px_rgb(239_71_112/0.7)]">
        <Gavel className="size-4" />
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
