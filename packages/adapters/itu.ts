import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface ItuConnectivity {
  mobile_broadband_subs_per_100: number;
  internet_users_pct: number;
  fixed_broadband_subs_per_100: number;
  ict_index_score: number;
}

interface ItuSnapshot {
  data: Record<CountryId, ItuConnectivity>;
}

export const ituAdapter: DataAdapter<ItuConnectivity> = {
  id: "itu",
  sourceUrl: "https://datahub.itu.int/",
  dataYear: 2023,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<ItuSnapshot>(
      "itu",
      "digital-connectivity.json",
    );
    const v = snap.data[country];
    if (!v) throw new Error(`ITU data not available for ${country}`);
    return v;
  },
};
