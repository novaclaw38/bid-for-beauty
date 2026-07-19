"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Server-side redirects (role gates, payment return/cancel URLs) happen
 * before any client toast context exists, so the reason travels as a search
 * param and gets surfaced here once the client lands, then stripped from
 * the URL so a refresh doesn't re-fire it.
 */
export function SearchParamToast({
  param,
  messages,
  tone = "error",
}: {
  param: string;
  messages: Record<string, string>;
  tone?: "error" | "success" | "info";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get(param);

  useEffect(() => {
    if (!value) return;
    const message = messages[value];
    if (message) {
      if (tone === "error") toast.error(message);
      else if (tone === "success") toast.success(message);
      else toast(message);
    }
    const params = new URLSearchParams(searchParams);
    params.delete(param);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return null;
}
