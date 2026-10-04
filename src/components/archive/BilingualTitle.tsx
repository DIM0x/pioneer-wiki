import { cn } from "@/lib/utils";
import type { Lang, Localized } from "@/lib/model/types";
import { otherLang } from "@/lib/i18n/dictionary";

const LANG_ATTR: Record<Lang, string> = { zh: "zh-CN", en: "en" };

const sizes = {
  display: { primary: "text-h1 sm:text-display", secondary: "text-h4 sm:text-h3" },
  page: { primary: "text-h2 sm:text-h1", secondary: "text-lead sm:text-h4" },
  card: { primary: "text-h4", secondary: "text-small" },
  inline: { primary: "text-body", secondary: "text-meta" },
} as const;

interface BilingualTitleProps {
  title: Localized;
  lang: Lang;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  size?: keyof typeof sizes;
  className?: string;
}

/**
 * A name in both languages: the interface language leads, the other follows
 * in a quieter italic serif. Both are always present and tagged with `lang`.
 */
export function BilingualTitle({ title, lang, as: Tag = "h2", size = "card", className }: BilingualTitleProps) {
  const second = otherLang(lang);
  const s = sizes[size];
  const hasSecond = Boolean(title[second]) && title[second] !== title[lang];
  return (
    <Tag className={cn("font-display text-ink", className)}>
      <span lang={LANG_ATTR[lang]} className={cn("block font-[560] text-balance", s.primary)}>
        {title[lang] || title[second]}
      </span>
      {hasSecond ? (
        <span lang={LANG_ATTR[second]} className={cn("mt-1 block font-normal italic text-ink-3", s.secondary)}>
          {title[second]}
        </span>
      ) : null}
    </Tag>
  );
}
