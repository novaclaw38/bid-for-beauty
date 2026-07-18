import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  emphasize = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "sage" | "gold" | "ink";
  /** Fills the whole card in the tone color, for the one stat that most needs a glance. */
  emphasize?: boolean;
}) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    sage: "bg-success-soft text-success",
    gold: "bg-warning-soft text-warning-ink",
    ink: "bg-ink/[0.07] text-ink",
  };
  const emphasizedCard = {
    brand: "border-brand/20 bg-brand-soft",
    sage: "border-success/20 bg-success-soft",
    gold: "border-warning/20 bg-warning-soft",
    ink: "border-ink/15 bg-ink/[0.05]",
  };
  const emphasizedIcon = {
    brand: "bg-brand text-brand-ink",
    sage: "bg-success text-success-soft",
    gold: "bg-warning text-warning-soft",
    ink: "bg-ink text-cream",
  };
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        emphasize ? emphasizedCard[tone] : "border-line bg-surface",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-[12.5px] font-medium",
            emphasize ? "text-ink-2" : "text-ink-3",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            emphasize ? emphasizedIcon[tone] : tones[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2.5 font-display text-[30px] font-semibold leading-none text-ink">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[11.5px] text-ink-3">{hint}</p> : null}
    </div>
  );
}
