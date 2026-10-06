import Image from "next/image";
import Link from "next/link";
import type { Category, EntrySummary, Family, Lang, TaxonSnapshot } from "@/lib/model/types";
import { formatDate } from "@/lib/format";
import type { CataloguePlate } from "@/lib/taxonomy/plates";
import { CONTENT_ROLES, LEVELS } from "@/lib/model/vocab";
import { cn } from "@/lib/utils";

/**
 * 图版待刻 — the place of an illustration that is still being engraved: a
 * copper plate with only its guide lines scored, at the plate's proportion.
 * Used for every family, genus and species plate until the new set arrives.
 */
export function PendingPlate({
  lang,
  ratio = "3 / 2",
  subject,
  className,
}: {
  lang: Lang;
  /** CSS aspect-ratio of the plate it stands in for. */
  ratio?: string;
  /** What will be drawn here, e.g. the binomial; read by screen readers. */
  subject?: string;
  className?: string;
}) {
  const zh = lang === "zh";
  return (
    <div
      role="img"
      aria-label={
        zh ? `图版待刻${subject ? `：${subject}` : ""}` : `Plate in preparation${subject ? `: ${subject}` : ""}`
      }
      style={{ aspectRatio: ratio }}
      className={cn("pw-plate-pending", className)}
    >
      <span aria-hidden="true">
        {zh ? "图版待刻" : "Plate in preparation"}
        <small>{zh ? "Plate in preparation" : "图版待刻"}</small>
      </span>
    </div>
  );
}

/**
 * The plate of a family, genus or species: printed straight onto the page once
 * it has passed review, the plate in preparation until then. Both keep the
 * same proportion, so nothing moves when the plate arrives.
 */
export function CatalogueFigure({
  plate,
  lang,
  subject,
  ratio = "3 / 2",
  sizes = "(min-width: 1024px) 40vw, 92vw",
  priority,
  caption = false,
  className,
}: {
  plate: CataloguePlate | null;
  lang: Lang;
  subject?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  /** Show the plate caption and its credit beneath. */
  caption?: boolean;
  className?: string;
}) {
  if (!plate) return <PendingPlate lang={lang} subject={subject} ratio={ratio} className={className} />;
  return (
    <figure className={cn("flex flex-col", className)}>
      <span style={{ aspectRatio: ratio }} className="pw-print flex w-full items-center justify-center">
        <Image
          src={plate.src}
          width={plate.width}
          height={plate.height}
          alt={plate.alt[lang]}
          sizes={sizes}
          priority={priority}
          className="max-h-full w-auto max-w-full object-contain"
        />
      </span>
      {caption && plate.caption ? (
        <figcaption className="mt-3 flex flex-col gap-0.5 text-small">
          <i className="pw-letterpress text-ink-2">{plate.caption[lang]}</i>
          <span className="text-meta text-ink-3">
            {plate.credit} · {plate.license}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

/** A Linnaean brace, drawn to whatever height the systema row takes. */
export function Brace({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pw-brace", className)}>
      <svg viewBox="0 0 12 100" preserveAspectRatio="none" fill="none" stroke="currentColor">
        <path
          d="M11 1 C5 1 6 4 6 10 L6 42 C6 47 4 49.5 1 50 C4 50.5 6 53 6 58 L6 90 C6 96 5 99 11 99"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}

/** How each checklist is named on a label. */
function catalogueName(source: TaxonSnapshot["sources"][number], zh: boolean): string {
  switch (source.catalogue) {
    case "col":
      return `Catalogue of Life${source.release ? ` ${source.release}` : ""}`;
    case "algaebase":
      return zh ? "AlgaeBase（经 WoRMS）" : "AlgaeBase (via WoRMS)";
    case "gbif":
      return "GBIF";
    case "ncbi":
      return "NCBI";
  }
}

/**
 * 物种铭牌 — the museum label of one species: family and genus above, the
 * binomial in italic with its naming authority in roman, and the verification
 * line below linking the checklist records the name was checked against.
 * Names without a published snapshot say they are still being verified.
 */
export function SpecimenLabel({
  entry,
  family,
  category,
  snapshot,
  lang,
  className,
}: {
  entry: EntrySummary;
  family: Family;
  category: Category;
  /** The species' published name snapshot, when there is one. */
  snapshot?: TaxonSnapshot;
  lang: Lang;
  className?: string;
}) {
  const zh = lang === "zh";
  const uncatalogued = snapshot && snapshot.sources[0]?.catalogue !== "col";
  return (
    <section aria-label={zh ? "物种铭牌" : "Specimen label"} className={cn("pw-specimen-label", className)}>
      <dl>
        <dt>{zh ? "科" : "Family"}</dt>
        <dd>
          <Link href={`/families/${family.slug}`} className="no-underline hover:text-ink">
            <i>{family.scientificName}</i>
            {family.taxonNameZh && zh ? <span className="ml-1.5">{family.taxonNameZh}</span> : null}
            <span className="ml-1.5 text-ink-3">· {family.name[lang]}</span>
          </Link>
        </dd>
        <dt>{zh ? "属" : "Genus"}</dt>
        <dd>
          <Link href={`/categories/${category.slug}`} className="no-underline hover:text-ink">
            <i>{category.scientificName}</i>
            <span className="ml-1.5 text-ink-3">· {category.name[lang]}</span>
          </Link>
        </dd>
        <dt>{zh ? "种" : "Species"}</dt>
        <dd>
          <span className="pw-binomial">{entry.species ?? (zh ? "待定" : "to be assigned")}</span>
          {snapshot?.authority ? <span className="ml-1.5 text-ink-2">{snapshot.authority}</span> : null}
        </dd>
        <dt>{zh ? "层级" : "Level"}</dt>
        <dd>
          {LEVELS[entry.level][lang]} · {CONTENT_ROLES[entry.contentRole][lang]}
        </dd>
      </dl>
      {snapshot ? (
        <div className="mt-3 border-t border-rule pt-2 text-meta text-ink-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span aria-hidden="true" className="inline-block size-1.5 translate-y-[-0.1em] rounded-full bg-current" />
            <span>{zh ? "已核验：" : "Verified:"}</span>
            {snapshot.sources.map((source, i) => (
              <span key={source.catalogue} className={i ? "before:mr-2 before:content-['·']" : undefined}>
                <a href={source.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-ink">
                  {catalogueName(source, zh)}
                </a>
              </span>
            ))}
            <span className="before:mr-2 before:content-['·']">{formatDate(snapshot.verifiedAt, lang)}</span>
          </p>
          {uncatalogued ? (
            <p className="mt-1">
              {zh
                ? "Catalogue of Life 尚未收录此种，依其专科数据库核验。"
                : "Not yet indexed by Catalogue of Life; checked in its specialist database."}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 border-t border-rule pt-2 text-meta text-ink-3">
          <span aria-hidden="true" className="inline-block size-1.5 rounded-full border border-current" />
          {zh
            ? "命名者与核验来源：Catalogue of Life 快照核验中"
            : "Authority and sources: Catalogue of Life snapshot being verified"}
        </p>
      )}
    </section>
  );
}

/** Small italic binomial line used in lists: "≈ Desmidium aptogonum". */
export function Binomial({ species, className }: { species?: string; className?: string }) {
  if (!species) return null;
  return <i className={cn("font-display text-ink-3", className)}>{species}</i>;
}
