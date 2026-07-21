import { desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CircleDollarSign,
  CirclePlus,
  Compass,
  Gavel,
  Hourglass,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobCard } from "@/components/job-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BidStatusPill, CategoryPill, JobStatusPill, Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toJobCardData } from "@/lib/serialize";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role === "admin") redirect("/dashboard/admin");

  return user.role === "client" ? (
    <ClientOverview userId={user.id} name={user.name} />
  ) : (
    <ProOverview userId={user.id} name={user.name} specialties={user.specialties} />
  );
}

/* ─── Client ─────────────────────────────────────────── */

async function ClientOverview({ userId, name }: { userId: string; name: string }) {
  const [myJobs, counts, activity] = await Promise.all([
    db.select().from(jobs).where(eq(jobs.clientId, userId)).orderBy(desc(jobs.createdAt)),
    db
      .select({ jobId: bids.jobId, count: sql<number>`count(*)::int` })
      .from(bids)
      .groupBy(bids.jobId),
    db
      .select({ bid: bids, job: jobs, pro: users })
      .from(bids)
      .innerJoin(jobs, eq(bids.jobId, jobs.id))
      .innerJoin(users, eq(bids.proId, users.id))
      .where(eq(jobs.clientId, userId))
      .orderBy(desc(bids.createdAt))
      .limit(6),
  ]);
  const countMap = new Map(counts.map((c) => [c.jobId, c.count]));

  const openCount = myJobs.filter((j) => j.status === "open").length;
  const awardedCount = myJobs.filter((j) => j.status === "awarded").length;
  const completedCount = myJobs.filter((j) => j.status === "completed").length;
  const pendingBidCount = activity.filter(
    (a) => a.bid.status === "pending" && a.job.status === "open",
  ).length;

  const firstName = name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="A live look at your open jobs and the pros bidding on them."
        action={
          <Link href="/dashboard/jobs/new">
            <Button>
              <CirclePlus className="size-4" />
              Post a job
            </Button>
          </Link>
        }
      />

      {myJobs.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Post your first job"
          description="Tell us the look you're after and your budget. Vetted pros come to you with their best offer."
          action={
            <Link href="/dashboard/jobs/new">
              <Button>
                <CirclePlus className="size-4" />
                Post a job for free
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Briefcase} label="Open jobs" value={openCount} tone="success" />
            <StatCard
              icon={Gavel}
              label="Bids to review"
              value={pendingBidCount}
              tone="gold"
              emphasize={pendingBidCount > 0}
            />
            <StatCard icon={BadgeCheck} label="In progress" value={awardedCount} tone="brand" />
            <StatCard icon={Trophy} label="Completed" value={completedCount} tone="ink" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Recent jobs */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">
                  Your recent jobs
                </h2>
                <Link
                  href="/dashboard/jobs"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-deep"
                >
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {myJobs.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="card-hover group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14.5px] font-semibold text-ink group-hover:text-brand">
                          {job.title}
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <CategoryPill value={job.category} />
                        <span className="text-xs text-ink-3">
                          {countMap.get(job.id) ?? 0} bid
                          {(countMap.get(job.id) ?? 0) === 1 ? "" : "s"} ·{" "}
                          {formatCurrency(job.budgetMin)}-{formatCurrency(job.budgetMax)}
                        </span>
                      </div>
                    </div>
                    <JobStatusPill status={job.status} />
                  </Link>
                ))}
              </div>
            </section>

            {/* Bid activity */}
            <section>
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                Latest bids
              </h2>
              <div className="space-y-2.5">
                {activity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line-strong bg-surface/60 p-6 text-center text-sm text-ink-2">
                    No bids yet. They usually land within the hour.
                  </div>
                ) : (
                  activity.map(({ bid, job, pro }) => (
                    <Link
                      key={bid.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:border-line-strong"
                    >
                      <Avatar name={pro.name} hue={pro.avatarHue} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-snug text-ink-2">
                          <span className="font-semibold text-ink">{pro.name}</span>{" "}
                          bid{" "}
                          <span className="font-semibold text-brand">
                            {formatCurrency(bid.amount)}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-3">
                          on “{job.title}” · {timeAgo(bid.createdAt)}
                        </p>
                      </div>
                      <BidStatusPill status={bid.status} />
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Professional ───────────────────────────────────── */

async function ProOverview({
  userId,
  name,
  specialties,
}: {
  userId: string;
  name: string;
  specialties: string[];
}) {
  const [myBids, matchingJobs, counts] = await Promise.all([
    db
      .select({ bid: bids, job: jobs })
      .from(bids)
      .innerJoin(jobs, eq(bids.jobId, jobs.id))
      .where(eq(bids.proId, userId))
      .orderBy(desc(bids.createdAt)),
    db
      .select({ job: jobs, client: users })
      .from(jobs)
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(eq(jobs.status, "open"))
      .orderBy(desc(jobs.createdAt))
      .limit(24),
    db
      .select({ jobId: bids.jobId, count: sql<number>`count(*)::int` })
      .from(bids)
      .groupBy(bids.jobId),
  ]);
  const countMap = new Map(counts.map((c) => [c.jobId, c.count]));
  const myBidMap = new Map(myBids.map((b) => [b.bid.jobId, b.bid]));

  const specialtySet = new Set(specialties);
  const fresh = matchingJobs
    .filter((r) => specialtySet.size === 0 || specialtySet.has(r.job.category))
    .slice(0, 6);

  const pending = myBids.filter((b) => b.bid.status === "pending").length;
  const won = myBids.filter((b) => b.bid.status === "accepted").length;
  const openInSpecialty = fresh.length;
  const firstName = name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Let's fill your calendar, ${firstName}`}
        description="New jobs in your specialties, and every bid you've got in play."
        action={
          <Link href="/dashboard/jobs">
            <Button>
              <Compass className="size-4" />
              Find jobs
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Hourglass}
          label="Pending bids"
          value={pending}
          tone="gold"
          emphasize={pending > 0}
        />
        <StatCard icon={Trophy} label="Won" value={won} tone="success" />
        <StatCard
          icon={Compass}
          label="Open in your lane"
          value={openInSpecialty}
          tone="brand"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Potential earnings"
          value={formatCurrency(
            myBids
              .filter((b) => b.bid.status === "pending")
              .reduce((sum, b) => sum + b.bid.amount, 0),
          )}
          tone="ink"
          hint="sum of pending bids"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Fresh jobs for you
            </h2>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-deep"
            >
              Browse all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {fresh.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No open jobs right now"
              description="The board refreshes all day. Widen your specialties in your profile to catch more."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {fresh.map((r) => (
                <JobCard
                  key={r.job.id}
                  job={toJobCardData(
                    r.job,
                    r.client,
                    countMap.get(r.job.id) ?? 0,
                    myBidMap.get(r.job.id),
                  )}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">
            Your bid pipeline
          </h2>
          {myBids.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="No bids yet"
              description="Place a bid and track it here: pending, won, or passed over."
              action={
                <Link href="/dashboard/jobs">
                  <Button variant="secondary">Browse open jobs</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {myBids.slice(0, 6).map(({ bid, job }) => (
                <Link
                  key={bid.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:border-line-strong"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {job.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-3">
                      Your bid{" "}
                      <span className="font-semibold text-ink-2">
                        {formatCurrency(bid.amount)}
                      </span>{" "}
                      · {timeAgo(bid.createdAt)}
                    </p>
                  </div>
                  <BidStatusPill status={bid.status} />
                </Link>
              ))}
              {myBids.length > 6 && (
                <Link href="/dashboard/bids">
                  <Pill className="mt-1 bg-surface text-ink-2 ring-line hover:ring-ink-3">
                    View all {myBids.length} bids →
                  </Pill>
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
