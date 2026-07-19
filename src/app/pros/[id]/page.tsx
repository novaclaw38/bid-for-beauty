import { and, asc, eq } from "drizzle-orm";
import { ArrowRight, MapPin, Medal, Star } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { Pill } from "@/components/ui/pill";
import { db } from "@/db";
import { proPhotos, users } from "@/db/schema";
import { categoryLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [pro] = await db
    .select({ name: users.name, bio: users.bio })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "professional")))
    .limit(1);
  if (!pro) return { title: "Pro profile" };
  return {
    title: pro.name,
    description: pro.bio ?? `${pro.name}'s work on Bid for Beauty.`,
  };
}

export default async function PublicProProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    <div className="min-h-screen">
      <header className="border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Bid for Beauty home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/auth/login"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-medium text-ink-2 transition-colors hover:text-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup?role=client"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-cream transition-colors hover:bg-night-2"
            >
              Post a job
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
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
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface"
                >
                  <Image
                    src={photo.url}
                    alt={`${pro.name} work sample ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 220px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl border border-line bg-night px-6 py-8 text-center text-cream">
          <p className="font-display text-xl font-semibold">
            Want <span className="accent-italic">{pro.name.split(" ")[0]}</span> to bid on your
            job?
          </p>
          <p className="mt-1.5 text-sm text-cream/70">
            Post it free and pros like this one will come to you.
          </p>
          <Link
            href="/auth/signup?role=client"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-deep"
          >
            Post a job for free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
