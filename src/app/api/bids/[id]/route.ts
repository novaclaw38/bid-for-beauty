import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { bids, jobs } from "@/db/schema";
import { asInt, jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;

  const rows = await db
    .select({ bid: bids, job: jobs })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .where(eq(bids.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return jsonError("Bid not found.", 404);
  const { bid, job } = row;

  const body = await readJson<{
    action?: "accept" | "decline" | "withdraw" | "update";
    amount?: number | string;
    message?: string;
  }>(req);
  if (!body?.action) return jsonError("Invalid request body.", 400);

  // ---- Client-side actions ----
  if (body.action === "accept") {
    if (job.clientId !== user.id)
      return jsonError("Only the job owner can accept bids.", 403);
    if (job.status !== "open") return jsonError("This job is no longer open.", 400);
    if (bid.status !== "pending")
      return jsonError("This bid can no longer be accepted.", 400);

    await db.transaction(async (tx) => {
      await tx
        .update(bids)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(bids.id, id));
      await tx
        .update(bids)
        .set({ status: "declined", updatedAt: new Date() })
        .where(and(eq(bids.jobId, job.id), ne(bids.id, id), eq(bids.status, "pending")));
      await tx
        .update(jobs)
        .set({ status: "awarded", awardedBidId: id, updatedAt: new Date() })
        .where(eq(jobs.id, job.id));
    });

    return Response.json({ ok: true });
  }

  if (body.action === "decline") {
    if (job.clientId !== user.id)
      return jsonError("Only the job owner can decline bids.", 403);
    if (bid.status !== "pending")
      return jsonError("This bid is no longer pending.", 400);
    await db
      .update(bids)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(bids.id, id));
    return Response.json({ ok: true });
  }

  // ---- Pro-side actions ----
  if (body.action === "withdraw") {
    if (bid.proId !== user.id)
      return jsonError("You can only withdraw your own bids.", 403);
    if (bid.status !== "pending")
      return jsonError("Only pending bids can be withdrawn.", 400);
    await db
      .update(bids)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(eq(bids.id, id));
    return Response.json({ ok: true });
  }

  if (body.action === "update") {
    if (bid.proId !== user.id)
      return jsonError("You can only edit your own bids.", 403);
    if (bid.status !== "pending")
      return jsonError("Only pending bids can be edited.", 400);
    const amount = asInt(body.amount);
    const message = body.message?.trim() ?? "";
    if (amount === null || amount < 1 || amount > 100000)
      return jsonError("Enter a valid bid amount.", 400);
    if (message.length < 20)
      return jsonError("Tell the client why you're the right fit (20+ characters).", 400);
    await db
      .update(bids)
      .set({ amount, message, updatedAt: new Date() })
      .where(eq(bids.id, id));
    return Response.json({ ok: true });
  }

  return jsonError("Unknown action.", 400);
});

export const DELETE = withAuth(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { id } = await params;

  const [bid] = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  if (!bid) return jsonError("Bid not found.", 404);
  if (bid.proId !== user.id)
    return jsonError("You can only delete your own bids.", 403);
  if (bid.status !== "pending" && bid.status !== "withdrawn")
    return jsonError("This bid can no longer be deleted.", 400);

  await db.delete(bids).where(eq(bids.id, id));
  return Response.json({ ok: true });
});
