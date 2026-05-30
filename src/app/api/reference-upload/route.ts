/**
 * POST /api/reference-upload
 *
 * Accepts a multipart form upload (field name: "file").
 * Saves to Payload's media collection (overrideAccess so auth not required)
 * and returns the public URL.
 *
 * Validation: image/jpeg | image/png | image/webp, max 5 MB.
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { ok: false, error: "Only JPEG, PNG and WebP images are accepted." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "Image must be under 5 MB." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const payload = await getPayload({ config: configPromise });

    // Use overrideAccess so this public API route can write to media
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (payload as any).create({
      collection: "media",
      data: { alt: "Customer reference image" },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name || `ref-${Date.now()}.jpg`,
        size: file.size,
      },
      overrideAccess: true,
    });

    return Response.json({ ok: true, url: doc.url as string, id: doc.id });
  } catch (err) {
    console.error("[reference-upload]", err);
    return Response.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
