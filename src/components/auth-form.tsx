"use client";

import { Eye, EyeOff, Scissors, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AuthForm({
  mode,
  initialRole = "client",
}: {
  mode: "login" | "signup";
  initialRole?: "client" | "professional";
}) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [role, setRole] = useState<"client" | "professional">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleSpecialty(value: string) {
    setSpecialties((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { name, email, password, role, location, specialties },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      toast.success(
        isLogin ? "Welcome back." : "Account created. Welcome aboard.",
      );
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function fillDemo(account: "ava" | "amara") {
    setEmail(`${account}@glossdemo.com`);
    setPassword("demo1234");
    setError(null);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        {isLogin
          ? "Sign in to your dashboard to post jobs or place bids."
          : "Join the marketplace where beauty jobs and pros find each other."}
      </p>

      {/* role picker (signup) */}
      {!isLogin && (
        <div className="mt-7 grid grid-cols-2 gap-2.5">
          {(
            [
              {
                value: "client",
                icon: Sparkles,
                title: "I need a pro",
                sub: "Post jobs & get bids",
              },
              {
                value: "professional",
                icon: Scissors,
                title: "I'm a pro",
                sub: "Bid on jobs & earn",
              },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                role === option.value
                  ? "border-brand bg-brand-soft/60 shadow-[0_8px_20px_-10px_rgb(239_71_112/0.5)]"
                  : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <option.icon
                className={cn(
                  "size-5",
                  role === option.value ? "text-brand" : "text-ink-3",
                )}
              />
              <p className="mt-2.5 text-sm font-semibold text-ink">
                {option.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-3">
                {option.sub}
              </p>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-4">
        {!isLogin && (
          <Field label="Full name" htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ava Whitfield"
              autoComplete="name"
              required
            />
          </Field>
        )}

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint={!isLogin ? "At least 8 characters." : undefined}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-3 transition-colors hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {!isLogin && (
          <>
            <Field label="Location" htmlFor="location" hint="Neighborhood or city. Helps pros nearby find you.">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Parkhurst, Johannesburg"
              />
            </Field>

            {role === "professional" && (
              <Field label="Your specialties" hint="Pick everything you offer.">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = specialties.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleSpecialty(cat.value)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-all",
                          active
                            ? "bg-ink text-cream ring-ink"
                            : "bg-surface text-ink-2 ring-line-strong hover:ring-ink-3",
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </>
        )}

        {error && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {isLogin ? "Sign in" : role === "professional" ? "Join as professional" : "Create account"}
        </Button>
      </form>

      {isLogin && (
        <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-cream/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
            Try a demo account
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("ava")}
              className="rounded-xl bg-surface px-3 py-2.5 text-left ring-1 ring-line transition-all hover:ring-brand"
            >
              <p className="text-xs font-semibold text-ink">Ava · Client</p>
              <p className="text-[11px] text-ink-3">Posts jobs, picks bids</p>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("amara")}
              className="rounded-xl bg-surface px-3 py-2.5 text-left ring-1 ring-line transition-all hover:ring-brand"
            >
              <p className="text-xs font-semibold text-ink">Amara · Pro</p>
              <p className="text-[11px] text-ink-3">Bids on hair jobs</p>
            </button>
          </div>
          <p className="mt-2.5 text-[11px] text-ink-3">
            Both use password <span className="font-semibold text-ink-2">demo1234</span>. Tap to autofill.
          </p>
        </div>
      )}

      <p className="mt-7 text-center text-sm text-ink-3">
        {isLogin ? "New to Bid for Beauty? " : "Already have an account? "}
        <Link
          href={isLogin ? "/auth/signup" : "/auth/login"}
          className="font-medium text-brand transition-colors hover:text-brand-deep"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
