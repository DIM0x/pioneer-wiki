import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import type { Heading, Root } from "mdast";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { headingSlug, splitHeading, type TocItem } from "./bilingual";

/**
 * Table of contents for a Markdown body. Uses the same parser plugins and the
 * same slug sequence as the renderer, so every id matches a rendered heading.
 */
export function extractToc(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkDirective).parse(markdown) as Root;
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  visit(tree, "heading", (node: Heading) => {
    const parts = splitHeading(toString(node));
    const id = headingSlug(parts, slugger);
    if (node.depth === 2 || node.depth === 3) items.push({ id, depth: node.depth, parts });
  });
  return items;
}
