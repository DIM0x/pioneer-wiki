import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/model/types";
import { DEFAULT_LANG, LANG_COOKIE, isLang, translate, type MessageKey } from "./dictionary";

/** Interface language for this request, from the `pw-lang` cookie. */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

/** Server-side translator bound to the request language. */
export async function getT(): Promise<{ lang: Lang; t: (key: MessageKey) => string }> {
  const lang = await getLang();
  return { lang, t: (key) => translate(lang, key) };
}
