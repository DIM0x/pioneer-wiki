import Image from "next/image";
import Link from "next/link";
import type { Category, EntrySummary, Family, Lang } from "@/lib/model/types";
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

/**
 * 物种铭牌 — the museum label of one species: family and genus above, the
 * binomial in italic, the naming authority and the verification line below.
 * Names without a published Catalogue of Life snapshot say so.
 */
export function SpecimenLabel({
  entry,
  family,
  category,
  lang,
  className,
}: {
  entry: EntrySummary;
  family: Family;
  category: Category;
  lang: Lang;
  className?: string;
}) {
  const zh = lang === "zh";
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
        <dd className="pw-binomial">{entry.species ?? (zh ? "待定" : "to be assigned")}</dd>
        <dt>{zh ? "层级" : "Level"}</dt>
        <dd>
          {LEVELS[entry.level][lang]} · {CONTENT_ROLES[entry.contentRole][lang]}
        </dd>
      </dl>
      <p className="mt-3 flex items-center gap-2 border-t border-rule pt-2 text-meta text-ink-3">
        <span aria-hidden="true" className="inline-block size-1.5 rounded-full border border-current" />
        {zh
          ? "命名者与核验来源：Catalogue of Life 快照核验中"
          : "Authority and sources: Catalogue of Life snapshot being verified"}
      </p>
    </section>
  );
}

/** Small italic binomial line used in lists: "≈ Desmidium aptogonum". */
export function Binomial({ species, className }: { species?: string; className?: string }) {
  if (!species) return null;
  return <i className={cn("font-display text-ink-3", className)}>{species}</i>;
}
