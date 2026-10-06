import { NextRequest, NextResponse } from "next/server";
import { adminAccountOrResponse } from "@/lib/auth/admin";
import { getServices } from "@/lib/services";
import type { TaxonPatch } from "@/lib/services/contracts";
import { isTaxonKind, taxonomyError, unknownKind } from "@/lib/taxonomy/http";

/** Saves a family or a genus. Public at once; the previous state stays in its version history. */
export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/admin/taxonomy/[kind]/[id]">) {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  const { kind, id } = await params;
  if (!isTaxonKind(kind)) return unknownKind();
  try {
    const { patch, note, baseVersion } = (await request.json()) as {
      patch: TaxonPatch;
      note?: string;
      baseVersion?: number;
    };
    const version = await getServices().taxonomy.saveTaxon({
      kind,
      id,
      patch,
      note: note ?? "",
      baseVersion,
      actorId: gate.account.authorId,
    });
    return NextResponse.json(version);
  } catch (error) {
    return taxonomyError(error);
  }
}

/** Taxa are archived, never deleted. */
export async function DELETE() {
  return NextResponse.json(
    { error: { code: "invalid", message: "Families and genera cannot be deleted; archive them instead." } },
    { status: 405, headers: { Allow: "PATCH" } },
  );
}
