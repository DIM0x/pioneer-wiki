import { readFileSync } from "node:fs";
import { join } from "node:path";
import { museumBodySince } from "../../../mock/entries.ts";

const BODY_DIR = join(process.cwd(), "src", "mock", "bodies");

function read(file: string): string | null {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/**
 * The body of one revision. An entry's museum article (bodies/museum/<slug>.md)
 * is its body from museumBodySince on; before that, bodies/<slug>.md is read
 * through its revision markers (see src/mock/entries.ts).
 */
export function bodyAt(slug: string, revision: number): string {
  const since = museumBodySince[slug];
  if (since !== undefined && revision >= since) return (read(join(BODY_DIR, "museum", `${slug}.md`)) ?? "").trim();
  const raw = read(join(BODY_DIR, `${slug}.md`));
  if (raw === null) return "";
  return raw
    .replace(
      /<!-- @(since|until|in) (\d+)(?:-(\d+))? -->\r?\n([\s\S]*?)<!-- @end -->\r?\n?/g,
      (_m, kind: string, a: string, b: string | undefined, block: string) => {
        const n = Number(a);
        const keep =
          kind === "since" ? n <= revision : kind === "until" ? revision <= n : n <= revision && revision <= Number(b);
        return keep ? block : "";
      },
    )
    .trim();
}
