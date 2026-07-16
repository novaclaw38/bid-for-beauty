import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { CategoryPill, JobStatusPill, Pill } from "@/components/ui/pill";
import type { JobCardData } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function JobCard({
  job,
  showStatus = false,
  className,
}: {
  job: JobCardData;
  showStatus?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_20px_44px_-20px_rgb(23_24_26/0.25)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <CategoryPill value={job.category} />
        {showStatus ? (
          <JobStatusPill status={job.status} />
        ) : job.myBid ? (
          <Pill
            className={
              job.myBid.status === "accepted"
                ? "bg-success-soft text-success ring-success/20"
                : job.myBid.status === "pending"
                  ? "bg-warning-soft text-warning-ink ring-warning/20"
                  : "bg-neutral-soft text-neutral ring-neutral/15"
            }
          >
            {job.myBid.status === "accepted"
              ? `Won · ${formatCurrency(job.myBid.amount)}`
              : job.myBid.status === "pending"
                ? `You bid ${formatCurrency(job.myBid.amount)}`
                : `Bid ${job.myBid.status}`}
          </Pill>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-3">
            {job.bidCount} bid{job.bidCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <h3 className="mt-3.5 font-display text-[17px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand">
        {job.title}
        <ArrowUpRight className="mb-0.5 ml-1.5 inline size-4 text-ink-3 opacity-0 transition-opacity group-hover:text-brand group-hover:opacity-100" />
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {formatDate(job.preferredDate)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={job.client.name} hue={job.client.avatarHue} size="sm" />
          <div className="leading-tight">
            <p className="text-xs font-medium text-ink">{job.client.name}</p>
            <p className="text-[11px] text-ink-3">{job.createdAgo}</p>
          </div>
        </div>
        <p className="font-display text-[15px] font-semibold text-ink">
          {formatCurrency(job.budgetMin)}
          <span className="mx-1 text-ink-3">–</span>
          {formatCurrency(job.budgetMax)}
        </p>
      </div>
    </Link>
  );
}
