import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface EducationDistribution {
  no_education: number;
  primary_completed: number;
  lower_secondary_completed: number;
  upper_secondary_completed: number;
  post_secondary_completed: number;
}

export interface CountryProjection {
  "2025": EducationDistribution;
  "2030": EducationDistribution;
  "2035": EducationDistribution;
}

interface WittgensteinSnapshot {
  data: Record<CountryId, CountryProjection>;
}

export const wittgensteinAdapter: DataAdapter<CountryProjection> = {
  id: "wittgenstein",
  sourceUrl: "http://dataexplorer.wittgensteincentre.org/",
  dataYear: 2024,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<WittgensteinSnapshot>(
      "wittgenstein",
      "education-projection.json",
    );
    const v = snap.data[country];
    if (!v) {
      throw new Error(`Wittgenstein projection not available for ${country}`);
    }
    return v;
  },
};
