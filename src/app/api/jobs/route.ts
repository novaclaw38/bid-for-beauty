import { CATEGORIES } from "@/lib/constants";
import { asInt, jsonError, readJson, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";

const CATEGORY_VALUES = new Set(CATEGORIES.map((c) => c.value));

export const POST = withAuth(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "client")
    return jsonError("Only clients can post jobs.", 403);

  const body = await readJson<{
    title?: string;
    description?: string;
    category?: string;
    budgetMin?: number | string;
    budgetMax?: number | string;
    location?: string;
    preferredDate?: string;
  }>(req);
  if (!body) return jsonError("Invalid request body.", 400);

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const category = body.category ?? "";
  const location = body.location?.trim() ?? "";
  const budgetMin = asInt(body.budgetMin);
  const budgetMax = asInt(body.budgetMax);
  const preferredDate = body.preferredDate ? new Date(body.preferredDate) : null;

  if (title.length < 8 || title.length > 160)
    return jsonError("Give your job a clear title (8+ characters).", 400);
  if (!CATEGORY_VALUES.has(category as (typeof CATEGORIES)[number]["value"]))
    return jsonError("Pick a valid category.", 400);
  if (description.length < 30)
    return jsonError("Describe the job in a bit more detail (30+ characters).", 400);
  if (budgetMin === null || budgetMin < 10)
    return jsonError("Minimum budget must be at least $10.", 400);
  if (budgetMax === null || budgetMax < budgetMin)
    return jsonError("Maximum budget must be greater than the minimum.", 400);
  if (budgetMax > 100000) return jsonError("Budget looks too high.", 400);
  if (location.length < 2 || location.length > 160)
    return jsonError("Add a location for the job.", 400);
  if (!preferredDate || Number.isNaN(preferredDate.getTime()))
    return jsonError("Choose a preferred date.", 400);

  const [job] = await db
    .insert(jobs)
    .values({
      clientId: user.id,
      title,
      description,
      category,
      budgetMin,
      budgetMax,
      location,
      preferredDate,
    })
    .returning();

  return Response.json({ ok: true, jobId: job.id }, { status: 201 });
});
