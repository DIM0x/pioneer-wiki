import type { Chronicle, Lang, Localized, Member } from "@/lib/model/types";
import { CHRONICLE_KINDS, CHRONICLE_RESOURCE_KINDS } from "@/lib/model/vocab";
import { chronicleHref, yearOf, type ChronicleView } from "@/lib/chronicles/query";
import { dayOf, registerNumber, resourceTally } from "@/lib/chronicles/present";
import { Vignette } from "@/components/book/Vignette";
import { ChronicleRowLink } from "./ChronicleLinks";

export interface RegisterLabels {
  colKind: string;
  colPeople: string;
  colMaterials: string;
  sample: string;
  number: string;
}

/** Names shown in a row before the rest are counted. */
const NAMED = 2;

/**
 * The archive as a timeline: each year a section (its numeral stays beside its
 * records on wide screens), each record one open row — the day first, the
 * kind's colour emblem, the title in both languages, one line of summary, and
 * a quiet line of facts (kind, people, materials, sample). The title is the
 * row's only link and reaches over the whole row, so nothing nests in it.
 */
export function ChronicleRegister({
  records,
  view,
  list,
  members,
  lang,
  labels,
  yearCounts,
}: {
  records: Chronicle[];
  view: ChronicleView;
  /** The list URL the rows are opened from. */
  list: string;
  members: Map<string, Member>;
  lang: Lang;
  labels: RegisterLabels;
  /** Records per year across the whole result, when the page shows all of them. */
  yearCounts?: Map<number, number>;
}) {
  const zh = lang === "zh";
  const years = [...new Set(records.map((record) => yearOf(record.date)))];

  return (
    <div className="mt-10 flex flex-col gap-14">
      {years.map((year) => {
        const count = yearCounts?.get(year);
        return (
          <section
            key={year}
            aria-labelledby={`year-${year}`}
            className="grid gap-x-12 gap-y-2 lg:grid-cols-[7rem_minmax(0,1fr)]"
          >
            <header className="flex items-baseline justify-between gap-4 border-b border-part/40 pb-2 lg:sticky lg:top-24 lg:flex-col lg:justify-start lg:gap-2 lg:self-start lg:border-0 lg:pt-6 lg:pb-0">
              <h3
                id={`year-${year}`}
                className="font-display text-[clamp(2rem,3.2vw,2.75rem)] leading-none text-ink tabular-nums"
              >
                {year}
              </h3>
              {count ? (
                <p className="pw-label">{zh ? `${count} 则` : `${count} ${count === 1 ? "record" : "records"}`}</p>
              ) : null}
            </header>
            <ol className="flex flex-col">
              {records
                .filter((record) => yearOf(record.date) === year)
                .map((record) => (
                  <Row
                    key={record.id}
                    record={record}
                    href={chronicleHref(record.id, view)}
                    list={list}
                    members={members}
                    lang={lang}
                    labels={labels}
                  />
                ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function Row({
  record,
  href,
  list,
  members,
  lang,
  labels,
}: {
  record: Chronicle;
  href: string;
  list: string;
  members: Map<string, Member>;
  lang: Lang;
  labels: RegisterLabels;
}) {
  const zh = lang === "zh";
  const other: Lang = zh ? "en" : "zh";
  const kind = CHRONICLE_KINDS[record.kind];
  const people = record.hostIds.map((id) => members.get(id)?.name).filter((name): name is Localized => !!name);
  const tally = resourceTally(record.resources);
  const dot = (
    <span aria-hidden="true" className="text-rule-strong">
      ·
    </span>
  );

  return (
    <li className="pw-record">
      <div className="pw-record-grid py-6">
        <p className="pw-record-date flex items-baseline gap-2 sm:flex-col sm:gap-0.5">
          <time dateTime={record.date} className="font-display text-lead leading-tight text-ink">
            {dayOf(record.date, lang)}
          </time>
          <span className="font-mono text-[0.6875rem] tracking-[0.06em] text-ink-3">
            <span className="sr-only">{labels.number} </span>
            {registerNumber(record.number)}
          </span>
        </p>

        <Vignette name={kind.emblem} className="pw-record-icon -mt-2 w-12 sm:-mt-3 sm:w-16" sizes="64px" />

        <div className="pw-record-body min-w-0">
          <h4 className="font-display text-[1.375rem] leading-snug text-ink">
            <ChronicleRowLink href={href} list={list} className="pw-register-link">
              <span className="pw-link">{record.title[lang]}</span>
            </ChronicleRowLink>
            {record.title[other] && record.title[other] !== record.title[lang] ? (
              <span
                lang={zh ? "en" : "zh-CN"}
                className="mt-0.5 block text-small font-normal text-ink-3 lg:mt-0 lg:ml-3 lg:inline"
              >
                {record.title[other]}
              </span>
            ) : null}
          </h4>
          <p className="mt-1.5 line-clamp-2 max-w-[46em] text-small leading-relaxed text-ink-2 lg:line-clamp-1">
            {record.summary[lang]}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-small text-ink-3">
            <span className="text-part-ink">
              <span className="sr-only">{labels.colKind}: </span>
              {kind.label[lang]}
            </span>
            {people.length ? (
              <>
                {dot}
                <span>
                  <span className="sr-only">{labels.colPeople}: </span>
                  {people
                    .slice(0, NAMED)
                    .map((name) => name[lang])
                    .join(zh ? "、" : ", ")}
                  {people.length > NAMED ? (zh ? ` 等 ${people.length} 人` : ` +${people.length - NAMED}`) : ""}
                </span>
              </>
            ) : null}
            {tally.length ? (
              <>
                {dot}
                <span>
                  <span className="sr-only">{labels.colMaterials}: </span>
                  {tally.map(({ kind: k, count }) => `${CHRONICLE_RESOURCE_KINDS[k][lang]} ${count}`).join(" · ")}
                </span>
              </>
            ) : null}
            {record.sample ? <span className="pw-stamp ml-1 text-[0.625rem]">{labels.sample}</span> : null}
          </p>
        </div>
      </div>
    </li>
  );
}
