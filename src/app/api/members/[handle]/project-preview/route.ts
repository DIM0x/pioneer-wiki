import { NextRequest, NextResponse } from "next/server";
import { ownerOf } from "@/lib/members/owner";
import { projectUrl } from "@/lib/members/project-validation";
import { importProjectPreview } from "@/lib/members/preview";

export const runtime = "nodejs";

/** Explicit, owner-only preview import; importing does not save or publish the draft. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/members/[handle]/project-preview">) {
  const { handle } = await params;
  const denied = await ownerOf(handle);
  if (denied) return denied;
  try {
    const input = await request.json();
    const preview = await importProjectPreview(projectUrl(input?.url));
    return NextResponse.json(preview, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "unavailable",
          message: "Preview unavailable. You can still describe and save this project manually.",
        },
      },
      { status: 422 },
    );
  }
}
