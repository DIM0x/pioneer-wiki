import type { ElementContent } from "hast";
import type { Parent, Root, Text } from "mdast";
import { SKIP, visit } from "unist-util-visit";

/*
 * Source marks in entry bodies: "[S1]", "[S1, S2]", "[S1-S3]" refer to the
 * entry's sources by their place in its record (S1 is the first source cited).
 * Each mark becomes a superscript whose numbers link to #source-<n>, the item
 * the entry page sets in its record. The text of the mark is kept as written.
 */

const MARK = /\[(S\d+(?:\s*(?:,|-|–)\s*S\d+)*)\]/g;

function marks(group: string): ElementContent[] {
  const out: ElementContent[] = [{ type: "text", value: "[" }];
  for (const part of group.split(/(\s*(?:,|-|–)\s*)/)) {
    const n = /^S(\d+)$/.exec(part);
    if (n) {
      out.push({
        type: "element",
        tagName: "a",
        properties: { href: `#source-${n[1]}`, className: ["pw-cite-link"] },
        children: [{ type: "text", value: part }],
      });
    } else {
      out.push({ type: "text", value: part.includes(",") ? ", " : "–" });
    }
  }
  out.push({ type: "text", value: "]" });
  return out;
}

/** remark plugin: source marks → linked superscripts. */
export function remarkCitations() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (!parent || index === undefined || parent.type === "link") return;
      if (node.value.search(MARK) === -1) return;
      const pieces: Parent["children"] = [];
      let last = 0;
      for (const match of node.value.matchAll(MARK)) {
        if (match.index > last) pieces.push({ type: "text", value: node.value.slice(last, match.index) });
        pieces.push({
          type: "citation",
          children: [],
          data: { hName: "sup", hProperties: { className: ["pw-cite"] }, hChildren: marks(match[1]) },
        } as unknown as Text);
        last = match.index + match[0].length;
      }
      if (last < node.value.length) pieces.push({ type: "text", value: node.value.slice(last) });
      parent.children.splice(index, 1, ...pieces);
      return [SKIP, index + pieces.length];
    });
  };
}

/** Whether a body marks its sources as [S1] …, so the record numbers them. */
export const marksSources = (body: string): boolean => /\[S\d+(?:\s*(?:,|-|–)\s*S\d+)*\]/.test(body);
