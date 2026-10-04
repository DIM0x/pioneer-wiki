import type { ForumCategory, Localized } from "@/lib/model/types";

/** Forum categories, each with a blueprint emblem from public/vignettes/bp-*. */
export const FORUM_CATEGORIES: Array<{ id: ForumCategory; label: Localized; emblem: string }> = [
  { id: "general", label: { zh: "综合", en: "General" }, emblem: "bp-gears" },
  { id: "help", label: { zh: "求助", en: "Help" }, emblem: "bp-telegraph" },
  { id: "showcase", label: { zh: "展示", en: "Showcase" }, emblem: "bp-press" },
  { id: "meta", label: { zh: "站务", en: "Meta" }, emblem: "bp-lamp" },
];

export const categoryOf = (id: ForumCategory) => FORUM_CATEGORIES.find((c) => c.id === id) ?? FORUM_CATEGORIES[0];
