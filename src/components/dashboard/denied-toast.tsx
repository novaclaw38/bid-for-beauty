"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  "post-job": "Only clients can post jobs. Bid on one instead?",
};

/**
 * Server-side role gates redirect (e.g. a pro hitting /dashboard/jobs/new)
 * before any client toast context exists, so the reason travels as a
 * `denied` search param and gets surfaced here once the client lands.
 */
export function DeniedToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied");

  useEffect(() => {
    if (!denied) return;
    toast.error(MESSAGES[denied] ?? "You can't do that.");
    const params = new URLSearchParams(searchParams);
    params.delete("denied");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [denied]);

  return null;
}
