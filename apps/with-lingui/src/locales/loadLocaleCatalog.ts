import type { Messages } from "@lingui/core";
import type { Locale } from "@/stores/settings";

const catalogCache: Partial<Record<Locale, Messages>> = {};

const localeLoaders: Record<Locale, () => Promise<{ messages: Messages }>> = {
  en: () => import("./en/messages.po"),
  zh: () => import("./zh/messages.po"),
};

function resolveLocale(locale: string): Locale {
  return locale in localeLoaders ? (locale as Locale) : "en";
}

export async function loadLocaleCatalog(locale: Locale): Promise<Messages> {
  const normalizedLocale = resolveLocale(locale);

  const hit = catalogCache[normalizedLocale];
  if (hit) {
    return hit;
  }

  const mod = await localeLoaders[normalizedLocale]();
  const messages = mod.messages;
  catalogCache[normalizedLocale] = messages;
  return messages;
}
