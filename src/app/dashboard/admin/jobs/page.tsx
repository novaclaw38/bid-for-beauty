import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminJobActions } from "@/components/dashboard/admin-job-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryPill, JobStatusPill } from "@/components/ui/pill";
import { db } from "@/db";
import { jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminJobRow } from "@/lib/serialize";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Jobs" };
export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({ job: jobs, clientName: users.name })
    .from(jobs)
    .innerJoin(users, eq(jobs.clientId, users.id))
    .orderBy(desc(jobs.createdAt));
  const jobRows = rows.map((r) => toAdminJobRow(r.job, r.clientName));

  return (
    <div>
      <PageHeader title="Jobs" description="Every job posted on the platform." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {jobRows.map((j) => (
              <tr key={j.id} className="border-b border-line last:border-0">
                <td className="max-w-xs truncate px-4 py-3 font-medium text-ink">{j.title}</td>
                <td className="px-4 py-3 text-ink-2">{j.clientName}</td>
                <td className="px-4 py-3">
                  <CategoryPill value={j.category} />
                </td>
                <td className="px-4 py-3 text-ink-2">
                  {formatCurrency(j.budgetMin)}–{formatCurrency(j.budgetMax)}
                </td>
                <td className="px-4 py-3">
                  <JobStatusPill status={j.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminJobActions job={j} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
