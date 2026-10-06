import type { Metadata } from "next";
import type { FriendLink } from "@/lib/model/types";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { BASE, blankCount } from "@/lib/links/chart";
import { RunningHead } from "@/components/book/RunningHead";
import { LinksChart } from "@/components/links/LinksChart";

export const metadata: Metadata = { title: "Links map 友链地图样张", robots: { index: false } };

const EMBLEMS = ["geo-lighthouse", "geo-ship", "geo-compass", "geo-sextant", "geo-globe", "geo-islands"];

/**
 * Stable review entry for the Links map at any number of friends:
 * /dev/links-map?n=40 adds 40 placeholder sites to the real list, to check
 * that the sheet keeps its size, blank land is claimed first and territories
 * then split.
 */
export default async function LinksMapSpecimen({ searchParams }: PageProps<"/dev/links-map">) {
  const { n } = await searchParams;
  const extra = Math.max(0, Math.min(200, Number(n) || 0));
  const { lang } = await getT();
  const real = await getServices().community.listLinks();
  const placeholders: FriendLink[] = Array.from({ length: extra }, (_, i) => ({
    id: `l-specimen-${String(i + 1).padStart(3, "0")}`,
    name: { zh: `样张站点 ${i + 1}`, en: `Specimen ${i + 1}` },
    url: `https://example.org/${i + 1}`,
    description: { zh: "用于检查地图版式的占位站点。", en: "A placeholder for checking the map's layout." },
    emblem: EMBLEMS[i % EMBLEMS.length],
    since: `2027-${String((Math.floor(i / 28) % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    sample: true,
  }));
  const links = [...real, ...placeholders];
  return (
    <div data-part="links" className="flex flex-col gap-(--space-block)">
      <RunningHead
        left="Dev · Links map"
        right={`/dev/links-map?n=${extra} · ${links.length} links · ${blankCount(links.length)} blank · ${BASE} base seats`}
      />
      <LinksChart links={links} lang={lang} />
    </div>
  );
}
