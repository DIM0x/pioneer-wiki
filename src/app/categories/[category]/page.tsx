import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { EntrySummary } from "@/lib/model/types";
import { CONTENT_ROLES, LEVELS } from "@/lib/model/vocab";
import { otherLang, pick } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { getCatalogue } from "@/lib/taxonomy/catalogue";
import { RunningHead } from "@/components/book/RunningHead";
import { PageTurn } from "@/components/book/PageTurn";
import { Markdown } from "@/components/markdown/Markdown";
import { cataloguePlate } from "@/lib/taxonomy/plates";
import { CatalogueFigure, PendingPlate } from "@/components/taxonomy/Taxonomy";

export async function generateMetadata({ params }: PageProps<"/categories/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getServices().taxonomy.getCategory(slug);
  return category ? { title: `${category.name.zh} ${category.name.en} · ${category.scientificName}` } : {};
}

/**
 * 门类 — a genus page. The species filed under this genus are its exhibit;
 * entries filed elsewhere that also concern it stand apart as cross-genus
 * references (跨属参照) and keep their own family, genus and species.
 * A genus with nothing published yet is an exhibit case awaiting accession.
 */
export default async function CategoryPage({ params }: PageProps<"/categories/[category]">) {
  const { category: slug } = await params;
  const { lang, t } = await getT();
  const zh = lang === "zh";
  const other = otherLang(lang);
  const catalogue = await getCatalogue();
  const category = catalogue.categories.find((c) => c.slug === slug || c.formerSlugs.includes(slug));
  if (!category) notFound();
  if (category.slug !== slug) permanentRedirect(`/categories/${category.slug}`);
  const family = catalogue.familyOf(category);
  if (!family) notFound();

  const filed = catalogue.filed(category);
  const referenced = catalogue.referenced(category);
  const familyNumeral = catalogue.familyNumeral(family);
  const n = catalogue.genusNumber(category);
  const siblings = catalogue.genera(family);
  const at = siblings.indexOf(category);
  const turn = (i: number) => {
    const c = siblings[i];
    return c
      ? {
          href: `/categories/${c.slug}`,
          kicker: `${familyNumeral}.${i + 1} · ${c.scientificName}`,
          title: c.name[lang],
        }
      : null;
  };

  return (
    <div data-phylum={family.id} className="flex flex-col">
      <RunningHead
        left={
          <>
            <Link href={`/families/${family.slug}`} className="no-underline hover:text-ink">
              {zh ? "科" : "Family"} {familyNumeral} · {family.name[lang]}
            </Link>{" "}
            · {zh ? "属" : "Genus"} {n}
          </>
        }
        right={
          <>
            <i>{family.scientificName}</i> › <i>{category.scientificName}</i>
          </>
        }
      />

      <header className="mt-(--space-block) grid gap-x-(--space-block) gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="pw-smallcaps text-small text-phylum-ink">
            {zh ? "门类" : "Genus"} {familyNumeral}.{n} ·{" "}
            <i className="normal-case">
              {family.scientificName} › {category.scientificName}
            </i>
          </p>
          <h1 className="mt-4 font-display">
            <span className="block text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.95] font-[480] tracking-[-0.03em] text-balance">
              {category.name[lang]}
            </span>
            <span className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-h4 font-normal">
              <i className="text-phylum-ink">{category.scientificName}</i>
              <span lang={other === "zh" ? "zh-CN" : "en"} className="text-ink-3">
                {category.name[other]}
              </span>
            </span>
          </h1>
          {category.intro[lang] ? (
            <p className="mt-6 max-w-[40ch] text-lead text-ink-2">{category.intro[lang]}</p>
          ) : null}
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <CatalogueFigure
            plate={cataloguePlate("genus", category.id)}
            lang={lang}
            subject={category.scientificName}
            ratio="4 / 3"
            priority
            caption
          />
        </div>
      </header>

      {/* ── The genus's own species ─────────────────────────────── */}
      <section aria-labelledby="species" className="mt-(--space-section)">
        <h2 id="species" className="pw-double-rule mb-10 flex items-baseline justify-between gap-6">
          <span className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-0.02em]">
            {zh ? "种" : "Species"}{" "}
            <span lang={zh ? "en" : "zh-CN"} className="ml-2 align-middle text-h4 font-normal text-ink-3">
              {zh ? "Species" : "种"}
            </span>
          </span>
          <span className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">
            {filed.length} {zh ? "件" : filed.length === 1 ? "specimen" : "specimens"}
          </span>
        </h2>

        {filed.length ? (
          <ol className="grid gap-x-(--space-block) gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {filed.map((e, i) => (
              <SpeciesCard key={e.id} entry={e} index={i} lang={lang} />
            ))}
          </ol>
        ) : (
          <AwaitingAccession
            lang={lang}
            representative={category.representativeSlug}
            genus={category.scientificName}
            slug={category.slug}
          />
        )}
      </section>

      {/* ── Cross-genus references ──────────────────────────────── */}
      {referenced.length ? (
        <section aria-labelledby="references" className="mt-(--space-section)">
          <h2 id="references" className="mb-2 flex items-baseline gap-4">
            <span className="font-display text-h2 leading-none">{zh ? "跨属参照" : "Cross-genus references"}</span>
            <span lang={zh ? "en" : "zh-CN"} className="text-small text-ink-3">
              {zh ? "Cross-genus references" : "跨属参照"}
            </span>
          </h2>
          <p className="mb-8 max-w-[52ch] text-small text-ink-3">
            {zh
              ? "这些条目归在别的属下，但也与本属有关。它们保留原来的科、属与种。"
              : "These entries are filed under other genera but also concern this one. They keep their own family, genus and species."}
          </p>
          <ol className="flex flex-col">
            {referenced.map((e) => {
              const home = catalogue.category(e.categoryId);
              const homeFamily = home ? catalogue.familyOf(home) : undefined;
              return (
                <li key={e.id} className="border-b border-dashed border-rule-strong first:border-t">
                  <Link
                    href={`/entries/${e.slug}`}
                    data-phylum={homeFamily?.id}
                    className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4 text-ink no-underline"
                  >
                    <span aria-hidden="true" className="text-phylum-ink">
                      ⤳
                    </span>
                    <span className="font-display text-h4">
                      <span className="pw-link">{pick(e.title, lang)}</span>
                    </span>
                    <i className="font-display text-small text-ink-3">{e.species}</i>
                    <span aria-hidden="true" className="pw-leader" />
                    {home && homeFamily ? (
                      <span className="text-meta text-phylum-ink">
                        {zh ? "藏于" : "kept in"} <i>{homeFamily.scientificName}</i> › <i>{home.scientificName}</i> ·{" "}
                        {home.name[lang]}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {category.essay ? (
        <section aria-label={zh ? "属志" : "About the genus"} className="mt-(--space-section) max-w-(--measure)">
          <Markdown lang={lang}>{category.essay}</Markdown>
        </section>
      ) : null}

      {category.links.length ? (
        <section aria-labelledby="genus-links" className="pw-ink-over mt-(--space-block) pt-6">
          <h2 id="genus-links" className="mb-3 pw-smallcaps text-small text-ink-3">
            {zh ? "相关链接" : "See also"}
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small">
            {category.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  className="pw-link text-phylum-ink"
                  {...(l.url.startsWith("/") ? {} : { target: "_blank", rel: "noreferrer" })}
                >
                  {l.label[lang] || l.label[other]}
                  {l.url.startsWith("/") ? null : " ↗"}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PageTurn
        prev={turn(at - 1)}
        next={turn(at + 1)}
        label={{ prev: t("book.prev"), next: t("book.next"), nav: t("book.pageNav") }}
      />
    </div>
  );
}

/** One species in the genus's exhibit: the plate still to be engraved, then its label. */
function SpeciesCard({ entry, index, lang }: { entry: EntrySummary; index: number; lang: "zh" | "en" }) {
  const zh = lang === "zh";
  return (
    <li data-reveal="rise" style={{ "--i": index % 3 } as React.CSSProperties}>
      <Link href={`/entries/${entry.slug}`} className="group flex flex-col no-underline">
        <CatalogueFigure
          plate={cataloguePlate("species", entry.slug)}
          lang={lang}
          subject={entry.species}
          ratio="4 / 3"
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
          className="transition-transform duration-(--dur-base) ease-(--ease-grow) group-hover:-translate-y-0.5"
        />
        <span className="mt-5 flex items-baseline gap-3 font-mono text-meta text-ink-3">
          <span className="pw-stamp">{entry.id}</span>
          <span>
            {LEVELS[entry.level][lang]} · {CONTENT_ROLES[entry.contentRole][lang]}
          </span>
        </span>
        <span className="mt-3 font-display text-h3 leading-snug text-ink">
          <span className="pw-link">{pick(entry.title, lang)}</span>
        </span>
        <i className="mt-1 font-display text-lead text-phylum-ink">{entry.species}</i>
        <span className="mt-2 line-clamp-3 text-small text-ink-2">{pick(entry.summary, lang)}</span>
        <span className="sr-only">{zh ? "打开条目" : "Open entry"}</span>
      </Link>
    </li>
  );
}

/**
 * 待入藏 — the exhibit case of a genus with nothing published yet: the case
 * is labelled and lit, its specimen still being prepared.
 */
function AwaitingAccession({
  lang,
  genus,
  slug,
  representative,
}: {
  lang: "zh" | "en";
  genus: string;
  slug: string;
  representative?: string;
}) {
  const zh = lang === "zh";
  return (
    <div className="grid items-center gap-x-(--space-block) gap-y-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <PendingPlate lang={lang} subject={genus} ratio="4 / 3" className="opacity-80" />
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <p className="pw-accession text-lead">{zh ? "待入藏" : "Awaiting accession"}</p>
        <p className="mt-4 font-display text-h3 leading-snug text-ink">
          {zh ? "这一属的第一件标本正在制备。" : "The first specimen of this genus is being prepared."}
        </p>
        <p className="mt-3 max-w-[44ch] text-small text-ink-2">
          {zh
            ? "代表条目的正文、物种核验与图版都在审校中，通过之后会在这里入藏。"
            : "Its representative entry, species verification and plate are under review; it will be accessioned here once they pass."}
          {representative ? (
            <span className="mt-2 block font-mono text-meta tracking-[0.1em] text-ink-3">
              {zh ? "预定条目" : "Reserved entry"} · {representative}
            </span>
          ) : null}
        </p>
        <Link href={`/editor/new?genus=${slug}`} className="pw-link mt-6 inline-block text-small text-phylum-ink">
          {zh ? "为这一属撰写条目" : "Write an entry for this genus"} →
        </Link>
      </div>
    </div>
  );
}
