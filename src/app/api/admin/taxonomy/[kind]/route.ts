import { NextRequest, NextResponse } from "next/server";
import { adminAccountOrResponse } from "@/lib/auth/admin";
import { getServices } from "@/lib/services";
import type { TaxonPatch } from "@/lib/services/contracts";
import { isTaxonKind, taxonomyError, unknownKind } from "@/lib/taxonomy/http";

/** Creates a family or a genus. Saving is public at once and recorded as version 1. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/admin/taxonomy/[kind]">) {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  const { kind } = await params;
  if (!isTaxonKind(kind)) return unknownKind();
  try {
    const { patch, note } = (await request.json()) as { patch: TaxonPatch; note?: string };
    const version = await getServices().taxonomy.saveTaxon({
      kind,
      patch,
      note: note ?? "",
      actorId: gate.account.authorId,
    });
    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    return taxonomyError(error);
  }
}
