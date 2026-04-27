import type { Messages } from "@lingui/core";
import type { Locale } from "@/stores/settings";

const catalogCache: Partial<Record<Locale, Messages>> = {};

export async function loadLocaleCatalog(locale: Locale): Promise<Messages> {
  const hit = catalogCache[locale];
  if (hit) {
    return hit;
  }

  const mod =
    locale === "en"
      ? await import("./en/messages.po")
      : await import("./zh/messages.po");

  const messages = mod.messages;
  catalogCache[locale] = messages;
  return messages;
}
