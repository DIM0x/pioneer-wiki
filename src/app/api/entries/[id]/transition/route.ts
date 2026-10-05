import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { ServiceError, type ReviewAction } from "@/lib/services/contracts";
import { verifiedAccountOrResponse } from "@/lib/auth/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await verifiedAccountOrResponse();
    if ("response" in gate) return gate.response;
    if (!gate.account.authorId) return NextResponse.json({ error: { code: "forbidden", message: "An administrator must bind you to a wiki author before editing." } }, { status: 403 });
    const input = await request.json() as { action: ReviewAction; targetRevisionId?: string; note?: string };
    const { id } = await params;
    const revision = await getServices().entries.transition({ entryId: id, actorId: gate.account.authorId, ...input });
    return NextResponse.json(revision);
  } catch (error) {
    const serviceError = error instanceof ServiceError ? error : new ServiceError("invalid", "Invalid transition payload");
    const status = serviceError.code === "forbidden" ? 403 : serviceError.code === "conflict" ? 409 : serviceError.code === "unavailable" ? 503 : 422;
    return NextResponse.json({ error: { code: serviceError.code, message: serviceError.message } }, { status });
  }
}
