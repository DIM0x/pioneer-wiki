import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { otherLang } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { getCatalogue } from "@/lib/taxonomy/catalogue";
import { RunningHead } from "@/components/book/RunningHead";
import { PageTurn } from "@/components/book/PageTurn";
import { Markdown } from "@/components/markdown/Markdown";
import { cataloguePlate } from "@/lib/taxonomy/plates";
import { Brace, CatalogueFigure } from "@/components/taxonomy/Taxonomy";

export async function generateMetadata({ params }: PageProps<"/families/[family]">): Promise<Metadata> {
  const { family: slug } = await params;
  const family = await getServices().taxonomy.getFamily(slug);
  return family ? { title: `${family.name.zh} ${family.name.en} · ${family.scientificName}` } : {};
}

/**
 * 大类 — a family page. It lists the family's genera and nothing below them:
 * the reader goes down one rank at a time. The genera are set as a systema
 * table — a Linnaean brace from the family to its column of genera.
 */
export default async function FamilyPage({ params }: PageProps<"/families/[family]">) {
  const { family: slug } = await params;
  const { lang, t } = await getT();
  const zh = lang === "zh";
  const other = otherLang(lang);
  const catalogue = await getCatalogue();
  const family = catalogue.families.find((f) => f.slug === slug || f.formerSlugs.includes(slug));
  if (!family) notFound();
  if (family.slug !== slug) permanentRedirect(`/families/${family.slug}`);

  const numeral = catalogue.familyNumeral(family);
  const genera = catalogue.genera(family);
  const at = catalogue.families.indexOf(family);
  const turn = (i: number) => {
    const f = catalogue.families[i];
    return f
      ? {
          href: `/families/${f.slug}`,
          kicker: `${zh ? "科" : "Family"} ${catalogue.familyNumeral(f)}`,
          title: f.name[lang],
        }
      : null;
  };
  const filedCount = genera.reduce((n, c) => n + catalogue.filed(c).length, 0);

  return (
    <div data-phylum={family.id} className="flex flex-col">
      <RunningHead
        left={
          <>
            <Link href="/#contents" className="no-underline hover:text-ink">
              {t("book.contents")}
            </Link>{" "}
            · {zh ? "科" : "Family"} {numeral}
          </>
        }
        right={
          <>
            <i>{family.scientificName}</i>
            {family.taxonNameZh ? ` · ${family.taxonNameZh}` : null}
          </>
        }
      />

      <header className="mt-(--space-block) grid gap-x-(--space-block) gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="flex items-baseline gap-4">
            <span
              aria-hidden="true"
              className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-none text-phylum italic"
            >
              {numeral}
            </span>
            <span className="pw-smallcaps text-small text-phylum-ink">
              {zh ? "大类" : "Family"} · <i className="normal-case">{family.scientificName}</i>
            </span>
          </p>
          <h1 className="mt-4 font-display">
            <span className="block text-[clamp(3rem,6.5vw,5.75rem)] leading-[0.95] font-[480] tracking-[-0.03em] text-balance">
              {family.name[lang]}
            </span>
            <span lang={other === "zh" ? "zh-CN" : "en"} className="mt-3 block text-h4 font-normal text-ink-3">
              {family.name[other]}
            </span>
          </h1>
          {family.intro[lang] ? <p className="mt-6 max-w-[40ch] text-lead text-ink-2">{family.intro[lang]}</p> : null}
          <p className="mt-6 font-mono text-meta tracking-[0.12em] text-ink-3 uppercase">
            {genera.length} {zh ? "属" : "genera"} · {filedCount} {zh ? "件已入藏标本" : "specimens accessioned"}
          </p>
        </div>
        <div className="lg:col-span-5 lg:pt-6">
          <CatalogueFigure
            plate={cataloguePlate("family", family.id)}
            lang={lang}
            subject={family.scientificName}
            priority
            caption
          />
        </div>
      </header>

      {/* ── Systema: the family's genera ─────────────────────────── */}
      <section aria-labelledby="genera" className="mt-(--space-section)">
        <h2 id="genera" className="pw-double-rule mb-10 flex items-baseline justify-between gap-6">
          <span className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-0.02em]">
            {zh ? "属" : "Genera"}{" "}
            <span lang={zh ? "en" : "zh-CN"} className="ml-2 align-middle text-h4 font-normal text-ink-3">
              {zh ? "Genera" : "属"}
            </span>
          </span>
          <span className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">Systema</span>
        </h2>

        <div className="grid grid-cols-[auto_auto_1fr] gap-x-4 sm:gap-x-8">
          {/* The family, set beside the brace like the head of a systema table. */}
          <p
            aria-hidden="true"
            className="hidden self-center font-display text-h3 leading-tight text-phylum-ink italic sm:block [writing-mode:vertical-rl] rotate-180"
          >
            {family.scientificName}
          </p>
          <Brace className="hidden sm:block" />
          <ol className="flex flex-col">
            {genera.map((c, i) => {
              const filed = catalogue.filed(c);
              const referenced = catalogue.referenced(c);
              return (
                <li
                  key={c.id}
                  data-reveal="rise"
                  style={{ "--i": i % 6 } as React.CSSProperties}
                  className="border-b border-rule first:border-t"
                >
                  <Link
                    href={`/categories/${c.slug}`}
                    className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-5 text-ink no-underline sm:grid-cols-[3rem_1fr_auto] sm:gap-x-6"
                  >
                    <span className="font-display text-h3 text-ink-3 italic transition-colors duration-(--dur-quick) group-hover:text-phylum">
                      {i + 1}.
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight tracking-[-0.015em] transition-transform duration-(--dur-slow) ease-(--ease-grow) group-hover:translate-x-1">
                          {c.name[lang]}
                        </span>
                        <i className="font-display text-lead text-phylum-ink">{c.scientificName}</i>
                      </span>
                      <span lang={other === "zh" ? "zh-CN" : "en"} className="mt-1 block text-small text-ink-3">
                        {c.name[other]}
                        {c.intro[lang] ? <span className="text-ink-2"> — {c.intro[lang]}</span> : null}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-right">
                      {filed.length ? (
                        <span className="font-mono text-meta leading-snug text-ink-3">
                          {String(filed.length).padStart(2, "0")} {zh ? "种" : "species"}
                          {referenced.length ? (
                            <span className="block text-ink-3/80">
                              +{referenced.length} {zh ? "参照" : "ref."}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="pw-accession">{zh ? "待入藏" : "Awaiting accession"}</span>
                      )}
                      <span aria-hidden="true" className="pw-nudge inline-block text-ink">
                        →
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {family.essay ? (
        <section aria-label={zh ? "科志" : "About the family"} className="mt-(--space-section) max-w-(--measure)">
          <Markdown lang={lang}>{family.essay}</Markdown>
        </section>
      ) : null}

      {family.links.length ? (
        <section aria-labelledby="family-links" className="pw-ink-over mt-(--space-block) pt-6">
          <h2 id="family-links" className="mb-3 pw-smallcaps text-small text-ink-3">
            {zh ? "相关链接" : "See also"}
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small">
            {family.links.map((l) => (
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
