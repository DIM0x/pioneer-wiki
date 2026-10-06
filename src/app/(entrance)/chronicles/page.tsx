import type { Metadata } from "next";
import Link from "next/link";
import type { ChronicleKind } from "@/lib/model/types";
import { CHRONICLE_KINDS, CHRONICLE_KIND_IDS } from "@/lib/model/vocab";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import { formatDate } from "@/lib/format";
import { Vignette } from "@/components/book/Vignette";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "纪行 Chronicles" };

/**
 * Part V · 纪行 Chronicles — the society's ledger. Every record is one dated
 * day of the society: its kind, what it was, what hangs off it (recordings,
 * handouts) and who was there. Years run as ruled sections, newest first; the
 * recordings and files themselves stay at their own addresses.
 */
export default async function ChroniclesPart({ searchParams }: PageProps<"/chronicles">) {
  const { lang, t } = await getT();
  const zh = lang === "zh";
  const q = await searchParams;
  const kind = CHRONICLE_KIND_IDS.includes(q.kind as ChronicleKind) ? (q.kind as ChronicleKind) : undefined;
  const records = await getServices().chronicles.listChronicles({ kind: kind ? [kind] : undefined });
  const other = zh ? "en" : "zh";
  const years = [...new Set(records.map((record) => record.date.slice(0, 4)))];

  return (
    <div data-part="chronicles" className="mt-(--space-block) flex flex-col">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b-2 border-part pb-4">
        <div>
          <p className="font-mono text-meta tracking-[0.18em] text-part-ink uppercase">{t("chronicles.subtitle")}</p>
          <h2 className="mt-2 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-[-0.03em]">
            {zh ? "纪行" : "Chronicles"}{" "}
            <span lang={zh ? "en" : "zh-CN"} className="ml-2 align-middle text-h3 font-normal text-ink-3">
              {zh ? "Chronicles" : "纪行"}
            </span>
          </h2>
        </div>
        <nav aria-label={t("chronicles.filterLabel")} className="flex flex-wrap gap-x-5 gap-y-2 text-small">
          {[
            { id: undefined, label: { zh: "全部", en: "All" } },
            ...CHRONICLE_KIND_IDS.map((id) => ({ id, label: CHRONICLE_KINDS[id].label })),
          ].map((option) => (
            <Link
              key={option.id ?? "all"}
              href={option.id ? `/chronicles?kind=${option.id}` : "/chronicles"}
              scroll={false}
              aria-current={option.id === kind ? "page" : undefined}
              className={cn(
                "pw-link text-ink-3 hover:text-ink",
                option.id === kind && "text-part-ink [background-size:100%_1px]",
              )}
            >
              {option.id ? option.label[lang] : t("chronicles.all")}
            </Link>
          ))}
        </nav>
      </header>

      <p className="mb-12 max-w-[46em] text-small leading-relaxed text-ink-2">{t("chronicles.lede")}</p>

      {years.map((year) => {
        const rows = records.filter((record) => record.date.startsWith(`${year}-`));
        return (
          <section key={year} className="mb-12">
            <div className="pw-double-rule mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h3 className="font-display text-h3 text-ink">{year}</h3>
              <span className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">
                {rows.length} {t("chronicles.count")}
              </span>
            </div>
            <ol className="border-x border-part/30">
              {rows.map((record, i) => {
                const meta = CHRONICLE_KINDS[record.kind];
                const videos = record.resources.filter((r) => r.kind === "video").length;
                const files = record.resources.length - videos;
                return (
                  <li
                    key={record.id}
                    data-reveal="rise"
                    style={{ "--i": i % 6 } as React.CSSProperties}
                    className="border-b border-part/30"
                  >
                    <Link
                      href={`/chronicles/${record.id}`}
                      className="group grid grid-cols-[4.5rem_1fr] items-center gap-4 px-4 py-5 no-underline transition-colors duration-(--dur-quick) hover:bg-part-wash sm:grid-cols-[4.5rem_3.5rem_1fr_9rem] sm:gap-6"
                    >
                      <span className="font-mono text-meta text-part-ink">
                        No. {String(record.number).padStart(3, "0")}
                      </span>
                      <Vignette name={meta.emblem} className="pw-lift hidden w-14 sm:block" sizes="56px" />
                      <span className="min-w-0">
                        <span className="block font-display text-h4 leading-snug text-ink">
                          <span className="pw-link">{record.title[lang]}</span>
                          {record.title[other] !== record.title[lang] ? (
                            <span lang={zh ? "en" : "zh-CN"} className="ml-3 text-small text-ink-3">
                              {record.title[other]}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-small text-ink-3">{record.summary[lang]}</span>
                        {record.resources.length ? (
                          <span className="mt-1 flex flex-wrap gap-x-4 font-mono text-[0.6875rem] tracking-[0.08em] text-ink-3">
                            {videos ? (
                              <span>
                                {zh
                                  ? `${videos} 段${t("chronicles.video")}`
                                  : `${videos} ${videos === 1 ? "recording" : "recordings"}`}
                              </span>
                            ) : null}
                            {files ? (
                              <span>
                                {files} {zh ? "份资料" : files === 1 ? "file" : "files"}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                      <span className="col-start-2 flex flex-col gap-0.5 font-mono text-[0.6875rem] text-ink-3 sm:col-start-auto sm:text-right">
                        <span className="text-part-ink uppercase">{meta.label[lang]}</span>
                        <time dateTime={record.date}>{formatDate(record.date, lang)}</time>
                        {record.sample ? (
                          <span className="pw-stamp w-fit self-start normal-case sm:self-end">
                            {zh ? "示例" : "sample"}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {records.length === 0 ? (
        <p className="px-4 py-10 text-center text-small text-ink-3">{t("chronicles.empty")}</p>
      ) : null}
    </div>
  );
}
