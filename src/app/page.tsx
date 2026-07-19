import { desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CircleDollarSign,
  Gavel,
  MapPin,
  MousePointerClick,
  Search,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryTile } from "@/components/category-icon";
import { JobCard } from "@/components/job-card";
import { Logo } from "@/components/logo";
import {
  CountUp,
  Marquee,
  Parallax,
  ScrollProgress,
  TiltCard,
} from "@/components/motion-bits";
import { Reveal } from "@/components/reveal";
import { Avatar } from "@/components/ui/avatar";
import { db } from "@/db";
import { bids, jobs, users } from "@/db/schema";
import { CATEGORIES, categoryImage, categoryLabel } from "@/lib/constants";
import { toJobCardData, toProSummary } from "@/lib/serialize";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [
    openJobRows,
    counts,
    [openStats],
    [proStats],
    [doneStats],
    categoryCounts,
    latestBidRows,
  ] = await Promise.all([
    db
      .select({ job: jobs, client: users })
      .from(jobs)
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(eq(jobs.status, "open"))
      .orderBy(desc(jobs.createdAt))
      .limit(6),
    db
      .select({ jobId: bids.jobId, count: sql<number>`count(*)::int` })
      .from(bids)
      .groupBy(bids.jobId),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.status, "open")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "professional")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.status, "completed")),
    db
      .select({ category: jobs.category, count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.status, "open"))
      .groupBy(jobs.category),
    db
      .select({ bid: bids, pro: users, job: jobs })
      .from(bids)
      .innerJoin(users, eq(bids.proId, users.id))
      .innerJoin(jobs, eq(bids.jobId, jobs.id))
      .orderBy(desc(bids.createdAt))
      .limit(1),
  ]);

  const countMap = new Map(counts.map((c) => [c.jobId, c.count]));
  const catCountMap = new Map(categoryCounts.map((c) => [c.category, c.count]));
  const latestBid = latestBidRows[0];

  const heroJob = openJobRows[0];
  const cards = openJobRows.map((r) =>
    toJobCardData(r.job, r.client, countMap.get(r.job.id) ?? 0),
  );

  // Editorial photo strip shown between the hero and the job board.
  const strip = [
    { src: "/img/editorial-florals.jpg", alt: "Blush ranunculus arranged around rose-gold makeup" },
    { src: "/img/pro-nails-work.jpg", alt: "A nail technician shaping a client's nails" },
    { src: "/img/salon-interior.jpg", alt: "A bright modern salon floor with styling chairs" },
    { src: "/img/editorial-brushes.jpg", alt: "A jar of rose-gold makeup brushes" },
    { src: "/img/cat-skincare.jpg", alt: "A clay mask being applied during a facial" },
    { src: "/img/pro-makeup-artist.jpg", alt: "A makeup artist holding an eyeshadow palette" },
    { src: "/img/nails-lilac.jpg", alt: "Lilac and silver manicure against a cream knit" },
    { src: "/img/editorial-flatlay.jpg", alt: "Makeup products laid out on marble" },
  ];

  return (
    <div className="min-h-screen">
      <ScrollProgress />
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Bid for Beauty home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-ink-2 md:flex">
            <a href="#jobs" className="transition-colors hover:text-ink">
              Live jobs
            </a>
            <a href="#how" className="transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#categories" className="transition-colors hover:text-ink">
              Categories
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/auth/login"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-medium text-ink-2 transition-colors hover:text-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-cream transition-colors hover:bg-night-2"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section id="main-content" className="relative overflow-hidden">
        <div className="dots pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
          <div>
            <Reveal immediate>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-2 ring-1 ring-line">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                {openStats?.count ?? 0} jobs open for bids right now
              </span>
            </Reveal>
            <Reveal immediate delay={0.06}>
              <h1 className="mt-6 font-display text-5xl font-medium leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[4.4rem]">
                Beauty pros <span className="accent-italic">bid</span> for your
                booking.
              </h1>
            </Reveal>
            <Reveal immediate delay={0.12}>
              <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-2">
                Post the hair, nails, makeup, or skincare job you need, with
                your budget attached. Vetted professionals come to you with
                their best offers. Compare, pick, glow.
              </p>
            </Reveal>
            <Reveal immediate delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup?role=client"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-brand-ink shadow-[0_14px_30px_-10px_color-mix(in_srgb,var(--color-brand)_60%,transparent)] transition-all hover:bg-brand-deep active:scale-[0.98]"
                >
                  Post a job for free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/auth/signup?role=pro"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-surface px-6 text-[15px] font-medium text-ink ring-1 ring-line-strong transition-all hover:bg-paper hover:ring-ink-3"
                >
                  I&apos;m a professional
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Editorial hero visual: photo anchor + live proof cards overlapping */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Disciplined decoration: soft dual-tone wash behind the frame (no blob) */}
            <div
              aria-hidden
              className="animate-aura pointer-events-none absolute -inset-x-8 -top-10 -bottom-8 hidden lg:block [mask-image:radial-gradient(70%_70%_at_55%_40%,black,transparent)]"
              style={{
                background:
                  "radial-gradient(38% 44% at 25% 18%, color-mix(in srgb, var(--color-brand) 24%, transparent), transparent 70%), radial-gradient(42% 40% at 88% 82%, color-mix(in srgb, var(--color-lilac) 28%, transparent), transparent 70%)",
              }}
            />

            {/* Editorial portrait — drifts against scroll for depth */}
            <Parallax strength={26}>
              <TiltCard
                max={5}
                className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line/70 shadow-[0_44px_90px_-44px_rgb(42_31_40/0.5)]"
              >
                <Image
                  src="/img/hero-hair.jpg"
                  alt="A client showing off her fresh balayage against a soft pink wall"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-night/30 via-transparent to-brand/10"
                />
              </TiltCard>
            </Parallax>

            {/* Secondary editorial inset — layers the hero into a collage */}
            <Parallax
              strength={-38}
              className="pointer-events-none absolute -right-4 top-8 hidden w-32 lg:block xl:w-36"
            >
              <div className="overflow-hidden rounded-2xl border border-line/70 shadow-[0_26px_54px_-26px_rgb(42_31_40/0.5)]">
                <Image
                  src="/img/editorial-florals.jpg"
                  alt=""
                  aria-hidden
                  width={280}
                  height={280}
                  sizes="150px"
                  className="h-full w-full object-cover"
                />
              </div>
            </Parallax>

            {/* Sparkle accents */}
            <span
              aria-hidden
              className="animate-twinkle pointer-events-none absolute -left-3 top-16 hidden size-2 rounded-full bg-brand lg:block"
            />
            <span
              aria-hidden
              className="animate-twinkle pointer-events-none absolute -left-6 top-32 hidden size-1.5 rounded-full bg-lilac lg:block"
              style={{ animationDelay: "1.1s" }}
            />

            {heroJob ? (
              <Reveal immediate delay={0.12} className="relative z-10 -mt-24 mr-auto w-[88%] sm:w-[76%]">
                <Link
                  href={`/dashboard/jobs/${heroJob.job.id}`}
                  className="block rounded-2xl border border-line bg-surface/95 p-5 shadow-[0_30px_70px_-30px_rgb(42_31_40/0.45)] backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                      <span className="size-1.5 animate-pulse rounded-full bg-success" />
                      Open for bids
                    </span>
                    <span className="text-xs text-ink-3">
                      {countMap.get(heroJob.job.id) ?? 0} bids so far
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold leading-snug">
                    {heroJob.job.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {heroJob.job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Budget {formatCurrency(heroJob.job.budgetMin)}-
                      {formatCurrency(heroJob.job.budgetMax)}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center gap-2.5 border-t border-line pt-4">
                    <Avatar
                      name={heroJob.client.name}
                      hue={heroJob.client.avatarHue}
                      size="sm"
                    />
                    <div className="text-xs">
                      <p className="font-medium text-ink">{heroJob.client.name}</p>
                      <p className="text-ink-3">Posted this job</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ) : null}

            {latestBid ? (
              <Reveal
                immediate
                delay={0.24}
                className="relative z-10 ml-auto mt-[-18px] w-[82%] animate-float-slow sm:w-[70%]"
              >
                {/* Bid ticket: same rank-badge + "vs. lead" language as the dashboard's
                    bid board, so the hero reads as the auction it's selling, not a
                    generic activity card. */}
                <div className="relative rounded-2xl border border-lilac/25 bg-night p-4 text-cream shadow-[0_24px_50px_-24px_rgb(36_24_38/0.6)]">
                  <span className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-success text-[11px] font-display font-semibold text-success-soft ring-2 ring-night">
                    1
                  </span>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={latestBid.pro.name}
                      hue={latestBid.pro.avatarHue}
                      size="md"
                      className="ring-2 ring-lilac/40 ring-offset-2 ring-offset-night"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {latestBid.pro.name}{" "}
                        <span className="font-normal text-cream/60">
                          just placed the leading bid
                        </span>
                      </p>
                      <p className="truncate text-[11.5px] text-cream/65">
                        on “{latestBid.job.title}”
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block font-display text-lg font-semibold text-cream">
                        {formatCurrency(latestBid.bid.amount)}
                      </span>
                      <span className="text-[10px] font-medium text-success">
                        Leading bid
                      </span>
                    </div>
                  </div>
                  {(() => {
                    const pro = toProSummary(latestBid.pro);
                    return (
                      <div className="mt-3 flex items-center gap-3 border-t border-dashed border-lilac/20 pt-3 text-[11px] text-cream/60">
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3 text-gold" />
                          {pro.rating ?? "New"}
                        </span>
                        <span>{pro.jobsCompleted} jobs done</span>
                        <span className="min-w-0 flex-1 truncate">
                          {pro.specialties.map(categoryLabel).join(" · ")}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2.5 px-4 py-4 text-sm text-ink-3 sm:px-6">
            <span className="flex items-center gap-1.5">
              <BadgeCheck aria-hidden className="size-4 text-success" />
              Vetted pros
            </span>
            <span className="flex items-center gap-1.5">
              <CircleDollarSign aria-hidden className="size-4 text-gold" />
              Free to post
            </span>
            <span className="flex items-center gap-1.5">
              <Star aria-hidden className="size-4 text-brand" />
              4.8 avg rating
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-b border-line bg-surface/70">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-line px-4 sm:px-6">
            {[
              { value: openStats?.count ?? 0, label: "Open jobs" },
              { value: proStats?.count ?? 0, label: "Vetted pros" },
              { value: doneStats?.count ?? 0, label: "Jobs completed" },
            ].map((s) => (
              <div key={s.label} className="group py-6 text-center sm:py-8">
                <p className="font-display text-3xl font-semibold text-ink transition-colors group-hover:text-brand sm:text-4xl">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial photo ticker ──────────────────── */}
      <section aria-label="Work from the marketplace" className="border-b border-line py-6">
        <Marquee speed={52}>
          {strip.map((img) => (
            <div
              key={img.src}
              className="photo-zoom relative h-36 w-52 shrink-0 overflow-hidden rounded-2xl border border-line/70 sm:h-44 sm:w-64"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="256px"
                className="object-cover"
              />
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── Live jobs ───────────────────────────────── */}
      <section id="jobs" className="anchor-section mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                The board
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink sm:text-[2.6rem]">
                Fresh jobs, <span className="accent-italic">live</span> right now
              </h2>
            </div>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-deep"
            >
              Sign up to bid on these
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.slice(0, 6).map((job, i) => (
            <Reveal key={job.id} delay={0.05 * i}>
              <JobCard job={job} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────── */}
      <section id="how" className="anchor-section border-y border-line bg-cream/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              How it works
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight text-ink sm:text-[2.6rem]">
              Three steps to your{" "}
              <span className="accent-italic">best self</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                icon: MousePointerClick,
                step: "01",
                title: "Post your job",
                body: "Describe what you need: a knotless install, bridal glam, or a lash fill. Set your budget range and preferred date.",
                featured: true,
              },
              {
                icon: Search,
                step: "02",
                title: "Compare the bids",
                body: "Professionals send offers with their price and pitch. Stack up ratings, specialties, and rates side by side.",
                featured: false,
              },
              {
                icon: Gavel,
                step: "03",
                title: "Award the winner",
                body: "Accept the bid you love. The job is booked, the pro is locked in, and everyone else is politely released.",
                featured: false,
              },
            ].map((s, i) => (
              <Reveal
                key={s.step}
                delay={0.08 * i}
                className={s.featured ? "md:col-span-2" : undefined}
              >
                <div
                  className={cn(
                    "group relative h-full rounded-3xl border p-7 transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgb(42_31_40/0.28)]",
                    s.featured
                      ? "border-brand/20 bg-brand-soft md:flex md:items-center md:gap-8"
                      : "border-line bg-surface",
                  )}
                >
                  <div className={cn("flex items-center justify-between", s.featured && "md:shrink-0")}>
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-2xl",
                        s.featured ? "bg-brand text-brand-ink" : "bg-brand-soft text-brand",
                      )}
                    >
                      <s.icon className="size-5" />
                    </span>
                    <span
                      className={cn(
                        "font-display text-4xl font-light transition-colors group-hover:text-brand/40",
                        s.featured ? "text-brand/30 md:hidden" : "text-line-strong",
                      )}
                    >
                      {s.step}
                    </span>
                  </div>
                  <div className={s.featured ? "mt-5 md:mt-0 md:flex-1" : undefined}>
                    <h3
                      className={cn(
                        "font-display text-xl font-semibold text-ink",
                        s.featured && "md:text-2xl",
                      )}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">{s.body}</p>
                  </div>
                  {s.featured ? (
                    <div className="photo-zoom mt-6 overflow-hidden rounded-2xl border border-brand/20 md:mt-0 md:w-64 md:shrink-0 lg:w-80">
                      <Image
                        src="/img/pro-makeup-artist.jpg"
                        alt=""
                        aria-hidden
                        width={640}
                        height={420}
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="h-40 w-full object-cover md:h-44"
                      />
                    </div>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-line bg-surface p-7 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-cream">
                  <CircleDollarSign className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    For professionals: the board is your pipeline
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">
                    Browse fresh jobs in your specialty, bid what your work is
                    worth, and fill your calendar without cold DMs.
                  </p>
                </div>
              </div>
              <Link
                href="/auth/signup?role=pro"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-cream transition-colors hover:bg-night-2"
              >
                I&apos;m a professional
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────── */}
      <section id="categories" className="anchor-section mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-[2.6rem]">
            Every kind of <span className="accent-italic">glow up</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat, i) => {
            const count = catCountMap.get(cat.value) ?? 0;
            const img = categoryImage(cat.value);
            return (
              <Reveal key={cat.value} delay={0.05 * i}>
                <div className="photo-zoom group relative h-full min-h-44 overflow-hidden rounded-2xl border border-line transition-all hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_26px_50px_-24px_rgb(42_31_40/0.42)]">
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : null}
                  {/* Legibility scrim, warmed toward the category's own hue on hover */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/45 to-night/10 transition-opacity"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(to top, ${cat.color}cc, transparent 65%)`,
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-between p-4">
                    <CategoryTile
                      value={cat.value}
                      color={cat.color}
                      className="bg-cream/90 backdrop-blur-sm"
                    />
                    <div>
                      <p className="font-display text-[15px] font-semibold text-cream">
                        {cat.label}
                      </p>
                      <p className="text-xs text-cream/70">
                        {count} open job{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
          <Reveal delay={0.35}>
            <Link
              href="/auth/signup"
              className="group flex h-full min-h-44 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-paper p-4 text-sm font-medium text-ink-2 transition-all hover:-translate-y-1 hover:border-brand hover:bg-brand-soft hover:text-brand"
            >
              Post yours
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6 lg:pb-28">
        <Reveal>
          <div className="grain dots-light sheen relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-night px-6 py-16 text-center sm:px-12 sm:py-24">
            {/* Photographic bed, dimmed hard so the cream type stays legible */}
            <Image
              src="/img/editorial-florals.jpg"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover opacity-25"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-night/95 via-night/85 to-night-2/90"
            />
            <div
              aria-hidden
              className="animate-aura absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(40% 50% at 18% 20%, color-mix(in srgb, var(--color-brand) 30%, transparent), transparent 70%), radial-gradient(44% 46% at 84% 78%, color-mix(in srgb, var(--color-lilac) 26%, transparent), transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-medium tracking-tight text-cream sm:text-5xl">
                Ready when <span className="accent-italic">you</span> are.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-cream/60">
                Join the marketplace where beauty jobs find their perfect pro,
                and pros find their next favorite client.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/auth/signup?role=client"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-brand-ink transition-all hover:bg-brand-deep active:scale-[0.98]"
                >
                  Post a job for free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/auth/signup?role=pro"
                  className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium text-cream ring-1 ring-cream/25 transition-all hover:bg-cream/10"
                >
                  I&apos;m a professional
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-night-line bg-night text-cream/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
          <div>
            <Logo dark />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-cream/60">
              The beauty bidding marketplace.
              {process.env.NODE_ENV !== "production" ? (
                <>
                  {" "}
                  Demo accounts:{" "}
                  <span className="text-cream/70">ava@glossdemo.com</span> (client) ·{" "}
                  <span className="text-cream/70">amara@glossdemo.com</span> (pro).
                  Password <span className="text-cream/70">demo1234</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#jobs" className="transition-colors hover:text-cream">
              Live jobs
            </a>
            <a href="#how" className="transition-colors hover:text-cream">
              How it works
            </a>
            <Link href="/auth/login" className="transition-colors hover:text-cream">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
