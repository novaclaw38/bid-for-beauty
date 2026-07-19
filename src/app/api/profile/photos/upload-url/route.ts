import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { jsonError, withAuth } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const POST = withAuth(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "professional") {
    return jsonError("Only professionals can upload photos.", 403);
  }

  const body = (await req.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (pathname) => {
      const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
      if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
        throw new Error("Only JPEG, PNG, or WebP images are allowed.");
      }
      return {
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 8 * 1024 * 1024,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId: user.id }),
      };
    },
    onUploadCompleted: async () => {
      // No-op: the client creates the pro_photos row itself via
      // POST /api/profile/photos once the upload resolves.
    },
  });

  return Response.json(jsonResponse);
});
