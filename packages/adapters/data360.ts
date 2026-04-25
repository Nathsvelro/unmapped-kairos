import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface InformalitySnapshot {
  data: Record<CountryId, { informal_share_pct: number }>;
}

export const informalityAdapter: DataAdapter<{ informal_share_pct: number }> = {
  id: "data360-informality",
  sourceUrl:
    "https://data360.worldbank.org/en/indicator/WB_GS_SL_ISV_IFRM_ZS",
  dataYear: 2023,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<InformalitySnapshot>(
      "data360",
      "informality.json",
    );
    const v = snap.data[country];
    if (!v) throw new Error(`Informality data not available for ${country}`);
    return v;
  },
};

export interface SectorEmploymentRow {
  yoy_change_pct: number;
  share_of_employment_pct: number;
  isic: string;
  notes?: string;
}

interface SectorEmploymentSnapshot {
  data: Record<CountryId, Record<string, SectorEmploymentRow>>;
}

export const sectorEmploymentAdapter: DataAdapter<
  Record<string, SectorEmploymentRow>
> = {
  id: "data360-sector-employment",
  sourceUrl: "https://data360.worldbank.org/en/dataset/ILO_EMP",
  dataYear: 2023,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<SectorEmploymentSnapshot>(
      "data360",
      "sector-employment-growth.json",
    );
    const v = snap.data[country];
    if (!v) {
      throw new Error(
        `Sector employment data not available for ${country}`,
      );
    }
    return v;
  },
};
