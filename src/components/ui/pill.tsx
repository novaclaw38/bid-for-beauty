import type { ReactNode } from "react";
import { BID_STATUS_META, STATUS_META, categoryColor, categoryLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pill({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      {dot ? (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
      ) : null}
      {children}
    </span>
  );
}

export function JobStatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <Pill className={meta.chip} dot={meta.dot}>
      {meta.label}
    </Pill>
  );
}

export function BidStatusPill({ status }: { status: string }) {
  const meta = BID_STATUS_META[status];
  if (!meta) return null;
  return <Pill className={meta.chip}>{meta.label}</Pill>;
}

export function CategoryPill({ value }: { value: string }) {
  return (
    <Pill className="bg-paper text-ink-2 ring-line" dot={categoryColor(value)}>
      {categoryLabel(value)}
    </Pill>
  );
}
