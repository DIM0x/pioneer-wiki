import { realmSvg } from "@/lib/links/realm-svg";

export const dynamic = "force-static";

/** The static base of the Links map, placed on the page with an external <use> (lib/links/realm-svg.ts). */
export function GET() {
  return new Response(realmSvg().svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=31536000, immutable" },
  });
}
