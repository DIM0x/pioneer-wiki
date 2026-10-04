import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { ServiceError, type ReviewAction } from "@/lib/services/contracts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getServices().auth.getCurrentUser();
    if (!actor) return NextResponse.json({ error: { code: "forbidden", message: "Authentication required" } }, { status: 403 });
    const input = await request.json() as { action: ReviewAction; targetRevisionId?: string; note?: string };
    const { id } = await params;
    const revision = await getServices().entries.transition({ entryId: id, actorId: actor.id, ...input });
    return NextResponse.json(revision);
  } catch (error) {
    const serviceError = error instanceof ServiceError ? error : new ServiceError("invalid", "Invalid transition payload");
    const status = serviceError.code === "forbidden" ? 403 : serviceError.code === "conflict" ? 409 : serviceError.code === "unavailable" ? 503 : 422;
    return NextResponse.json({ error: { code: serviceError.code, message: serviceError.message } }, { status });
  }
}
