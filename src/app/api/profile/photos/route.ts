import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { proPhotos, users } from "@/db/schema";
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

  // Count-then-insert is not atomic on its own: two concurrent requests from the
  // same pro could both read a count under the cap and both insert. Wrapping in a
  // transaction and taking a row lock on the pro's own `users` row serializes
  // concurrent uploads from the same pro, so the re-checked count inside the
  // transaction is always accurate by the time we insert.
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select 1 from ${users} where ${users.id} = ${user.id} for update`);

    const [{ value: existingCount }] = await tx
      .select({ value: count() })
      .from(proPhotos)
      .where(eq(proPhotos.proId, user.id));

    if (existingCount >= MAX_PHOTOS) {
      return { capped: true as const };
    }

    const [row] = await tx
      .insert(proPhotos)
      .values({ proId: user.id, url, position: existingCount })
      .returning();

    return { capped: false as const, row };
  });

  if (result.capped) {
    return jsonError(`You can upload up to ${MAX_PHOTOS} photos.`, 400);
  }

  return Response.json({
    id: result.row.id,
    url: result.row.url,
    position: result.row.position,
  });
});
