import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { blankCount } from "@/lib/links/chart";
import { LinksChart } from "@/components/links/LinksChart";

export const metadata: Metadata = { title: "友链 Links" };

/**
 * Part II · 友链 Links — one engraved, hand-coloured map of a single land.
 * Pioneer Wiki holds the capital; every friend site holds a territory of its
 * own, and the land still blank is where the next friends will be charted.
 * The index under the map lists every territory by grid square.
 */
export default async function LinksPart() {
  const { lang } = await getT();
  const zh = lang === "zh";
  const links = await getServices().community.listLinks();

  return (
    <div data-part="links" className="mt-(--space-block) flex flex-col">
      <header className="pw-double-rule mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-[-0.03em]">
          {zh ? "友邻疆域" : "Friendly Lands"}{" "}
          <span lang={zh ? "en" : "zh-CN"} className="ml-2 align-middle text-h3 font-normal text-ink-3">
            {zh ? "Friendly Lands" : "友邻疆域"}
          </span>
        </h2>
        <p className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">
          {zh
            ? `${links.length} 处疆域 · ${blankCount(links.length)} 块未勘`
            : `${links.length} territories · ${blankCount(links.length)} uncharted`}
        </p>
      </header>

      <LinksChart links={links} lang={lang} />

      <aside className="pw-ink-over mt-(--space-block) flex flex-wrap items-center justify-between gap-6 pt-6">
        <p className="max-w-[36em] text-small text-ink-2">
          {zh
            ? "地图上的留白是尚未勘测的土地，虚线圈出的那一块，留给下一位友邻。想与先锋维基互换友链？在交流区留下站点名称、地址与一句介绍，下一次修订时，那片疆域就归你。"
            : "The blank on the map is land not yet surveyed, and the dashed territory is kept for the next friend. Want to exchange links with Pioneer Wiki? Leave your site's name, address and one line about it in the forum — in the next revision, that territory is yours."}
        </p>
        <Link href="/forum" scroll={false} className="pw-link text-small text-part-ink">
          {zh ? "去交流区" : "To the forum"} <span className="pw-nudge">→</span>
        </Link>
      </aside>
    </div>
  );
}
