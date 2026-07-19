import type { Metadata } from "next";
import { BadgeCheck, Mail, Medal, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pill } from "@/components/ui/pill";
import { getCurrentUser } from "@/lib/auth";
import { toSessionUser } from "@/lib/serialize";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div>
      <PageHeader
        title="Profile"
        description={
          user.role === "professional"
            ? "How clients see you, next to every bid you place."
            : "Your account details and how pros see you."
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <ProfileForm user={toSessionUser(user)} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              Account
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-ink/[0.06] text-ink-2">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-ink-3">Email</p>
                  <p className="truncate text-[13px] font-medium text-ink">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-ink/[0.06] text-ink-2">
                  <BadgeCheck className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-ink-3">Role</p>
                  <Pill
                    className={
                      user.role === "professional"
                        ? "mt-0.5 bg-warning-soft text-warning-ink ring-warning/20"
                        : "mt-0.5 bg-brand-soft text-brand-deep ring-brand/20"
                    }
                  >
                    {user.role === "professional" ? "Professional" : "Client"}
                  </Pill>
                </div>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-3.5 text-xs text-ink-3">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>

          {user.role === "professional" && (
            <div className="dots relative overflow-hidden rounded-2xl bg-night p-5 text-cream">
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
                  Your reputation
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-cream/[0.07] p-3.5 ring-1 ring-cream/10">
                    <Star className="size-4 fill-gold text-gold" />
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {user.rating ?? "New"}
                    </p>
                    <p className="text-[11px] text-cream/60">Avg rating</p>
                  </div>
                  <div className="rounded-xl bg-cream/[0.07] p-3.5 ring-1 ring-cream/10">
                    <Medal className="size-4 text-brand" />
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {user.jobsCompleted}
                    </p>
                    <p className="text-[11px] text-cream/60">Jobs done</p>
                  </div>
                </div>
                <p className="mt-3.5 text-[11.5px] leading-relaxed text-cream/60">
                  Ratings grow automatically as you complete awarded jobs.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
