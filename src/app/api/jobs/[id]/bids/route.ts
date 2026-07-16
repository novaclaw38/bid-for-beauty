import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bids, jobs } from "@/db/schema";
import { asInt, jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const POST = withAuth(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    if (user.role !== "professional")
      return jsonError("Only professionals can place bids.", 403);

    const { id } = await params;
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return jsonError("Job not found.", 404);
    if (job.status !== "open")
      return jsonError("This job is no longer accepting bids.", 400);

    const existing = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.jobId, id), eq(bids.proId, user.id)))
      .limit(1);
    if (existing.length > 0)
      return jsonError("You've already placed a bid on this job.", 409);

    const body = await readJson<{ amount?: number | string; message?: string }>(req);
    if (!body) return jsonError("Invalid request body.", 400);

    const amount = asInt(body.amount);
    const message = body.message?.trim() ?? "";

    if (amount === null || amount < 1 || amount > 100000)
      return jsonError("Enter a valid bid amount.", 400);
    if (message.length < 20)
      return jsonError("Tell the client why you're the right fit (20+ characters).", 400);

    const [bid] = await db
      .insert(bids)
      .values({ jobId: id, proId: user.id, amount, message })
      .returning();

    return Response.json({ ok: true, bidId: bid.id }, { status: 201 });
  },
);
