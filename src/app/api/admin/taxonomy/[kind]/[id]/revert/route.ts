import { NextRequest, NextResponse } from "next/server";
import { adminAccountOrResponse } from "@/lib/auth/admin";
import { getServices } from "@/lib/services";
import { isTaxonKind, taxonomyError, unknownKind } from "@/lib/taxonomy/http";

/** Makes an old version current again, as a new version. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/admin/taxonomy/[kind]/[id]/revert">) {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  const { kind, id } = await params;
  if (!isTaxonKind(kind)) return unknownKind();
  try {
    const { version } = (await request.json()) as { version: number };
    return NextResponse.json(
      await getServices().taxonomy.revertTaxon(kind, id, Number(version), gate.account.authorId),
    );
  } catch (error) {
    return taxonomyError(error);
  }
}
