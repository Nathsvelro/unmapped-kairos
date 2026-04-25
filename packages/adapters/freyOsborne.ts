import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface FreyOsborneOccupation {
  soc: string;
  label: string;
  automation_probability: number;
  isco_mapping: string;
}

interface FreyOsborneSnapshot {
  occupations: FreyOsborneOccupation[];
}

export const freyOsborneAdapter: DataAdapter<FreyOsborneOccupation[]> = {
  id: "frey-osborne",
  sourceUrl:
    "https://www.oxfordmartin.ox.ac.uk/downloads/academic/The_Future_of_Employment.pdf",
  dataYear: 2013,
  async fetch(_country: CountryId) {
    // Frey-Osborne is country-agnostic in its raw form;
    // CountryContext.automation.calibration is what makes it LMIC-aware.
    const snap = await readSnapshot<FreyOsborneSnapshot>(
      "frey-osborne",
      "occupations.json",
    );
    return snap.occupations;
  },
};

export function findByIsco(
  occupations: FreyOsborneOccupation[],
  isco: string,
): FreyOsborneOccupation | undefined {
  return occupations.find((o) => o.isco_mapping === isco);
}

export function findBySoc(
  occupations: FreyOsborneOccupation[],
  soc: string,
): FreyOsborneOccupation | undefined {
  return occupations.find((o) => o.soc === soc);
}
