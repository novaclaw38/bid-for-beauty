import { Compass } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl font-semibold text-ink">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
        This page got a glow-down
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-2">
        The page you&apos;re looking for doesn&apos;t exist, or the job was
        already awarded and swept off the board.
      </p>
      <Link href="/dashboard" className="mt-8">
        <Button>
          <Compass className="size-4" />
          Back to your dashboard
        </Button>
      </Link>
    </div>
  );
}
