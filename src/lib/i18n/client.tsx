"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lang, Localized } from "@/lib/model/types";
import { LANG_COOKIE, pick, translate, type MessageKey } from "./dictionary";

interface I18nContextValue {
  lang: Lang;
  t: (key: MessageKey) => string;
  pick: (value: Localized) => string;
  setLang: (lang: Lang) => void;
  /** True while server components re-render in the new language. */
  switching: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Switching language never navigates: it updates client components at once,
 * stores the choice in a cookie, then refreshes server components in place.
 * `router.refresh()` keeps client state (form input, open panels, scroll).
 */
export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [switching, startTransition] = useTransition();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      t: (key) => translate(lang, key),
      pick: (localized) => pick(localized, lang),
      setLang,
      switching,
    }),
    [lang, setLang, switching],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}
