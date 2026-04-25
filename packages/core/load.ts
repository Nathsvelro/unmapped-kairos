import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { CountryContext, CountryId } from "./types";

const COUNTRY_FILES: Record<CountryId, string> = {
  GH: "ghana.json",
  BD: "bangladesh.json",
  MX: "mexico.json",
  BR: "brazil.json",
};

export const SUPPORTED_COUNTRIES: CountryId[] = ["GH", "BD", "MX", "BR"];

const cache = new Map<CountryId, CountryContext>();

export async function loadCountryContext(
  id: CountryId,
): Promise<CountryContext> {
  const cached = cache.get(id);
  if (cached) return cached;

  const fileName = COUNTRY_FILES[id];
  if (!fileName) {
    throw new Error(`Unknown country id: ${id}`);
  }

  const filePath = path.join(
    process.cwd(),
    "config",
    "countries",
    fileName,
  );
  const raw = await fs.readFile(filePath, "utf8");
  const ctx = JSON.parse(raw) as CountryContext;
  cache.set(id, ctx);
  return ctx;
}

export async function loadAllCountryContexts(): Promise<CountryContext[]> {
  return Promise.all(SUPPORTED_COUNTRIES.map(loadCountryContext));
}

export function isCountryId(value: string): value is CountryId {
  return SUPPORTED_COUNTRIES.includes(value.toUpperCase() as CountryId);
}

export function normalizeCountryId(value: string): CountryId | null {
  const upper = value.toUpperCase();
  return isCountryId(upper) ? (upper as CountryId) : null;
}
