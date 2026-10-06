import type { Metadata } from "next";
import Link from "next/link";
import type { EntrySummary } from "@/lib/model/types";
import { otherLang, translate } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { buildTree } from "@/lib/taxonomy/tree";
import { cn } from "@/lib/utils";
import { RunningHead } from "@/components/book/RunningHead";
import { RelationList } from "@/components/entry/RelationList";
import { TreeOfLife } from "@/components/graph/TreeOfLife";

export const metadata: Metadata = { title: "Tree of life 生命之树" };

/**
 * 生命之树 — the whole catalogue as one engraved plate: the root, seven family
 * boughs, their genera and the species at the rim, with the relations between
 * species bundled through the tree. The list is its equal alternative:
 * ?view=list forces it, and small screens always get it.
 */
export default async function GraphPage({ searchParams }: PageProps<"/graph">) {
  const { view } = await searchParams;
  const listOnly = view === "list";
  const { lang, t } = await getT();
  const zh = lang === "zh";
  const { entries, taxonomy } = getServices();
  const [all, relations, families, categories] = await Promise.all([
    entries.listEntries({ status: ["published"] }),
    entries.listRelations(),
    taxonomy.listFamilies(),
    taxonomy.listCategories(),
  ]);
  const byId = new Map<string, EntrySummary>(all.map((e) => [e.id, e]));
  // Readers see relations between published species only.
  const visible = relations.filter((r) => byId.has(r.from) && byId.has(r.to));
  const tree = buildTree({ families, categories, entries: all, relations: visible });

  const toggle = (
    <nav
      aria-label={`${t("graph.viewGraph")} / ${t("graph.viewList")}`}
      className="hidden gap-5 border-b border-rule md:flex"
    >
      {[
        { href: "/graph", label: t("graph.viewGraph"), on: !listOnly },
        { href: "/graph?view=list", label: t("graph.viewList"), on: listOnly },
      ].map((o) => (
        <Link
          key={o.href}
          href={o.href}
          scroll={false}
          aria-current={o.on ? "page" : undefined}
          className={cn(
            "-mb-px border-b py-2 text-small no-underline",
            o.on ? "border-brick text-ink" : "border-transparent text-ink-3 hover:text-ink",
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex flex-col">
      <RunningHead
        left={`${t("site.name")} · ${t("graph.heading")}`}
        right={`${tree.families.length} ${zh ? "科" : "families"} · ${tree.genera.length} ${zh ? "属" : "genera"} · ${visible.length} ${zh ? "条关系" : "relations"}`}
      />

      <header className="mt-(--space-block) grid gap-6 lg:grid-cols-12">
        <h1 className="font-display lg:col-span-7">
          <span className="block text-[clamp(3rem,6.5vw,5.75rem)] leading-[0.95] font-[480] tracking-[-0.03em]">
            {t("graph.heading")}
          </span>
          <span lang={zh ? "en" : "zh-CN"} className="mt-3 block text-h4 font-normal text-ink-3">
            {translate(otherLang(lang), "graph.heading")}
          </span>
        </h1>
        <div className="flex flex-col justify-end gap-5 lg:col-span-5">
          <p className="text-small text-ink-2">{t("graph.lede")}</p>
          {toggle}
        </div>
      </header>

      {!listOnly ? (
        <figure data-mount="tree-of-life" className="mt-(--space-block) hidden md:block">
          <div className="mx-auto max-w-[min(100%,72rem)]">
            <TreeOfLife tree={tree} lang={lang} title={t("graph.heading")} />
          </div>
          <figcaption className="mt-6 text-meta text-ink-3">{t("graph.listNote")}</figcaption>
        </figure>
      ) : null}
      <section
        aria-label={t("graph.viewList")}
        className={cn("mt-(--space-block) lg:mx-auto lg:w-full lg:max-w-3xl", !listOnly && "md:hidden")}
      >
        <RelationList relations={visible} entries={byId} lang={lang} />
      </section>
    </div>
  );
}
