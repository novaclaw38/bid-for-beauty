import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { establishSession } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string }>(req);
  if (!body) return jsonError("Invalid request body.", 400);

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same error for unknown email vs wrong password
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonError("Incorrect email or password.", 401);
  }

  await establishSession(user.id);

  return Response.json({ ok: true, user: { id: user.id, role: user.role } });
}
