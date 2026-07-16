import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asInt, jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";

const CATEGORY_VALUES = new Set(CATEGORIES.map((c) => c.value));

export const PATCH = withAuth(async (req: Request) => {
  const user = await requireUser();
  const body = await readJson<{
    name?: string;
    location?: string;
    bio?: string;
    specialties?: string[];
    avatarHue?: number | string;
  }>(req);
  if (!body) return jsonError("Invalid request body.", 400);

  const name = body.name?.trim() ?? "";
  const location = body.location?.trim() ?? "";
  const bio = body.bio?.trim() ?? "";
  const avatarHue = asInt(body.avatarHue);

  if (name.length < 2 || name.length > 120)
    return jsonError("Please enter your full name.", 400);
  if (location.length > 160) return jsonError("Location is too long.", 400);
  if (bio.length > 600) return jsonError("Keep your bio under 600 characters.", 400);

  let specialties: string[] = [];
  if (user.role === "professional") {
    specialties = Array.isArray(body.specialties)
      ? body.specialties
          .filter((s): s is string => typeof s === "string" && CATEGORY_VALUES.has(s as never))
          .slice(0, 8)
      : [];
    if (specialties.length === 0)
      return jsonError("Pick at least one specialty.", 400);
  }

  await db
    .update(users)
    .set({
      name,
      location: location || null,
      bio: bio || null,
      specialties,
      ...(avatarHue !== null && avatarHue >= 0 && avatarHue <= 360
        ? { avatarHue }
        : {}),
    })
    .where(eq(users.id, user.id));

  return Response.json({ ok: true });
});
