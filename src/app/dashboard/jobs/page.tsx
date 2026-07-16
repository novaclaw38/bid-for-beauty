import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { Briefcase, CirclePlus, Compass, Telescope } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JobsFilterBar } from "@/components/dashboard/jobs-filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toJobCardData } from "@/lib/serialize";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

const matchesQuery = (q: string, ...fields: string[]) => {
  const needle = q.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(needle));
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const { f = "all", q = "" } = await searchParams;

  const counts = await db
    .select({ jobId: bids.jobId, count: sql<number>`count(*)::int` })
    .from(bids)
    .groupBy(bids.jobId);
  const countMap = new Map(counts.map((c) => [c.jobId, c.count]));

  if (user.role === "client") {
    const myJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.clientId, user.id))
      .orderBy(desc(jobs.createdAt));

    const filtered = myJobs.filter(
      (j) =>
        (f === "all" || j.status === f) &&
        (!q || matchesQuery(q, j.title, j.description, j.location)),
    );

    return (
      <div>
        <PageHeader
          title="My Jobs"
          description="Every job you've posted. Track bids, award winners, and manage bookings."
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
            icon={Briefcase}
            title="No jobs yet"
            description="Post your first job and let pros near you compete for the booking."
            action={
              <Link href="/dashboard/jobs/new">
                <Button>Post your first job</Button>
              </Link>
            }
          />
        ) : (
          <>
            <JobsFilterBar mode="status" current={f} q={q} />
            {filtered.length === 0 ? (
              <EmptyState
                icon={Telescope}
                title="Nothing matches"
                description="Try a different status filter or clear your search."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={toJobCardData(job, user, countMap.get(job.id) ?? 0)}
                    showStatus
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Professional marketplace view
  const openJobs = await db
    .select({ job: jobs, client: users })
    .from(jobs)
    .innerJoin(users, eq(jobs.clientId, users.id))
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt));

  const myBids = await db
    .select()
    .from(bids)
    .where(eq(bids.proId, user.id));
  const myBidMap = new Map(myBids.map((b) => [b.jobId, b]));

  const filtered = openJobs.filter(
    (r) =>
      (f === "all" || r.job.category === f) &&
      (!q ||
        matchesQuery(q, r.job.title, r.job.description, r.job.location, r.client.name)),
  );

  return (
    <div>
      <PageHeader
        title="Find Jobs"
        description="Open jobs from clients looking for pros like you. Bid well, bid honestly."
      />

      {openJobs.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="The board is quiet"
          description="No open jobs this second. New posts land all day — check back soon."
        />
      ) : (
        <>
          <JobsFilterBar mode="category" current={f} q={q} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={Telescope}
              title="Nothing matches"
              description="Try another category or clear your search. Jobs are posted every day."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
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
        </>
      )}
    </div>
  );
}
