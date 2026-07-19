import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { proPhotos } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const PATCH = withAuth(async (req: Request) => {
  const user = await requireUser();
  const body = await readJson<{ orderedIds?: string[] }>(req);
  const orderedIds = body?.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return jsonError("Invalid order.", 400);
  }

  const owned = await db
    .select({ id: proPhotos.id })
    .from(proPhotos)
    .where(eq(proPhotos.proId, user.id));
  const ownedIds = new Set(owned.map((r) => r.id));

  if (!orderedIds.every((id) => ownedIds.has(id))) {
    return jsonError("One or more photos don't belong to you.", 403);
  }

  // One transaction so a reorder is all-or-nothing: a partial failure partway
  // through would otherwise leave positions inconsistent (duplicates or gaps).
  // Sequential updates on a single pooled connection also avoid opening one
  // connection per photo.
  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(proPhotos)
        .set({ position: index })
        .where(and(eq(proPhotos.id, id), eq(proPhotos.proId, user.id)));
    }
  });

  return Response.json({ ok: true });
});
