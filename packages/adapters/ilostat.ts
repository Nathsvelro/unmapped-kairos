import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface SectorWage {
  median_monthly: number;
  isic: string;
  imputed?: boolean;
  notes?: string;
}

export interface CountryWages {
  currency: string;
  sectors: Record<string, SectorWage>;
}

interface IlostatWagesSnapshot {
  wages: Record<CountryId, CountryWages>;
}

export const ilostatWagesAdapter: DataAdapter<CountryWages> = {
  id: "ilostat",
  sourceUrl: "https://ilostat.ilo.org/topics/wages/",
  dataYear: 2023,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<IlostatWagesSnapshot>(
      "ilostat",
      "wages-by-sector.json",
    );
    const wages = snap.wages[country];
    if (!wages) {
      throw new Error(`ILOSTAT wages not available for ${country}`);
    }
    return wages;
  },
};
