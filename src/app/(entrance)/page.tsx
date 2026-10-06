import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { otherLang, translate } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/format";
import { getCatalogue } from "@/lib/taxonomy/catalogue";
import { vignetteAsset } from "@/components/book/Vignette";
import { Overture, type OvertureCut } from "@/components/home/Overture";
import { FamilyIndex, type FamilyRow } from "@/components/home/FamilyIndex";
import { cataloguePlate } from "@/lib/taxonomy/plates";
import { CatalogueFigure } from "@/components/taxonomy/Taxonomy";

function overtureCuts(): OvertureCut[] {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "public", "overture", "cuts.json"), "utf8")) as OvertureCut[];
  } catch {
    return [];
  }
}

/**
 * The small engraving facing each family in the contents: one real member of
 * the family (public/vignettes/fam-*, prompts in tools/family-vignettes.json).
 */
const FAMILY_EMBLEMS: Record<string, { vignette: string; species: string }> = {
  ai: { vignette: "fam-corvidae", species: "Garrulus glandarius" },
  "software-development": { vignette: "fam-rosaceae", species: "Rosa canina" },
  "systems-infrastructure": { vignette: "fam-desmidiaceae", species: "Micrasterias rotata" },
  "data-information": { vignette: "fam-sciuridae", species: "Sciurus vulgaris" },
  "computing-foundations": { vignette: "fam-nymphalidae", species: "Vanessa cardui" },
  "security-reliability": { vignette: "fam-geoemydidae", species: "Mauremys reevesii" },
  "learning-collaboration": { vignette: "fam-cichlidae", species: "Julidochromis ornatus" },
};

/**
 * Part I · 博物 Wiki — the natural-history book. Below the entrance stage: the
 * contents of the seven families and the latest revisions. On the first visit
 * of a session the opening titles play over everything first.
 */
export default async function WikiPart() {
  const { lang, t } = await getT();
  const zh = lang === "zh";
  const catalogue = await getCatalogue();
  const recent = [...catalogue.entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const birds = ["fly-finch", "fly-swallow", "fly-tit", "fly-wren"].map(vignetteAsset).filter((b) => b !== null);

  const families: FamilyRow[] = catalogue.families.map((f) => {
    const genera = catalogue.genera(f).map((c) => ({
      slug: c.slug,
      name: c.name,
      scientificName: c.scientificName,
      count: catalogue.filed(c).length,
    }));
    return {
      id: f.id,
      slug: f.slug,
      numeral: catalogue.familyNumeral(f),
      name: f.name,
      scientificName: f.scientificName,
      taxonNameZh: f.taxonNameZh,
      count: genera.reduce((n, g) => n + g.count, 0),
      genera,
      emblem: familyEmblem(f.id),
    };
  });
  function familyEmblem(id: string): FamilyRow["emblem"] {
    const emblem = FAMILY_EMBLEMS[id];
    const art = emblem ? vignetteAsset(emblem.vignette) : null;
    return art ? { ...art, alt: zh ? `版画：${emblem.species}` : `Engraving of ${emblem.species}` } : null;
  }
  const familyOfEntry = (categoryId: string) => {
    const c = catalogue.category(categoryId);
    return c ? catalogue.familyOf(c) : undefined;
  };

  return (
    <div className="flex flex-col">
      <Overture cuts={overtureCuts()} birds={birds} />

      {/* ── Contents: the seven families ─────────────────────────── */}
      <nav aria-labelledby="contents" className="mt-(--space-block)">
        <div className="pw-double-rule mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <h2 id="contents" className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-[-0.03em]">
            {t("book.contents")}{" "}
            <span lang={zh ? "en" : "zh-CN"} className="ml-2 align-middle text-h3 font-normal text-ink-3">
              {translate(otherLang(lang), "book.contents")}
            </span>
          </h2>
          <span className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">
            {families.length} {zh ? "科" : "families"} · {catalogue.categories.length} {zh ? "属" : "genera"}
          </span>
        </div>
        <FamilyIndex rows={families} lang={lang} />
      </nav>

      {/* ── Latest revisions ─────────────────────────────────────── */}
      <section aria-labelledby="recent" className="mt-(--space-section)">
        <h2 id="recent" className="mb-10 font-display text-h3 text-ink">
          {t("index.recent")}
        </h2>
        <ol className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {recent.map((e, i) => {
            const family = familyOfEntry(e.categoryId);
            return (
              <li key={e.id} data-phylum={family?.id}>
                <Link href={`/entries/${e.slug}`} className="group flex flex-col no-underline">
                  {/* The species plates are being engraved; the place keeps the plate's proportion. */}
                  <span data-reveal="fade" style={{ "--i": i } as React.CSSProperties} className="pw-lift block">
                    <CatalogueFigure
                      plate={cataloguePlate("species", e.slug)}
                      lang={lang}
                      subject={e.species}
                      ratio="4 / 3"
                      sizes="(min-width: 640px) 30vw, 90vw"
                    />
                  </span>
                  <span className="mt-4 flex items-baseline gap-3 font-mono text-meta text-ink-3">
                    <span className="pw-stamp">{e.id}</span>
                    <time dateTime={e.updatedAt}>{formatDate(e.updatedAt, lang)}</time>
                  </span>
                  <span className="mt-2 font-display text-h3 text-ink">
                    <span className="pw-link">{e.title[lang]}</span>
                  </span>
                  <span lang={zh ? "en" : "zh-CN"} className="text-small text-ink-3">
                    {e.title[otherLang(lang)]}
                    {e.species ? <i className="ml-2 font-display text-phylum-ink">{e.species}</i> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
