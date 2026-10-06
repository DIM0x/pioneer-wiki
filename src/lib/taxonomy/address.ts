import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getServices } from "@/lib/services";

const CATALOGUE = /^\/(families|categories)\/([^/]+)\/?$/;

/**
 * Family and genus pages stream (root loading.tsx), so once rendering starts
 * the status is always 200. This settles the address first, in proxy: the
 * current slug renders, a former slug answers a real 308 to the current one,
 * and an unknown or archived taxon answers a real 404 with the not-found page.
 * Returns null for any other path.
 */
export async function resolveCatalogueAddress(request: NextRequest): Promise<NextResponse | null> {
  const matched = CATALOGUE.exec(request.nextUrl.pathname);
  if (!matched) return null;
  const [, section, raw] = matched;
  let slug: string;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    return notFound(request);
  }
  const { taxonomy } = getServices();
  const taxon = section === "families" ? await taxonomy.getFamily(slug) : await taxonomy.getCategory(slug);
  if (!taxon) return notFound(request);
  if (taxon.slug !== slug) {
    const to = request.nextUrl.clone();
    to.pathname = `/${section}/${taxon.slug}`;
    return NextResponse.redirect(to, 308);
  }
  return null;
}

function notFound(request: NextRequest) {
  // Render the site's not-found page under a real 404 status.
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}
