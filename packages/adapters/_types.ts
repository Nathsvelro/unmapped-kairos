import "server-only";
import type { CountryId } from "../core/types";

/**
 * Every data source implements this interface.
 *
 * The runtime only ever talks to data through DataAdapter instances —
 * which means swapping data providers in a CountryContext doesn't ripple
 * through the rest of the codebase.
 *
 * For the prototype, all adapters read from the local data/snapshots/
 * directory. In production, an adapter could call a live API.
 */
export interface DataAdapter<T> {
  /** Stable id used by CountryContext.adapters to refer to this source */
  readonly id: string;
  /** Source URL for provenance display */
  readonly sourceUrl: string;
  /** Year of the data being served */
  readonly dataYear: number;
  /**
   * Fetch the slice of the dataset relevant for a given country.
   * Implementations are expected to be pure and cheap — they read
   * from cached snapshots, not from a network.
   */
  fetch(country: CountryId): Promise<T>;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    readonly adapterId: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}
