import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "sage" | "gold" | "ink";
}) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    sage: "bg-success-soft text-success",
    gold: "bg-warning-soft text-warning-ink",
    ink: "bg-ink/[0.07] text-ink",
  };
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-medium text-ink-3">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tones[tone],
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
