import { NextResponse, type NextRequest } from "next/server";
import type { DomainId } from "@/lib/model/types";
import { LEGACY_DOMAINS } from "@/lib/taxonomy/legacy";
import { getServices } from "@/lib/services";

/**
 * The ten phyla before the family → genus catalogue. Each old address answers
 * with a permanent 308 to where its specimens went: the genus they moved into
 * whole, or the family overview when the phylum was split.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/domains/[domain]">) {
  const { domain } = await params;
  const target = LEGACY_DOMAINS[domain as DomainId];
  if (!target) return NextResponse.redirect(new URL("/#contents", request.url), 308);
  const { taxonomy } = getServices();
  // Follow a later rename: the stable id resolves to the taxon's current slug.
  const taxon = target.kind === "family" ? await taxonomy.getFamily(target.id) : await taxonomy.getCategory(target.id);
  const path = target.kind === "family" ? "families" : "categories";
  return NextResponse.redirect(new URL(`/${path}/${taxon?.slug ?? target.id}`, request.url), 308);
}
