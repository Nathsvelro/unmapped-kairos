import "server-only";
import { cookies } from "next/headers";
import { SUPPORTED_LOCALES } from "./dictionary";
import type { LocaleId } from "../types";

export const LOCALE_COOKIE = "unmapped-locale";
export const DEFAULT_LOCALE: LocaleId = "en";

export const LOCALE_LABELS: Record<LocaleId, string> = {
  en: "English",
  tw: "Twi (Akan)",
  bn: "বাংলা · Bangla",
  es: "Español",
  pt: "Português",
};

/**
 * The user-selected UI locale, read from the `unmapped-locale` cookie.
 * Defaults to English if no cookie is set or value is invalid.
 *
 * Note: this is the USER's UI choice, deliberately decoupled from any
 * country's `locale.primary` (which is just a hint about that country's
 * dominant language).
 */
export async function getUserLocale(): Promise<LocaleId> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  if (raw && SUPPORTED_LOCALES.includes(raw as LocaleId)) {
    return raw as LocaleId;
  }
  return DEFAULT_LOCALE;
}
