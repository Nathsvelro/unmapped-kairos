import type { CountryContext, I18nString, LocaleId } from "../types";

/**
 * Pull the right locale variant out of an I18nString, with English fallback.
 */
export function tr(s: I18nString | undefined, locale: LocaleId): string {
  if (!s) return "";
  return s[locale] ?? s.en ?? Object.values(s).find(Boolean) ?? "";
}

/**
 * Format wages in the country's currency using the user's locale.
 * Uses Intl.NumberFormat — no library needed.
 */
export function formatWage(amount: number, ctx: CountryContext): string {
  const localeTag = bcp47ForLocale(ctx.locale.primary, ctx.id);
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: ctx.laborMarket.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(
  ratio: number,
  ctx: CountryContext,
  digits = 1,
): string {
  const localeTag = bcp47ForLocale(ctx.locale.primary, ctx.id);
  return new Intl.NumberFormat(localeTag, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio);
}

export function formatNumber(value: number, ctx: CountryContext): string {
  const localeTag = bcp47ForLocale(ctx.locale.primary, ctx.id);
  return new Intl.NumberFormat(localeTag).format(value);
}

export function bcp47ForLocale(locale: LocaleId, country: string): string {
  // Twi doesn't have wide Intl coverage; fall back to en-GH.
  if (locale === "tw") return `en-${country}`;
  return `${locale}-${country}`;
}
