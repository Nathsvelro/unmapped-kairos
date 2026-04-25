import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId } from "../core/types";
import { readSnapshot } from "./snapshot";

export type RoutineSharesBySector = Record<string, number>;

interface RoutineShareSnapshot {
  data: Record<CountryId, RoutineSharesBySector>;
}

export const iloTaskContentAdapter: DataAdapter<RoutineSharesBySector> = {
  id: "ilo-future-of-work",
  sourceUrl: "https://ilostat.ilo.org/topics/employment/",
  dataYear: 2023,
  async fetch(country: CountryId) {
    const snap = await readSnapshot<RoutineShareSnapshot>(
      "ilo-task-content",
      "routine-share.json",
    );
    const v = snap.data[country];
    if (!v) throw new Error(`Task content not available for ${country}`);
    return v;
  },
};
