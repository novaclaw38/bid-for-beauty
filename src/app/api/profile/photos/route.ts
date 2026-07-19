import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { proPhotos } from "@/db/schema";
import { jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const MAX_PHOTOS = 12;

export const POST = withAuth(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "professional") {
    return jsonError("Only professionals can upload photos.", 403);
  }

  const body = await readJson<{ url?: string }>(req);
  const url = body?.url?.trim();
  if (!url || !url.startsWith("https://")) {
    return jsonError("Invalid photo URL.", 400);
  }

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(proPhotos)
    .where(eq(proPhotos.proId, user.id));

  if (existingCount >= MAX_PHOTOS) {
    return jsonError(`You can upload up to ${MAX_PHOTOS} photos.`, 400);
  }

  const [row] = await db
    .insert(proPhotos)
    .values({ proId: user.id, url, position: existingCount })
    .returning();

  return Response.json({ id: row.id, url: row.url, position: row.position });
});
