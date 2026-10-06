import Link from "next/link";
import type { Entry, EntrySummary, Lang, Relation } from "@/lib/model/types";
import type { TocItem } from "@/lib/markdown/bilingual";
import { pick, translate } from "@/lib/i18n/dictionary";
import { toRoman, catalogueNumber } from "@/lib/roman";
import { cn } from "@/lib/utils";
import type { CataloguePlate } from "@/lib/taxonomy/plates";
import { CatalogueFigure } from "@/components/taxonomy/Taxonomy";
import { RelationList } from "./RelationList";

export type SpecimenView = "macro" | "micro" | "relations";
export const SPECIMEN_VIEWS: SpecimenView[] = ["macro", "micro", "relations"];

interface SpecimenPanelProps {
  entry: Entry;
  view: SpecimenView;
  lang: Lang;
  toc: TocItem[];
  relations: Relation[];
  entries: Map<string, EntrySummary>;
  /** The species plate, once it has passed review. */
  plate: CataloguePlate | null;
}

/**
 * The facing page of a specimen: one panel, three ways of looking at it.
 * Macro = the organism (plate); Micro = its anatomy (sections); Relations =
 * its ties to others. Views are links (?view=) so every state has a URL.
 *
 * The species plates of the catalogue are still being engraved, so the macro
 * view shows the plate in preparation; the old analogue plates no longer
 * match the species and are not shown.
 */
export function SpecimenPanel({ entry, view, lang, toc, relations, entries, plate }: SpecimenPanelProps) {
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  const labels: Record<SpecimenView, string> = {
    macro: t("entry.view.macro"),
    micro: t("entry.view.micro"),
    relations: t("entry.view.relations"),
  };
  const plateNo = toRoman(catalogueNumber(entry.id));

  return (
    <div data-mount="specimen-panel" data-view={view}>
      <nav aria-label={t("entry.views")} className="mb-6 flex gap-5 border-b border-rule">
        {SPECIMEN_VIEWS.map((v) => (
          <Link
            key={v}
            href={v === "macro" ? `/entries/${entry.slug}` : `/entries/${entry.slug}?view=${v}`}
            scroll={false}
            replace
            aria-current={v === view ? "true" : undefined}
            className={cn(
              "-mb-px border-b py-2 text-small no-underline transition-colors duration-(--dur-quick)",
              v === view ? "border-brick text-ink" : "border-transparent text-ink-3 hover:text-ink",
            )}
          >
            {labels[v]}
          </Link>
        ))}
      </nav>

      {view === "macro" ? (
        <figure className="flex flex-col">
          <CatalogueFigure plate={plate} lang={lang} subject={entry.species} priority />
          <figcaption className="pw-letterpress mt-4 text-lead leading-snug text-ink-2">
            <span className="mr-2 text-phylum-ink italic">
              {t("book.plate")} {plateNo}.
            </span>
            {entry.species ? <i>{entry.species}</i> : pick(entry.title, lang)}
          </figcaption>
        </figure>
      ) : view === "micro" ? (
        <section aria-label={t("entry.anatomy")}>
          <h2 className="mb-4 pw-smallcaps text-small text-ink-3">{t("entry.anatomy")}</h2>
          <ol className="flex flex-col">
            {toc.map((item, i) => (
              <li key={item.id} className={item.depth === 3 ? "pl-8" : ""}>
                <a
                  href={`#${item.id}`}
                  className="flex items-baseline gap-3 border-b border-rule py-2 text-small text-ink no-underline hover:text-indigo"
                >
                  <span className="w-6 shrink-0 font-mono text-meta text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    {item.parts.zh && item.parts.en ? (lang === "zh" ? item.parts.zh : item.parts.en) : item.parts.text}
                    {item.parts.zh && item.parts.en ? (
                      <span className="ml-2 text-meta text-ink-3 italic">
                        {lang === "zh" ? item.parts.en : item.parts.zh}
                      </span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : relations.length ? (
        <RelationList relations={relations} entries={entries} lang={lang} focusId={entry.id} />
      ) : (
        <p className="text-small text-ink-3 italic">{t("entry.noRelations")}</p>
      )}
    </div>
  );
}
