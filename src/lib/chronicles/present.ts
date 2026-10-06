import type { ChronicleResource, ChronicleResourceKind, Lang } from "@/lib/model/types";
import { CHRONICLE_RESOURCE_KINDS } from "@/lib/model/vocab";

/*
 * How a record's facts are printed: its day, what hangs off it, and where its
 * links may go. Pure; the list and the record page share them.
 */

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The day without its year (the list groups by year), read straight from the date: "10月5日", "5 Oct". */
export function dayOf(date: string, lang: Lang): string {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return lang === "zh" ? `${month}月${day}日` : `${day} ${MONTHS_EN[month - 1]}`;
}

/** "No. 008". */
export const registerNumber = (number: number) => `No. ${String(number).padStart(3, "0")}`;

/** How many of each kind of material a record carries, in vocabulary order; kinds it lacks are left out. */
export function resourceTally(resources: ChronicleResource[]): Array<{ kind: ChronicleResourceKind; count: number }> {
  return (Object.keys(CHRONICLE_RESOURCE_KINDS) as ChronicleResourceKind[])
    .map((kind) => ({ kind, count: resources.filter((resource) => resource.kind === kind).length }))
    .filter((entry) => entry.count > 0);
}

/** "录像 1 · 文件 2" / "Recording 1 · Document 2". */
export const tallyText = (resources: ChronicleResource[], lang: Lang) =>
  resourceTally(resources)
    .map(({ kind, count }) => `${CHRONICLE_RESOURCE_KINDS[kind][lang]} ${count}`)
    .join(" · ");

/** The address a material may be opened at: only an absolute http(s) URL, otherwise none. */
export function openableUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Where a link goes, for reading: host and path, without the scheme or a trailing slash. */
export const addressOf = (href: string) => href.replace(/^https?:\/\//, "").replace(/\/$/, "");
