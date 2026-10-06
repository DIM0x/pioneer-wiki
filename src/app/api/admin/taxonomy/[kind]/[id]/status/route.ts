import { NextRequest, NextResponse } from "next/server";
import { adminAccountOrResponse } from "@/lib/auth/admin";
import { getServices } from "@/lib/services";
import { isTaxonKind, taxonomyError, unknownKind } from "@/lib/taxonomy/http";

/** Archives or restores a family or a genus. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/admin/taxonomy/[kind]/[id]/status">) {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  const { kind, id } = await params;
  if (!isTaxonKind(kind)) return unknownKind();
  try {
    const { status, note } = (await request.json()) as { status: "active" | "archived"; note?: string };
    const { taxonomy } = getServices();
    if (status !== "active" && status !== "archived")
      return NextResponse.json({ error: { code: "invalid", message: "Unknown status." } }, { status: 422 });
    const version =
      status === "archived"
        ? await taxonomy.archiveTaxon(kind, id, gate.account.authorId, note)
        : await taxonomy.restoreTaxon(kind, id, gate.account.authorId, note);
    return NextResponse.json(version);
  } catch (error) {
    return taxonomyError(error);
  }
}
