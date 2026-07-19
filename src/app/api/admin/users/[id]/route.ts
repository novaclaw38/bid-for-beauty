import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminActions, users } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: Request, { params }: Params) => {
  const admin = await requireAdmin();
  const { id } = await params;

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return jsonError("User not found.", 404);

  const body = await readJson<{ action?: "suspend" | "reinstate"; note?: string }>(req);
  if (!body?.action || (body.action !== "suspend" && body.action !== "reinstate"))
    return jsonError("Unknown action.", 400);

  const nextStatus = body.action === "suspend" ? "suspended" : "active";
  if (target.status === nextStatus)
    return jsonError(`User is already ${nextStatus}.`, 400);

  await db.update(users).set({ status: nextStatus }).where(eq(users.id, id));
  await db.insert(adminActions).values({
    adminId: admin.id,
    actionType: body.action === "suspend" ? "suspend_user" : "reinstate_user",
    targetType: "user",
    targetId: id,
    note: body.note?.trim() || null,
  });

  return Response.json({ ok: true, status: nextStatus });
});
