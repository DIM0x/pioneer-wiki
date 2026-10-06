"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Lang, Localized } from "@/lib/model/types";
import { cn } from "@/lib/utils";

export interface FamilyRow {
  id: string;
  slug: string;
  numeral: string;
  name: Localized;
  scientificName: string;
  /** Chinese name of the family, e.g. 鸦科. */
  taxonNameZh?: string;
  /** Published specimens filed under the family's genera. */
  count: number;
  genera: Array<{ slug: string; name: Localized; scientificName: string; count: number }>;
  /** A small engraving of one member of the family, printed straight onto the page. */
  emblem: { src: string; width: number; height: number; alt: string } | null;
}

/**
 * The contents page. Seven families as a column of large type; the facing page
 * belongs to whichever family the reader points at: a small engraving of one of
 * its members soaks in, then the family numeral, its Latin name and the systema
 * of its genera, each linked.
 */
export function FamilyIndex({ rows, lang }: { rows: FamilyRow[]; lang: Lang }) {
  const [at, setAt] = useState(0);
  const cur = rows[at];
  const zh = lang === "zh";
  const other: Lang = zh ? "en" : "zh";

  return (
    <div className="grid gap-x-(--space-block) lg:grid-cols-12">
      {/* Facing systema (desktop): sticks while the list scrolls past. */}
      <div data-phylum={cur.id} className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-[calc(var(--shell-header)+2rem)] flex min-h-[34rem] flex-col">
          <div className="flex flex-1 flex-col justify-center">
            {/* A small engraving, set like a vignette above the family's heading. */}
            <span aria-hidden={!cur.emblem} className="mb-4 flex h-52 items-end justify-center pl-16">
              {cur.emblem ? (
                <span key={`e-${cur.id}`} className="pw-index-emblem pw-print flex size-52 items-end justify-center">
                  <Image
                    src={cur.emblem.src}
                    width={cur.emblem.width}
                    height={cur.emblem.height}
                    alt={cur.emblem.alt}
                    sizes="208px"
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                </span>
              ) : null}
            </span>
            <div key={`s-${cur.id}`} className="pw-settle">
              {/* The family numeral in outline, set as the head of its systema rather than behind it. */}
              <p className="flex items-end gap-5">
                <span
                  aria-hidden="true"
                  className="font-display text-[clamp(5rem,9vw,7.5rem)] leading-[0.8] text-transparent italic select-none [-webkit-text-stroke:1px_var(--phylum)]"
                >
                  {cur.numeral}
                </span>
                <span className="pb-1">
                  <span className="block font-display text-h2 leading-none text-phylum-ink italic">
                    {cur.scientificName}
                  </span>
                  {cur.taxonNameZh ? <span className="mt-1 block text-small text-ink-3">{cur.taxonNameZh}</span> : null}
                </span>
              </p>
              <ol className="pw-ink-over mt-6 flex flex-col pt-3">
                {cur.genera.map((g, i) => (
                  <li key={g.slug}>
                    <Link
                      href={`/categories/${g.slug}`}
                      tabIndex={-1}
                      className="group flex items-baseline gap-3 py-1 text-small no-underline"
                    >
                      <span className="w-5 shrink-0 text-right font-display text-ink-3 italic">{i + 1}.</span>
                      <i className="font-display text-ink group-hover:text-phylum-ink">{g.scientificName}</i>
                      <span aria-hidden="true" className="pw-leader" />
                      <span className="text-ink-2">{g.name[lang]}</span>
                      <span className="w-6 shrink-0 text-right font-mono text-meta text-ink-3">
                        {g.count ? String(g.count).padStart(2, "0") : "·"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <ol className="lg:col-span-7">
        {rows.map((r, i) => (
          <li
            key={r.id}
            data-phylum={r.id}
            data-reveal="rise"
            style={{ "--i": i % 5 } as React.CSSProperties}
            className="border-b border-rule first:border-t"
          >
            <Link
              href={`/families/${r.slug}`}
              onPointerEnter={() => setAt(i)}
              onFocus={() => setAt(i)}
              className="group flex items-center gap-4 py-5 text-ink no-underline sm:gap-6"
            >
              <span
                className={cn(
                  "w-16 shrink-0 font-display text-h3 italic transition-colors duration-(--dur-quick)",
                  i === at ? "text-phylum" : "text-ink-3",
                )}
              >
                {r.numeral}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block font-display text-[clamp(1.875rem,3.6vw,3.25rem)] leading-[1.05] tracking-[-0.02em] transition-transform duration-(--dur-slow) ease-(--ease-grow)",
                    i === at && "lg:translate-x-3",
                  )}
                >
                  {r.name[lang]}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-3 text-small text-ink-3">
                  <i className="font-display text-phylum-ink">{r.scientificName}</i>
                  <span lang={zh ? "en" : "zh-CN"} className="hidden truncate sm:inline">
                    {r.name[other]}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right font-mono text-meta text-ink-3">
                {r.genera.length} {zh ? "属" : "gen."}
                <span className="block">
                  {r.count ? `${String(r.count).padStart(2, "0")} ${zh ? "种" : "spp."}` : zh ? "待入藏" : "awaiting"}
                </span>
              </span>
              <span aria-hidden="true" className="pw-nudge inline-block shrink-0 text-ink">
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
