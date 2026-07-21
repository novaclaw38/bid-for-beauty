import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { Briefcase, CircleDollarSign, ShieldBan, UserRound, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/db";
import { adminActions, bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminActionRow } from "@/lib/serialize";

export const metadata: Metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [openJobs, pendingFees, clientCount, proCount, suspendedCount, recentActions] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(eq(jobs.status, "open")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bids)
        .where(eq(bids.platformFeeStatus, "pending")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, "client")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, "professional")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.status, "suspended")),
      db
        .select({ action: adminActions, adminName: users.name })
        .from(adminActions)
        .innerJoin(users, eq(adminActions.adminId, users.id))
        .orderBy(desc(adminActions.createdAt))
        .limit(8),
    ]);

  const actionRows = recentActions.map((r) => toAdminActionRow(r.action, r.adminName));

  return (
    <div>
      <PageHeader
        title="Admin overview"
        description="Platform health at a glance, and the latest moderation activity."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={Briefcase} label="Open jobs" value={openJobs[0]?.count ?? 0} tone="brand" />
        <StatCard
          icon={CircleDollarSign}
          label="Pending fees"
          value={pendingFees[0]?.count ?? 0}
          tone="gold"
          emphasize={(pendingFees[0]?.count ?? 0) > 0}
        />
        <StatCard icon={UserRound} label="Clients" value={clientCount[0]?.count ?? 0} tone="ink" />
        <StatCard icon={Users} label="Pros" value={proCount[0]?.count ?? 0} tone="ink" />
        <StatCard
          icon={ShieldBan}
          label="Suspended"
          value={suspendedCount[0]?.count ?? 0}
          tone="gold"
          emphasize={(suspendedCount[0]?.count ?? 0) > 0}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Recent admin activity
        </h2>
        {actionRows.length === 0 ? (
          <EmptyState
            icon={ShieldBan}
            title="No admin actions yet"
            description="Suspensions, cancellations, and fee overrides will show up here."
          />
        ) : (
          <div className="space-y-2.5">
            {actionRows.map((a) => (
              <div key={a.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-[13px] leading-snug text-ink-2">
                  <span className="font-semibold text-ink">{a.adminName}</span>{" "}
                  {a.actionType.replace(/_/g, " ")} · {a.targetType} {a.targetId.slice(0, 8)}
                </p>
                {a.note ? (
                  <p className="mt-1 text-xs text-ink-3">&ldquo;{a.note}&rdquo;</p>
                ) : null}
                <p className="mt-1 text-xs text-ink-3">{a.createdAgo}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
