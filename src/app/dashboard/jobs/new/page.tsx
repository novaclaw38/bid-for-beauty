import type { Metadata } from "next";
import { BadgeDollarSign, MessageSquareText, Scissors, Timer } from "lucide-react";
import { redirect } from "next/navigation";
import { JobForm } from "@/components/dashboard/job-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Post a Job" };
export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "client") redirect("/dashboard/jobs");

  const tips = [
    {
      icon: Scissors,
      title: "Name the exact service",
      body: "“Knotless braids, waist length” gets 2× more bids than “need braids”.",
    },
    {
      icon: MessageSquareText,
      title: "Describe hair, nails, or skin type",
      body: "Pros quote more accurately when they know the canvas: texture, length, condition.",
    },
    {
      icon: BadgeDollarSign,
      title: "Set an honest budget range",
      body: "Pros skip lowball jobs. A fair range attracts the best-rated talent.",
    },
    {
      icon: Timer,
      title: "Move fast on good bids",
      body: "The best pros get booked quickly. Most jobs here are awarded within 24h.",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Post a Job"
        description="Describe what you need and let professionals come to you with their best offers."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <JobForm mode="create" />
        </div>

        <aside className="space-y-3">
          <div className="dots relative overflow-hidden rounded-2xl bg-night p-6 text-cream">
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/50">
                Posting playbook
              </p>
              <p className="mt-2 font-display text-xl font-semibold leading-snug">
                Write it like the best pro in the city is reading.{" "}
                <span className="accent-italic">They are.</span>
              </p>
            </div>
          </div>
          {tips.map((tip) => (
            <div
              key={tip.title}
              className="flex gap-3.5 rounded-2xl border border-line bg-surface p-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <tip.icon className="size-4" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{tip.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{tip.body}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
