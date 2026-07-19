import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { proPhotos } from "@/db/schema";
import { jsonError, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const DELETE = withAuth(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await params;

    const [row] = await db
      .select()
      .from(proPhotos)
      .where(and(eq(proPhotos.id, id), eq(proPhotos.proId, user.id)))
      .limit(1);

    if (!row) return jsonError("Photo not found.", 404);

    await db.delete(proPhotos).where(eq(proPhotos.id, id));
    await del(row.url).catch(() => {
      // Blob may already be gone; the DB row is the source of truth for the UI.
    });

    return Response.json({ ok: true });
  },
);
