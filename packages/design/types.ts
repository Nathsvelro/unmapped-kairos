/**
 * Unmapped Kairos · Direction 01 design data contract.
 *
 * These are the typed shapes consumed by the new D1 screens. They mirror
 * `design-reference/data.js` exactly, and are the same surface a real
 * adapter (ILOSTAT, WDI, Data360, Wittgenstein Centre) will fill once
 * mock fixtures are swapped out.
 *
 * Country-specific parameters are inputs to the system, never hardcoded.
 */

export type CountryId = "GH" | "BD" | "MX" | "BR";

export type LocaleId = "tw-GH" | "bn-BD" | "es-MX" | "pt-BR" | "en";

export interface CountryLocale {
  primary: LocaleId | string;
  fallback: LocaleId | string;
  /** ISO-15924 script code */
  script: "Latn" | "Beng" | string;
  rtl: boolean;
  /** Human-readable label, e.g. "Twi (Akan) · English fallback" */
  label: string;
}

export interface CountryTaxonomy {
  /** e.g. "WAEC SSCE → ISCED-2011" */
  scheme: string;
  /** Range string, e.g. "L0–L6" */
  levels: string;
}

export type OpportunityType =
  | "formal"
  | "self-employment"
  | "gig"
  | "apprenticeship"
  | "training";

export interface AutomationCalibration {
  /** ITU digital infrastructure score, 0–1. */
  digitalInfraScore: number;
  /** Dampening coefficient on Frey-Osborne baselines. */
  alpha: number;
  /** Routine-task uplift coefficient. */
  beta: number;
  /** Source dataset for routine-task share. */
  taskSrc: "ilo-step" | "ilo-future-of-work" | string;
}

export interface CountryConstraints {
  /** Average bandwidth budget, kbps. */
  bw: number;
  /** Likelihood the device is shared (0–1). */
  sharedDevice: number;
  /** Primary access mode. */
  access: "smartphone" | "feature-phone" | "shared-pc" | string;
}

export interface CountryStats {
  /** Youth NEET share (%). World Bank WDI SL.UEM.NEET.ZS */
  neet: number;
  /** Informal employment share (% of non-agricultural). */
  informal: number;
  /** Median youth wage (in country currency, monthly). ILOSTAT slice. */
  wage_youth: number;
  /** GDP growth (annual %). World Bank WDI NY.GDP.PCAP.KD.ZG */
  gdp_growth: number;
  /** Youth unemployment rate (%). */
  unemployment_youth: number;
}

export type SectorBreakdown = ReadonlyArray<readonly [string, number]>;

export interface Country {
  id: CountryId;
  name: string;
  flag: string;
  capital: string;
  locale: CountryLocale;

  /** ISO-4217 currency code, e.g. "GHS". */
  currency: string;
  /** Display symbol, e.g. "GH₵". */
  symbol: string;
  wageUnit: "monthly" | "hourly" | "daily";

  /** Sector classification scheme used in this country. */
  sectorScheme: "ISIC-Rev4" | "CNAE 2.0" | "CNAE-equiv (local)" | string;

  taxonomy: CountryTaxonomy;
  opportunityTypes: OpportunityType[];
  automation: AutomationCalibration;
  constraints: CountryConstraints;
  stats: CountryStats;

  /** Sector mix, ordered. */
  sectors: SectorBreakdown;

  /** 12-cell month-of-year heatmap of opportunity density (0–100). */
  heatmap?: number[];
}

/* ── Skills ─────────────────────────────────────────────────────────── */

export interface Skill {
  /** ESCO concept id, e.g. "esco_S3.4.2". */
  id: string;
  /** Human-readable label. */
  label: string;
  /** ISCO-08 4-digit code, e.g. "7421". */
  isco: string;
  /** True iff the user has confirmed the mapping. */
  verified: boolean;
  /** Mapping confidence (0–1). */
  conf: number;
  /** Provenance line shown in the UI. */
  source: string;
}

/* ── Opportunities ──────────────────────────────────────────────────── */

export interface Opportunity {
  id: string;
  title: string;
  isco: string;
  employer: string;
  type: OpportunityType;
  /** Wage in `currency`, in `wageUnit`. */
  wage: number;
  currency: string;
  /** Match strength (0–100). */
  match: number;
  /** Time-to-reachable, in months. 0 = already practicing. */
  distance_months: number;
  /** Display string for sectoral employment growth, e.g. "+6% YoY". */
  growth: string;
  /** Honest reason this match is surfaced. */
  evidence: string;
}

/* ── Adjacent skills (Module 02) ────────────────────────────────────── */

export interface AdjacentSkill {
  from: string;
  to: string;
  /** Skill-distance (0–1, lower = more reachable). */
  distance: number;
  /** Recalibrated automation risk (0–1). */
  autoRisk: number;
  /** Sector employment growth display string. */
  growth: string;
  /** Source dataset attribution. */
  dataSrc: string;
}

/* ── Persona (canonical from the brief) ─────────────────────────────── */

export interface AmaraPersona {
  name: string;
  age: number;
  location: string;
  education: { credential: string; isced: number };
  /** Tuples of [language, level]. Levels: native, A1-C2. */
  languages: ReadonlyArray<readonly [string, string]>;
  /** Free-text experiences as Amara typed them. */
  rawExperiences: string[];
}

export interface UnmappedFixture {
  countries: Record<CountryId, Country>;
  amara: AmaraPersona;
  esco: Skill[];
  opportunities: Opportunity[];
  adjacents: AdjacentSkill[];
  i18n: Record<string, Record<string, string>>;
}
