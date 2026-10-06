import type { Chronicle, ChronicleDetail, ChronicleKind } from "@/lib/model/types";
import type { ChronicleFacets, ChronicleQuery } from "@/lib/services/contracts";
import { CHRONICLE_KIND_IDS } from "@/lib/model/vocab";

/*
 * The archive's query semantics, shared by both data sources and by the pages:
 * what counts as a match, the register order, the facets, and how a reader's
 * view of the list is written into and read back out of the URL. Pure, so the
 * client toolbar can build the same links the server renders.
 */

/** Records per page of the list; the count and the facets always cover the whole archive. */
export const CHRONICLE_PAGE_SIZE = 40;
/** Longest search a reader can send; longer input is cut, not rejected. */
export const CHRONICLE_QUERY_MAX = 80;

/** Register order: date descending, then number descending (numbers are unique, so the order is total). */
export const newestFirst = (a: Chronicle, b: Chronicle) => b.date.localeCompare(a.date) || b.number - a.number;

/** The search words as they are matched: trimmed and capped; empty means no search. */
export function searchWords(q: string | undefined): string | undefined {
  const words = q?.trim().slice(0, CHRONICLE_QUERY_MAX).trim();
  return words ? words : undefined;
}

/** Every text a search looks through: both titles, both summaries and the account. */
export const searchedText = (record: Chronicle & { body?: string }) => [
  record.title.zh,
  record.title.en,
  record.summary.zh,
  record.summary.en,
  record.body ?? "",
];

/** The reference semantics of `ChronicleQuery` filters; the Supabase adapter must agree with it. */
export function matchesChronicle(record: ChronicleDetail, query: ChronicleQuery | undefined): boolean {
  if (query?.kind?.length && !query.kind.includes(record.kind)) return false;
  if (query?.year && yearOf(record.date) !== query.year) return false;
  if (query?.member && !record.hostIds.includes(query.member)) return false;
  const words = searchWords(query?.q)?.toLowerCase();
  return !words || searchedText(record).some((text) => text.toLowerCase().includes(words));
}

/** The year of an activity, read from the date itself so no time zone can move it. */
export const yearOf = (date: string) => Number(date.slice(0, 4));

export function facetsOf(records: Array<Pick<Chronicle, "date" | "kind" | "hostIds" | "sample">>): ChronicleFacets {
  const kinds = new Set(records.map((record) => record.kind));
  return {
    total: records.length,
    samples: records.filter((record) => record.sample).length,
    years: [...new Set(records.map((record) => yearOf(record.date)))].sort((a, b) => b - a),
    kinds: CHRONICLE_KIND_IDS.filter((kind) => kinds.has(kind)),
    memberIds: [...new Set(records.flatMap((record) => record.hostIds))].sort(),
  };
}

// ── The reader's view, in the URL ───────────────────────────────────────────

/** One reader's view of the list. Parameter names match `ChronicleQuery`. */
export interface ChronicleView {
  q?: string;
  year?: number;
  kind?: ChronicleKind;
  member?: string;
  /** 1-based. */
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Repeated parameters are read in order and the first usable value wins. */
const values = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value : value === undefined ? [] : [value];

/**
 * Reads a view from Next's searchParams. Anything malformed is dropped rather
 * than failing the page; with `known`, years and members the archive does not
 * hold are dropped too, so a stale link widens instead of showing a raw id.
 */
export function readChronicleView(
  params: SearchParams,
  known?: Pick<ChronicleFacets, "years" | "memberIds">,
): ChronicleView {
  const q = values(params.q).map(searchWords).find(Boolean);
  const year = values(params.year)
    .filter((value) => /^\d{4}$/.test(value))
    .map(Number)
    .find((value) => !known || known.years.includes(value));
  const kind = values(params.kind).find((value): value is ChronicleKind =>
    CHRONICLE_KIND_IDS.includes(value as ChronicleKind),
  );
  const member = values(params.member).find(
    (value) => /^[\w-]{1,64}$/.test(value) && (!known || known.memberIds.includes(value)),
  );
  const page = Number(values(params.page).find((value) => /^[1-9]\d{0,4}$/.test(value)) ?? 1);
  return { q, year, kind, member, page };
}

/** The repository query behind one page of a view. */
export const chronicleQuery = (view: ChronicleView): ChronicleQuery => ({
  q: view.q,
  year: view.year,
  kind: view.kind ? [view.kind] : undefined,
  member: view.member,
});

export const isFiltered = (view: ChronicleView) => Boolean(view.q || view.year || view.kind || view.member);

/** The search string of a view, in a fixed order and without empty or default parameters. */
export function viewSearch(view: ChronicleView): string {
  const params = new URLSearchParams();
  if (view.q) params.set("q", view.q);
  if (view.year) params.set("year", String(view.year));
  if (view.kind) params.set("kind", view.kind);
  if (view.member) params.set("member", view.member);
  if (view.page > 1) params.set("page", String(view.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/**
 * The list link for a view with some of it changed. Changing what is shown
 * starts again at the first page; only an explicit `page` moves within it.
 */
export function chronicleListHref(view: ChronicleView, change: Partial<ChronicleView> = {}): string {
  const next = { ...view, page: 1, ...change };
  return `/chronicles${viewSearch(next)}`;
}

/** A record's link, carrying the list view so its way back returns to the same place. */
export const chronicleHref = (id: string, view?: ChronicleView) =>
  `/chronicles/${encodeURIComponent(id)}${view ? viewSearch(view) : ""}`;
