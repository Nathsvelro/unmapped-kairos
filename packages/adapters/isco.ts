import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface IscoUnitGroup {
  code: string;
  label: string;
  majorGroup: string;
}

export interface IscoMajorGroup {
  code: string;
  label: string;
}

export interface IscoSnapshot {
  majorGroups: IscoMajorGroup[];
  unitGroups: IscoUnitGroup[];
}

export const iscoAdapter: DataAdapter<IscoSnapshot> = {
  id: "isco-08",
  sourceUrl: "https://www.ilo.org/public/english/bureau/stat/isco/isco08/",
  dataYear: 2008,
  async fetch(_country: CountryId) {
    return readSnapshot<IscoSnapshot>("isco-08", "structure.json");
  },
};

export function findIsco(
  data: IscoSnapshot,
  code: string,
): IscoUnitGroup | undefined {
  return data.unitGroups.find((g) => g.code === code);
}
