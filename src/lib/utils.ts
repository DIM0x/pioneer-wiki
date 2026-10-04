import { createCn } from "cn/config";

/**
 * Class merging aware of Pioneer's custom theme tokens. Without this, merge
 * logic mistakes `text-meta` (a size) for a colour and drops it when a
 * `text-ink-*` colour follows. Always import `cn` from here, not from "cn".
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["meta", "small", "body", "lead", "h4", "h3", "h2", "h1", "display"] }],
      shadow: [{ shadow: ["sheet", "lifted"] }],
    },
  },
});
