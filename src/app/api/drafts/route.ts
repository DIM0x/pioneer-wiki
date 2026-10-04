import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { ServiceError, type DraftInput } from "@/lib/services/contracts";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as Omit<DraftInput, "authorId">;
    const actor = await getServices().auth.getCurrentUser();
    if (!actor) return NextResponse.json({ error: { code: "forbidden", message: "Authentication required" } }, { status: 403 });
    const revision = await getServices().entries.saveDraft({ ...input, authorId: actor.id });
    return NextResponse.json(revision, { status: 201 });
  } catch (error) {
    const serviceError = error instanceof ServiceError ? error : new ServiceError("invalid", "Invalid draft payload");
    const status = serviceError.code === "forbidden" ? 403 : serviceError.code === "conflict" ? 409 : serviceError.code === "unavailable" ? 503 : 422;
    return NextResponse.json({ error: { code: serviceError.code, message: serviceError.message } }, { status });
  }
}
