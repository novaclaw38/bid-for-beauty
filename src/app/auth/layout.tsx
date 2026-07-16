import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Form side */}
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Back to home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-sm text-ink-3 transition-colors hover:text-ink"
          >
            ← Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
        <p className="text-center text-[11px] text-ink-3">
          By continuing you agree to fair play: honest budgets, honest bids.
        </p>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-night lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Image
          src="/img/auth-beauty.jpg"
          alt=""
          fill
          sizes="55vw"
          className="object-cover object-center"
          priority
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/80 to-night/45"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-night/40"
        />
        <div className="grain absolute inset-0" />
        <div className="relative z-10 flex justify-end">
          <span className="rounded-full px-4 py-1.5 text-xs font-medium text-cream/60 ring-1 ring-cream/15">
            Joburg · Sandton · Rosebank · Fourways
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-gold text-gold" />
            ))}
            <span className="ml-2 text-xs font-medium text-cream/60">
              4.8 average across 1,900+ bookings
            </span>
          </div>
          <blockquote className="mt-6 font-display text-[2rem] font-medium leading-[1.2] text-cream">
            “I posted my bridal hair job at lunch and had{" "}
            <span className="accent-italic">five bids</span> by dinner. Picked
            Amara the next morning. Best hair of my life.”
          </blockquote>
          <div className="mt-8 flex items-center gap-3">
            <Avatar name="Ava Whitfield" hue={14} size="lg" />
            <div>
              <p className="text-sm font-semibold text-cream">Ava Whitfield</p>
              <p className="text-xs text-cream/50">Bride · Melville</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { k: "12 min", v: "median first bid" },
            { k: "0 fees", v: "for posting jobs" },
            { k: "7", v: "beauty categories" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-2xl bg-cream/[0.06] p-4 ring-1 ring-cream/10 backdrop-blur"
            >
              <p className="font-display text-xl font-semibold text-cream">{s.k}</p>
              <p className="mt-0.5 text-[11px] text-cream/50">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
