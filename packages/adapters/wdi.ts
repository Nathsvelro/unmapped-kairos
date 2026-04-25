import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface WdiCountryIndicators {
  "SL.UEM.NEET.ZS": number;
  "SL.EMP.WORK.ZS": number;
  "SL.EMP.TOTL.SP.ZS": number;
  "NY.GDP.PCAP.CD": number;
  "NY.GDP.PCAP.KD.ZG": number;
  human_capital_index?: number;
}

interface WdiSnapshot {
  data: Record<CountryId, WdiCountryIndicators>;
}

export const wdiAdapter: DataAdapter<WdiCountryIndicators> = {
  id: "wdi",
  sourceUrl:
    "https://databank.worldbank.org/source/world-development-indicators",
  dataYear: 2023,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<WdiSnapshot>("wdi", "indicators.json");
    const ind = snap.data[country];
    if (!ind) throw new Error(`WDI indicators not available for ${country}`);
    return ind;
  },
};
