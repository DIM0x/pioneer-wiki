import type { Metadata } from "next";
import Link from "next/link";
import type { Chronicle, ChronicleKind, Lang, Member } from "@/lib/model/types";
import type { ChronicleFacets } from "@/lib/services/contracts";
import { CHRONICLE_KINDS } from "@/lib/model/vocab";
import { getT } from "@/lib/i18n/server";
import { getServices } from "@/lib/services";
import {
  CHRONICLE_PAGE_SIZE,
  chronicleListHref,
  chronicleQuery,
  isFiltered,
  readChronicleView,
  yearOf,
  type ChronicleView,
} from "@/lib/chronicles/query";
import { ChronicleFinder } from "@/components/chronicles/ChronicleFinder";
import { ChronicleRegister } from "@/components/chronicles/ChronicleRegister";

export const metadata: Metadata = { title: "纪行 Chronicles" };

interface Archive {
  facets: ChronicleFacets;
  members: Member[];
  view: ChronicleView;
  total: number;
  pages: number;
  records: Chronicle[];
}

/** Everything one view of the list needs; the facets come first so a stale year or member can be dropped. */
async function readArchive(params: Record<string, string | string[] | undefined>): Promise<Archive> {
  const { chronicles, community } = getServices();
  const [facets, members] = await Promise.all([chronicles.chronicleFacets(), community.listMembers()]);
  const asked = readChronicleView(params, facets);
  const query = chronicleQuery(asked);
  const at = (page: number) =>
    chronicles.listChronicles({ ...query, limit: CHRONICLE_PAGE_SIZE, offset: (page - 1) * CHRONICLE_PAGE_SIZE });
  const [total, first] = await Promise.all([chronicles.countChronicles(query), at(asked.page)]);
  const pages = Math.max(1, Math.ceil(total / CHRONICLE_PAGE_SIZE));
  // A page past the end shows the last one rather than an empty register.
  const page = Math.min(asked.page, pages);
  const records = page === asked.page ? first : await at(page);
  return { facets, members, view: { ...asked, page }, total, pages, records };
}

/**
 * Part V · 纪行 Chronicles — the society's archive of its days. Words, year,
 * kind and member narrow it (all held in the URL); the register below groups
 * what matches by year, newest first, one aligned row per record. The
 * recordings and files themselves stay at their own addresses.
 */
export default async function ChroniclesPart({ searchParams }: PageProps<"/chronicles">) {
  const { lang, t } = await getT();
  const zh = lang === "zh";
  const params = await searchParams;

  let archive: Archive | null = null;
  try {
    archive = await readArchive(params);
  } catch (error) {
    console.error("[chronicles] the archive could not be read", error);
  }

  return (
    <div data-part="chronicles" className="mt-(--space-block) flex flex-col">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-2 border-part pb-4">
        <div>
          <p className="font-mono text-meta tracking-[0.18em] text-part-ink uppercase">{t("chronicles.subtitle")}</p>
          <h2 className="mt-2 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-[-0.03em]">
            {zh ? "纪行" : "Chronicles"}{" "}
            <span lang={zh ? "en" : "zh-CN"} className="ml-2 align-middle text-h3 font-normal text-ink-3">
              {zh ? "Chronicles" : "纪行"}
            </span>
          </h2>
        </div>
        {archive?.facets.total ? (
          <p className="font-mono text-meta tracking-[0.14em] text-ink-3 uppercase">
            {zh ? `${archive.facets.total} 则纪略` : `${archive.facets.total} in the annals`}
            {" · "}
            {span(archive.facets.years)}
          </p>
        ) : null}
      </header>

      <p className="mb-8 max-w-[46em] text-small leading-relaxed text-ink-2">{t("chronicles.lede")}</p>

      {archive ? <Archive archive={archive} lang={lang} t={t} /> : <Unavailable t={t} params={params} />}
    </div>
  );
}

/** "2026" or "2024–2026". */
const span = (years: number[]) =>
  years.length > 1 ? `${years[years.length - 1]}–${years[0]}` : String(years[0] ?? "");

type T = Awaited<ReturnType<typeof getT>>["t"];

function Archive({ archive, lang, t }: { archive: Archive; lang: Lang; t: T }) {
  const zh = lang === "zh";
  const { facets, view, total, pages, records } = archive;
  const members = new Map(archive.members.map((member) => [member.id, member]));
  const list = chronicleListHref(view, { page: view.page });
  const filtered = isFiltered(view);

  const memberOptions = facets.memberIds
    .map((id): [string, string] => [id, members.get(id)?.name[lang] ?? ""])
    .filter(([, label]) => label)
    .sort((a, b) => a[1].localeCompare(b[1], zh ? "zh-CN" : "en"));

  // Each condition the reader set, with the way to drop just that one.
  const chips = [
    view.q
      ? { key: "q", label: zh ? `「${view.q}」` : `“${view.q}”`, href: chronicleListHref(view, { q: undefined }) }
      : null,
    view.year ? { key: "year", label: String(view.year), href: chronicleListHref(view, { year: undefined }) } : null,
    view.kind
      ? {
          key: "kind",
          label: CHRONICLE_KINDS[view.kind].label[lang],
          href: chronicleListHref(view, { kind: undefined }),
        }
      : null,
    view.member
      ? {
          key: "member",
          label: members.get(view.member)?.name[lang] ?? view.member,
          href: chronicleListHref(view, { member: undefined }),
        }
      : null,
  ].filter((chip) => chip !== null);

  const from = (view.page - 1) * CHRONICLE_PAGE_SIZE + 1;
  const to = from + records.length - 1;
  const yearCounts =
    pages === 1
      ? new Map(facets.years.map((year) => [year, records.filter((r) => yearOf(r.date) === year).length]))
      : undefined;

  return (
    <>
      {facets.total ? (
        <div className="rounded-lg border border-rule bg-paper-sheet/60 px-5 pt-5 pb-1 sm:px-6">
          <ChronicleFinder
            key={list}
            view={view}
            years={facets.years.map((year): [string, string] => [String(year), String(year)])}
            kinds={facets.kinds.map((kind: ChronicleKind): [string, string] => [
              kind,
              CHRONICLE_KINDS[kind].label[lang],
            ])}
            members={memberOptions}
            labels={{
              search: t("chronicles.search"),
              searchHint: t("chronicles.searchHint"),
              searchSubmit: t("chronicles.searchSubmit"),
              filters: t("chronicles.filters"),
              year: t("chronicles.year"),
              allYears: t("chronicles.allYears"),
              kind: t("chronicles.kind"),
              allKinds: t("chronicles.allKinds"),
              member: t("chronicles.member"),
              allMembers: t("chronicles.allMembers"),
              pending: t("chronicles.pending"),
            }}
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p role="status" className="font-mono text-meta tracking-[0.08em] text-ink-3">
            {!facets.total
              ? ""
              : filtered
                ? zh
                  ? `找到 ${total} 则`
                  : `${total} ${total === 1 ? "match" : "matches"}`
                : zh
                  ? `共 ${total} 则，最新的在前`
                  : `${total} ${total === 1 ? "record" : "records"}, newest first`}
            {pages > 1 && total ? (zh ? ` · 第 ${from}–${to} 则` : ` · ${from}–${to}`) : ""}
          </p>
          {chips.length ? (
            <ul aria-label={zh ? "已选条件" : "Filters in use"} className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <Link
                    href={chip.href}
                    scroll={false}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xs border border-part/40 bg-part-wash px-2.5 text-small text-ink no-underline transition-colors duration-(--dur-quick) hover:border-part"
                  >
                    {chip.label}
                    <span aria-hidden="true" className="text-ink-3">
                      ×
                    </span>
                    <span className="sr-only">{t("chronicles.remove")}</span>
                  </Link>
                </li>
              ))}
              {chips.length > 1 ? (
                <li>
                  <Link href="/chronicles" scroll={false} className="pw-link ml-1 text-small text-part-ink">
                    {t("chronicles.clear")}
                  </Link>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        {facets.samples ? (
          <p className="flex items-center gap-2 text-small text-ink-3">
            <span className="pw-stamp shrink-0 text-[0.625rem]">{t("chronicles.sample")}</span>
            {facets.samples === facets.total
              ? zh
                ? "目前全部为示例记录，内容与资料地址都是占位的"
                : "All records are samples for now: placeholder contents and addresses"
              : zh
                ? `其中 ${facets.samples} 则为示例记录，内容是占位的`
                : `${facets.samples} are samples with placeholder contents`}
          </p>
        ) : null}
      </div>

      {records.length ? (
        <ChronicleRegister
          records={records}
          view={view}
          list={list}
          members={members}
          lang={lang}
          yearCounts={yearCounts}
          labels={{
            colKind: t("chronicles.colKind"),
            colPeople: t("chronicles.colPeople"),
            colMaterials: t("chronicles.colMaterials"),
            sample: t("chronicles.sample"),
            number: t("chronicles.number"),
          }}
        />
      ) : facets.total ? (
        <div className="mt-6 border-y border-part/30 px-4 py-12 text-center">
          <p className="font-display text-h4 text-ink">{t("chronicles.noMatch")}</p>
          <p className="mt-2 text-small text-ink-3">{t("chronicles.noMatchHint")}</p>
          <Link href="/chronicles" scroll={false} className="pw-finder-submit mt-6 no-underline">
            {t("chronicles.clear")}
          </Link>
        </div>
      ) : (
        <p className="border-y border-part/30 px-4 py-12 text-center text-small text-ink-3">
          {t("chronicles.emptyArchive")}
        </p>
      )}

      {pages > 1 ? (
        <nav
          aria-label={t("chronicles.pages")}
          className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-part/30 pt-4 text-small"
        >
          {view.page > 1 ? (
            <Link href={chronicleListHref(view, { page: view.page - 1 })} className="pw-link text-part-ink">
              ← {t("chronicles.newerPage")}
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-meta text-ink-3">
            {view.page} / {pages}
          </span>
          {view.page < pages ? (
            <Link href={chronicleListHref(view, { page: view.page + 1 })} className="pw-link text-part-ink">
              {t("chronicles.olderPage")} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}

/** A read failure says so, and offers the same view again; it is never shown as an empty archive. */
function Unavailable({ t, params }: { t: T; params: Record<string, string | string[] | undefined> }) {
  const view = readChronicleView(params);
  return (
    <div role="alert" className="border-y border-part/30 px-4 py-12 text-center">
      <p className="font-display text-h4 text-brick-ink">{t("chronicles.unavailable")}</p>
      <a href={chronicleListHref(view, { page: view.page })} className="pw-finder-submit mt-6 no-underline">
        {t("chronicles.retry")}
      </a>
    </div>
  );
}
