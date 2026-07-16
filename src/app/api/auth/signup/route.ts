import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { establishSession } from "@/lib/auth";
import { asInt, isEmail, jsonError, readJson } from "@/lib/api";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = await readJson<{
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    location?: string;
    specialties?: string[];
  }>(req);

  if (!body) return jsonError("Invalid request body.", 400);

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const role = body.role === "professional" ? "professional" : body.role === "client" ? "client" : null;
  const location = body.location?.trim() || null;
  const specialties = Array.isArray(body.specialties)
    ? body.specialties.filter((s): s is string => typeof s === "string").slice(0, 8)
    : [];

  if (name.length < 2) return jsonError("Please enter your full name.", 400);
  if (!isEmail(email)) return jsonError("Please enter a valid email address.", 400);
  if (password.length < 8)
    return jsonError("Password must be at least 8 characters.", 400);
  if (!role) return jsonError("Choose whether you're hiring or offering services.", 400);
  if (role === "professional" && specialties.length === 0)
    return jsonError("Pick at least one specialty.", 400);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0)
    return jsonError("An account with this email already exists.", 409);

  const [user] = await db
    .insert(users)
    .values({
      role,
      name,
      email,
      passwordHash: hashPassword(password),
      location,
      specialties: role === "professional" ? specialties : [],
      avatarHue: Math.floor(Math.random() * 360),
      rating: role === "professional" ? null : null,
      jobsCompleted: 0,
    })
    .returning();

  await establishSession(user.id);

  return Response.json({ ok: true, user: { id: user.id, role: user.role } });
}
