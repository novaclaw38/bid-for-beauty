"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, JOB_STATUSES, STATUS_META } from "@/lib/constants";
import { toggleChipClasses } from "@/components/ui/toggle-chip";

export function JobsFilterBar({
  mode,
  current,
  q,
}: {
  mode: "status" | "category";
  current: string;
  q: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  function push(next: { f?: string; q?: string }) {
    const params = new URLSearchParams();
    const f = next.f ?? current;
    const query = next.q ?? search;
    if (f && f !== "all") params.set("f", f);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (current !== "all") params.set("f", current);
      if (search.trim()) params.set("q", search.trim());
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const chips: { value: string; label: string; dot?: string }[] =
    mode === "status"
      ? [
          { value: "all", label: "All jobs" },
          ...JOB_STATUSES.map((s) => ({
            value: s,
            label: STATUS_META[s]?.label ?? s,
            dot: STATUS_META[s]?.dot,
          })),
        ]
      : [
          { value: "all", label: "All categories" },
          ...CATEGORIES.map((c) => ({
            value: c.value as string,
            label: c.label,
            dot: c.color,
          })),
        ];

  return (
    <div className="mb-6 space-y-3.5">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={mode === "status" ? "Search your jobs…" : "Search open jobs…"}
          className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-3/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = current === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => push({ f: chip.value })}
              className={toggleChipClasses(active)}
            >
              {chip.dot ? (
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: chip.dot }}
                />
              ) : null}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
