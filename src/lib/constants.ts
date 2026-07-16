export const CATEGORIES = [
  { value: "hair", label: "Hair & Styling", color: "#C96B86" },
  { value: "nails", label: "Nails", color: "#B0577E" },
  { value: "makeup", label: "Makeup", color: "#9B6AA6" },
  { value: "skincare", label: "Skincare & Facials", color: "#6F9A72" },
  { value: "massage", label: "Massage & Body", color: "#5C8F97" },
  { value: "brows-lashes", label: "Brows & Lashes", color: "#B98A4A" },
  { value: "barbering", label: "Barbering", color: "#7B7392" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.value, c]));

export function categoryLabel(value: string): string {
  return CATEGORY_MAP.get(value as CategoryValue)?.label ?? value;
}

export function categoryColor(value: string): string {
  return CATEGORY_MAP.get(value as CategoryValue)?.color ?? "#78716C";
}

export const JOB_STATUSES = ["open", "awarded", "completed", "cancelled"] as const;

export const STATUS_META: Record<
  string,
  { label: string; dot: string; chip: string }
> = {
  open: {
    label: "Open for bids",
    dot: "var(--color-success)",
    chip: "bg-success-soft text-success ring-success/20",
  },
  awarded: {
    label: "Awarded",
    dot: "var(--color-warning)",
    chip: "bg-warning-soft text-warning-ink ring-warning/20",
  },
  completed: {
    label: "Completed",
    dot: "var(--color-neutral)",
    chip: "bg-neutral-soft text-neutral ring-neutral/15",
  },
  cancelled: {
    label: "Cancelled",
    dot: "var(--color-danger)",
    chip: "bg-danger-soft text-danger ring-danger/15",
  },
};

export const BID_STATUS_META: Record<
  string,
  { label: string; chip: string }
> = {
  pending: {
    label: "Pending",
    chip: "bg-warning-soft text-warning-ink ring-warning/20",
  },
  accepted: {
    label: "Accepted",
    chip: "bg-success-soft text-success ring-success/20",
  },
  declined: {
    label: "Not selected",
    chip: "bg-neutral-soft text-neutral ring-neutral/15",
  },
  withdrawn: {
    label: "Withdrawn",
    chip: "bg-danger-soft text-danger ring-danger/15",
  },
};

export const APP_NAME = "Bid for Beauty";
export const APP_TAGLINE = "Beauty jobs, bid on by pros.";
