import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bids, jobs } from "@/db/schema";
import { asInt, jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { calculatePlatformFee } from "@/lib/payfast";

const CATEGORY_VALUES = new Set(CATEGORIES.map((c) => c.value));

type Params = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return jsonError("Job not found.", 404);
  if (job.clientId !== user.id)
    return jsonError("You can only edit your own jobs.", 403);

  const body = await readJson<{
    action?: "complete" | "cancel" | "reopen";
    title?: string;
    description?: string;
    category?: string;
    budgetMin?: number | string;
    budgetMax?: number | string;
    location?: string;
    preferredDate?: string;
  }>(req);
  if (!body) return jsonError("Invalid request body.", 400);

  // Status transitions
  if (body.action) {
    if (body.action === "complete") {
      if (job.status !== "awarded")
        return jsonError("Only awarded jobs can be marked completed.", 400);
      await db
        .update(jobs)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(jobs.id, id));
      if (job.awardedBidId) {
        const [awardedBid] = await db
          .select()
          .from(bids)
          .where(eq(bids.id, job.awardedBidId))
          .limit(1);
        if (awardedBid && awardedBid.platformFeeStatus === null) {
          await db
            .update(bids)
            .set({
              platformFeeAmount: calculatePlatformFee(awardedBid.amount),
              platformFeeStatus: "pending",
              updatedAt: new Date(),
            })
            .where(eq(bids.id, awardedBid.id));
        }
      }
      return Response.json({ ok: true, status: "completed" });
    }
    if (body.action === "cancel") {
      if (job.status === "cancelled" || job.status === "completed")
        return jsonError("This job can no longer be cancelled.", 400);
      await db
        .update(jobs)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(jobs.id, id));
      // auto-decline pending bids so pros aren't left hanging
      await db
        .update(bids)
        .set({ status: "declined", updatedAt: new Date() })
        .where(and(eq(bids.jobId, id), eq(bids.status, "pending")));
      return Response.json({ ok: true, status: "cancelled" });
    }
    if (body.action === "reopen") {
      if (job.status !== "cancelled")
        return jsonError("Only cancelled jobs can be reopened.", 400);
      await db
        .update(jobs)
        .set({ status: "open", awardedBidId: null, updatedAt: new Date() })
        .where(eq(jobs.id, id));
      return Response.json({ ok: true, status: "open" });
    }
    return jsonError("Unknown action.", 400);
  }

  // Field edits (only while open)
  if (job.status !== "open")
    return jsonError("Only open jobs can be edited.", 400);

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const category = body.category ?? "";
  const location = body.location?.trim() ?? "";
  const budgetMin = asInt(body.budgetMin);
  const budgetMax = asInt(body.budgetMax);
  const preferredDate = body.preferredDate ? new Date(body.preferredDate) : null;

  if (title.length < 8 || title.length > 160)
    return jsonError("Give your job a clear title (8+ characters).", 400);
  if (!CATEGORY_VALUES.has(category as (typeof CATEGORIES)[number]["value"]))
    return jsonError("Pick a valid category.", 400);
  if (description.length < 30)
    return jsonError("Describe the job in a bit more detail (30+ characters).", 400);
  if (budgetMin === null || budgetMin < 10)
    return jsonError("Minimum budget must be at least $10.", 400);
  if (budgetMax === null || budgetMax < budgetMin)
    return jsonError("Maximum budget must be greater than the minimum.", 400);
  if (location.length < 2 || location.length > 160)
    return jsonError("Add a location for the job.", 400);
  if (!preferredDate || Number.isNaN(preferredDate.getTime()))
    return jsonError("Choose a preferred date.", 400);

  await db
    .update(jobs)
    .set({
      title,
      description,
      category,
      budgetMin,
      budgetMax,
      location,
      preferredDate,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id));

  return Response.json({ ok: true });
});

export const DELETE = withAuth(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return jsonError("Job not found.", 404);
  if (job.clientId !== user.id)
    return jsonError("You can only delete your own jobs.", 403);

  const [accepted] = await db
    .select({ id: bids.id })
    .from(bids)
    .where(and(eq(bids.jobId, id), eq(bids.status, "accepted")))
    .limit(1);
  if (accepted)
    return jsonError(
      "This job has an accepted bid. Mark it completed or cancel it instead.",
      400,
    );

  await db.delete(jobs).where(eq(jobs.id, id));
  return Response.json({ ok: true });
});
