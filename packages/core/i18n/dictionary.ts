import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { LocaleId } from "../types";

export const SUPPORTED_LOCALES: LocaleId[] = ["en", "tw", "bn", "es", "pt"];

export interface CommonDict {
  appName: string;
  tagline: string;
  nav: {
    intake: string;
    profile: string;
    readiness: string;
    opportunities: string;
    dashboard: string;
    switchCountry: string;
  };
  country: {
    pickerTitle: string;
    pickerSubtitle: string;
  };
  intake: Record<string, string>;
  profile: Record<string, string>;
  readiness: Record<string, string>;
  opportunities: Record<string, string>;
  dashboard: Record<string, string>;
  common: Record<string, string>;
  constraints: Record<string, string>;
}

const cache = new Map<LocaleId, CommonDict>();

export async function loadDictionary(locale: LocaleId): Promise<CommonDict> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const filePath = path.join(
    process.cwd(),
    "config",
    "locales",
    locale,
    "common.json",
  );
  const raw = await fs.readFile(filePath, "utf8");
  const dict = JSON.parse(raw) as CommonDict;
  cache.set(locale, dict);
  return dict;
}

/**
 * Load a dictionary for a country, falling back to English if the
 * primary locale dictionary is incomplete or missing.
 */
export async function loadDictionaryWithFallback(
  primary: LocaleId,
  fallback: LocaleId = "en",
): Promise<{ dict: CommonDict; fallbackDict: CommonDict; locale: LocaleId }> {
  const [dict, fallbackDict] = await Promise.all([
    loadDictionary(primary),
    loadDictionary(fallback),
  ]);
  return { dict, fallbackDict, locale: primary };
}

export { format } from "./template";
