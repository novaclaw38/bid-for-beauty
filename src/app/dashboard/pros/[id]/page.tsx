import { and, asc, eq } from "drizzle-orm";
import { MapPin, Medal, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { proPhotos, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pro profile" };

export default async function ProProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/auth/login");

  const { id } = await params;
  const [pro] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "professional")))
    .limit(1);
  if (!pro) notFound();

  const photos = await db
    .select({ id: proPhotos.id, url: proPhotos.url })
    .from(proPhotos)
    .where(eq(proPhotos.proId, pro.id))
    .orderBy(asc(proPhotos.position));

  return (
    <div>
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={pro.name} hue={pro.avatarHue} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold text-ink">{pro.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-4 fill-gold text-gold" />
                {pro.rating ?? "New"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Medal className="size-4 text-brand" />
                {pro.jobsCompleted} jobs done
              </span>
              {pro.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {pro.location}
                </span>
              ) : null}
              <span>Member since {formatDate(pro.createdAt)}</span>
            </div>
            {pro.specialties.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pro.specialties.map((s) => (
                  <Pill key={s} className="bg-paper text-ink-2 ring-line">
                    {categoryLabel(s)}
                  </Pill>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {pro.bio ? (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-2">{pro.bio}</p>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <div className="mt-6">
          <p className="font-display text-lg font-semibold text-ink">Work</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <Image
                  src={photo.url}
                  alt="Work sample"
                  fill
                  sizes="(max-width: 640px) 50vw, 220px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
