import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EntrySummary, Lang } from "@/lib/model/types";
import { DOMAINS, SCALES } from "@/lib/model/vocab";
import { pick } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/format";
import { BilingualTitle } from "./BilingualTitle";
import { SpecimenMark } from "./SpecimenMark";
import { StatusBadge } from "./StatusBadge";

interface EntryCardProps {
  entry: EntrySummary;
  lang: Lang;
  /** compact = one line of meta, no summary (for side modules). */
  density?: "full" | "compact";
  headingLevel?: "h2" | "h3";
  /** Extra line under the title, e.g. a search snippet. */
  children?: React.ReactNode;
  className?: string;
}

/** An archive card: catalogue number, bilingual name, specimen mark, meta. */
export function EntryCard({ entry, lang, density = "full", headingLevel = "h3", children, className }: EntryCardProps) {
  const href = `/entries/${entry.slug}`;
  return (
    <article className={cn("group relative flex gap-4", className)}>
      <SpecimenMark
        scale={entry.scale}
        rings={entry.revision}
        state={entry.status}
        crossover={Boolean(entry.analogue)}
        className={density === "compact" ? "size-9" : "size-12"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-meta tracking-wide text-ink-3">{entry.id}</span>
          {entry.status !== "published" ? <StatusBadge state={entry.status} lang={lang} /> : null}
        </div>
        <Link href={href} className="mt-0.5 block rounded-xs no-underline after:absolute after:inset-0 after:content-['']">
          <BilingualTitle title={entry.title} lang={lang} as={headingLevel} size={density === "compact" ? "inline" : "card"} className="group-hover:text-indigo" />
        </Link>
        {density === "full" ? <p className="mt-2 line-clamp-3 text-small text-ink-2">{pick(entry.summary, lang)}</p> : null}
        {children}
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-meta text-ink-3">
          <span>{DOMAINS[entry.domain][lang]}</span>
          <span aria-hidden="true">·</span>
          <span>{SCALES[entry.scale][lang]}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={entry.updatedAt}>{formatDate(entry.updatedAt, lang)}</time>
        </p>
      </div>
    </article>
  );
}
