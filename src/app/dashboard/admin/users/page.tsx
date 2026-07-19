import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminUserActions } from "@/components/dashboard/admin-user-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { toAdminUserRow } from "@/lib/serialize";

export const metadata: Metadata = { title: "Admin · Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/dashboard");

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const rows = allUsers.map(toAdminUserRow);

  return (
    <div>
      <PageHeader title="Users" description="Every client and pro on the platform." />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Jobs completed</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-ink-3">{u.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-ink-2">{u.role}</td>
                <td className="px-4 py-3">
                  <Pill
                    className={
                      u.status === "suspended"
                        ? "bg-danger-soft text-danger ring-danger/25"
                        : "bg-success-soft text-success ring-success/25"
                    }
                  >
                    {u.status}
                  </Pill>
                </td>
                <td className="px-4 py-3 text-ink-2">{u.jobsCompleted}</td>
                <td className="px-4 py-3 text-ink-2">{u.rating ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {u.role === "admin" ? null : <AdminUserActions user={u} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
