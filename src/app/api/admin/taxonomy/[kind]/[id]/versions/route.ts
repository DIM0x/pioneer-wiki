import { NextResponse } from "next/server";
import { adminAccountOrResponse } from "@/lib/auth/admin";
import { getServices } from "@/lib/services";
import { isTaxonKind, taxonomyError, unknownKind } from "@/lib/taxonomy/http";

/** The version history of a family or a genus, newest first. */
export async function GET(_request: Request, { params }: RouteContext<"/api/admin/taxonomy/[kind]/[id]/versions">) {
  const gate = await adminAccountOrResponse();
  if ("response" in gate) return gate.response;
  const { kind, id } = await params;
  if (!isTaxonKind(kind)) return unknownKind();
  try {
    return NextResponse.json(await getServices().taxonomy.listTaxonVersions(kind, id));
  } catch (error) {
    return taxonomyError(error);
  }
}
