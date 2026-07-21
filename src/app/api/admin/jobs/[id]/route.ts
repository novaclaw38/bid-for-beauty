import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminActions, bids, jobs } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const admin = await requireAdmin();
  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return jsonError("Job not found.", 404);

  const body = await readJson<{ action?: "cancel"; note?: string }>(req);
  if (body?.action !== "cancel") return jsonError("Unknown action.", 400);
  const note = body.note?.trim() ?? "";
  if (note.length === 0) return jsonError("A reason is required.", 400);

  if (job.status === "cancelled" || job.status === "completed")
    return jsonError("This job can no longer be cancelled.", 400);

  await db.update(jobs).set({ status: "cancelled", updatedAt: new Date() }).where(eq(jobs.id, id));
  await db
    .update(bids)
    .set({ status: "declined", updatedAt: new Date() })
    .where(and(eq(bids.jobId, id), eq(bids.status, "pending")));
  await db.insert(adminActions).values({
    adminId: admin.id,
    actionType: "cancel_job",
    targetType: "job",
    targetId: id,
    note,
  });

  return Response.json({ ok: true, status: "cancelled" });
});
