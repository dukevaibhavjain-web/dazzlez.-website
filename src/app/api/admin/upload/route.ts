/**
 * POST /api/admin/upload
 *
 * Internal admin tool — accepts a multipart/form-data image file, creates a
 * Payload media document (which handles resizing via sharp), and returns the
 * resulting URL + ID so the admin can reference it in banners / tiles.
 *
 * No auth check: this endpoint is intentionally accessible to whoever can reach
 * the dev server. Add session / secret-header auth before deploying publicly.
 */
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return Response.json(
        { error: "Only JPEG, PNG and WebP images are accepted." },
        { status: 415 },
      );
    }

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      return Response.json(
        { error: `File too large — maximum is ${MAX_MB} MB.` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const payload = await getPayload({ config });

    const doc = await payload.create({
      collection: "media",
      // overrideAccess lets the local API bypass the "must be logged in"
      // check — safe here because this is a trusted server-side route.
      overrideAccess: true,
      data: {
        // Strip extension for the alt text default
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      },
      file: {
        data: buffer,
        name: file.name,
        mimetype: file.type,
        size: file.size,
      },
    });

    return Response.json({
      id: doc.id,
      url: doc.url,
      filename: doc.filename,
      width: (doc as { width?: number }).width ?? null,
      height: (doc as { height?: number }).height ?? null,
    });
  } catch (err) {
    console.error("[admin/upload]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
