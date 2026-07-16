"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { toggleChipClasses } from "@/components/ui/toggle-chip";
import { CATEGORIES } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const HUES = [14, 40, 80, 120, 160, 195, 220, 250, 285, 320, 345, 0];

export function ProfileForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [specialties, setSpecialties] = useState<string[]>(user.specialties);
  const [hue, setHue] = useState(user.avatarHue);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleSpecialty(value: string) {
    setSpecialties((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (user.role === "professional" && specialties.length === 0) {
      setError("Pick at least one specialty so clients can find you.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          bio,
          specialties,
          avatarHue: hue,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      toast.success("Profile saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-5 rounded-2xl border border-line bg-surface p-5">
        <Avatar name={name || "?"} hue={hue} size="xl" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Avatar color</p>
          <p className="mt-0.5 text-xs text-ink-3">
            Your initials, your shade. Pick one.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HUES.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHue(h)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                  hue === h && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
                )}
                style={{ backgroundColor: `hsl(${h} 45% 55%)` }}
                aria-label={`Hue ${h}`}
              >
                {hue === h && <Check className="size-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="profile-name">
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field label="Location" htmlFor="profile-location">
          <Input
            id="profile-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Neighborhood or city"
            maxLength={160}
          />
        </Field>
      </div>

      <Field
        label={user.role === "professional" ? "Your bio" : "About you"}
        htmlFor="profile-bio"
        hint={`${bio.trim().length}/600 characters${
          user.role === "professional"
            ? ". Clients read this next to every bid you place."
            : ""
        }`}
      >
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={600}
          placeholder={
            user.role === "professional"
              ? "Years of experience, signature services, what clients love about you…"
              : "Anything pros should know about you…"
          }
        />
      </Field>

      {user.role === "professional" && (
        <Field label="Specialties" hint="Shown on your profile and used to surface matching jobs.">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = specialties.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleSpecialty(cat.value)}
                  className={toggleChipClasses(active)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={busy}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
