import type { Messages } from "@lingui/core";
import type { Locale } from "@/stores/settings";

const catalogCache: Partial<Record<Locale, Messages>> = {};

/**
 * Dynamically loads compiled Lingui messages for the given locale.
 * Results are cached so repeated calls (e.g. main + root) do not refetch chunks.
 */
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
