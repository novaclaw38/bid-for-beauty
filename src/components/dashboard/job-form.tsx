"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CategoryTile } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { CATEGORIES } from "@/lib/constants";
import { cn, toDateInput } from "@/lib/utils";

export interface JobFormValues {
  title: string;
  category: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  location: string;
  preferredDate: string;
}

export const emptyJobValues: JobFormValues = {
  title: "",
  category: "",
  description: "",
  budgetMin: "",
  budgetMax: "",
  location: "",
  preferredDate: "",
};

export function valuesFromJob(job: {
  title: string;
  category: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  preferredDate: string | null;
}): JobFormValues {
  return {
    title: job.title,
    category: job.category,
    description: job.description,
    budgetMin: String(job.budgetMin),
    budgetMax: String(job.budgetMax),
    location: job.location,
    preferredDate: toDateInput(job.preferredDate),
  };
}

export function JobForm({
  mode,
  initialValues = emptyJobValues,
  jobId,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  initialValues?: JobFormValues;
  jobId?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<JobFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function validate(): string | null {
    if (values.title.trim().length < 8)
      return "Give your job a clear title (8+ characters).";
    if (!values.category) return "Pick a category.";
    if (values.description.trim().length < 30)
      return "Describe the job in a bit more detail (30+ characters).";
    const min = Number(values.budgetMin);
    const max = Number(values.budgetMax);
    if (!Number.isFinite(min) || min < 10) return "Minimum budget must be at least $10.";
    if (!Number.isFinite(max) || max < min)
      return "Maximum budget must be greater than the minimum.";
    if (values.location.trim().length < 2) return "Add a location.";
    if (!values.preferredDate) return "Choose a preferred date.";
    return null;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(mode === "create" ? "/api/jobs" : `/api/jobs/${jobId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { error?: string; jobId?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      if (mode === "create") {
        toast.success("Job posted. Pros can start bidding.");
        router.push(`/dashboard/jobs/${data.jobId}`);
        router.refresh();
      } else {
        toast.success("Job updated.");
        onSaved?.();
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Job title" htmlFor="job-title" hint="Be specific. Pros skim titles first.">
        <Input
          id="job-title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Knotless braids, waist length"
          maxLength={160}
        />
      </Field>

      <Field label="Category">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const active = values.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                aria-pressed={active}
                onClick={() => set("category", cat.value)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-brand bg-brand-soft/60"
                    : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <CategoryTile value={cat.value} color={cat.color} className="size-8" />
                <span
                  className={cn(
                    "text-[12.5px] font-medium leading-tight",
                    active ? "text-brand-deep" : "text-ink-2",
                  )}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Description"
        htmlFor="job-description"
        hint={`${values.description.trim().length}/30+ characters: hair type, references, timing, anything that helps pros quote accurately.`}
      >
        <Textarea
          id="job-description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Tell pros exactly what you're after: hair/nail/skin type, inspiration photos you'll share, preferred timing, and anything else that shapes the quote."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Budget from (R)" htmlFor="budget-min">
          <Input
            id="budget-min"
            type="number"
            min={10}
            inputMode="numeric"
            value={values.budgetMin}
            onChange={(e) => set("budgetMin", e.target.value)}
            placeholder="1200"
          />
        </Field>
        <Field label="Budget to (R)" htmlFor="budget-max">
          <Input
            id="budget-max"
            type="number"
            min={10}
            inputMode="numeric"
            value={values.budgetMax}
            onChange={(e) => set("budgetMax", e.target.value)}
            placeholder="2250"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Location" htmlFor="job-location">
          <Input
            id="job-location"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Parkhurst, Johannesburg"
            maxLength={160}
          />
        </Field>
        <Field label="Preferred date" htmlFor="job-date">
          <Input
            id="job-date"
            type="date"
            value={values.preferredDate}
            onChange={(e) => set("preferredDate", e.target.value)}
          />
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Post job" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
