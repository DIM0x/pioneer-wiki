import { NextResponse } from "next/server";
import { readImage } from "@/lib/media/store";

/** GET /api/media/[file] — an uploaded image (immutable: every upload gets a new name). */
export async function GET(_request: Request, { params }: RouteContext<"/api/media/[file]">) {
  const { file } = await params;
  const data = await readImage(file);
  if (!data) return NextResponse.json({ error: { code: "not_found", message: "No such image" } }, { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
  });
}
