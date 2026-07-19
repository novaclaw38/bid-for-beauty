import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminActions, bids } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ bidId: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const admin = await requireAdmin();
  const { bidId } = await params;

  const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
  if (!bid) return jsonError("Bid not found.", 404);
  if (bid.platformFeeStatus === null)
    return jsonError("This bid has no platform fee.", 400);

  const body = await readJson<{ action?: "mark_paid" | "waive"; note?: string }>(req);
  if (body?.action !== "mark_paid" && body?.action !== "waive")
    return jsonError("Unknown action.", 400);
  const note = body.note?.trim() ?? "";
  if (note.length === 0) return jsonError("A reason is required.", 400);

  if (bid.platformFeeStatus !== "pending")
    return jsonError(`Fee is already ${bid.platformFeeStatus}.`, 400);

  const nextStatus = body.action === "mark_paid" ? "paid" : "waived";
  await db
    .update(bids)
    .set({
      platformFeeStatus: nextStatus,
      platformFeePaidAt: body.action === "mark_paid" ? new Date() : bid.platformFeePaidAt,
      adminNote: note,
      updatedAt: new Date(),
    })
    .where(eq(bids.id, bidId));
  await db.insert(adminActions).values({
    adminId: admin.id,
    actionType: body.action === "mark_paid" ? "mark_fee_paid" : "waive_fee",
    targetType: "bid",
    targetId: bidId,
    note,
  });

  return Response.json({ ok: true, status: nextStatus });
});
