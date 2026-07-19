import type { Metadata } from "next";
import { desc, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminFeeActions } from "@/components/dashboard/admin-fee-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminFeeRow } from "@/lib/serialize";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Fees" };
export const dynamic = "force-dynamic";

const FEE_TONE: Record<string, string> = {
  pending: "bg-warning-soft text-warning-ink ring-warning/25",
  paid: "bg-success-soft text-success ring-success/25",
  waived: "bg-ink/10 text-ink-2 ring-ink/15",
};

export default async function AdminFeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({ bid: bids, jobTitle: jobs.title, proName: users.name })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .innerJoin(users, eq(bids.proId, users.id))
    .where(isNotNull(bids.platformFeeStatus))
    .orderBy(desc(bids.updatedAt));
  const feeRows = rows.map((r) => toAdminFeeRow(r.bid, r.jobTitle, r.proName));

  return (
    <div>
      <PageHeader title="Platform fees" description="Every fee owed on an accepted, completed bid." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Pro</th>
              <th className="px-4 py-3">Bid</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {feeRows.map((f) => (
              <tr key={f.bidId} className="border-b border-line last:border-0">
                <td className="max-w-xs truncate px-4 py-3 font-medium text-ink">{f.jobTitle}</td>
                <td className="px-4 py-3 text-ink-2">{f.proName}</td>
                <td className="px-4 py-3 text-ink-2">{formatCurrency(f.bidAmount)}</td>
                <td className="px-4 py-3 text-ink-2">{formatCurrency(f.feeAmount)}</td>
                <td className="px-4 py-3">
                  <Pill className={FEE_TONE[f.feeStatus]}>{f.feeStatus}</Pill>
                </td>
                <td className="px-4 py-3">
                  <AdminFeeActions fee={f} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
