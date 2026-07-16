import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentUser } from "@/lib/auth";
import { toSessionUser } from "@/lib/serialize";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Bid for Beauty" },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return <DashboardShell user={toSessionUser(user)}>{children}</DashboardShell>;
}
