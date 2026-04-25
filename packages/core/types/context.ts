/**
 * CountryContext is the Unmapped Kairos protocol contract.
 *
 * Any government / NGO / training provider can author a CountryContext
 * JSON file to onboard a new country. The runtime reconfigures itself
 * (UI, taxonomy, currency, automation calibration, opportunity types)
 * by reading this single object — no code changes required.
 */

export type LocaleId = "en" | "tw" | "bn" | "es" | "pt";
export type CountryId = "GH" | "BD" | "MX" | "BR";
export type IscedLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface I18nString {
  // Default fallback
  en: string;
  // Other locales — at least the country's primary locale should be filled
  [locale: string]: string | undefined;
}

export interface EducationLevel {
  id: string;
  label: I18nString;
  iscedEquivalent: IscedLevel;
  durationYears?: number;
}

export interface CredentialMapEntry {
  iscedLevel: IscedLevel;
  notes?: I18nString;
}

export interface AutomationCalibration {
  /**
   * 0..1 from ITU Digital Development.
   * Higher = more digital infrastructure = automation pressure is more real here.
   * Lower = automation pressure is dampened.
   */
  digitalInfraScore: number;

  /**
   * Source of the routine-vs-non-routine task share.
   */
  taskCompositionSource: "ilo-step" | "ilo-future-of-work";

  /**
   * Dampening coefficient: how much to reduce raw Frey-Osborne risk
   * for low-digital-infra contexts. Range ~ 0.0-0.5.
   * Formula: adjusted = baseline * (1 - alpha * (1 - digitalInfraScore))
   */
  alpha: number;

  /**
   * Routine-task uplift: how much to add back when the user's task mix
   * is heavily routine (because routine work is the FIRST to automate
   * once infra catches up). Range ~ 0.0-0.3.
   */
  beta: number;
}

export type AdapterId = string; // e.g. "ilostat", "wdi", "data360-informality"

export interface CountryContext {
  /** ISO-3166 alpha-2 */
  id: CountryId;

  displayName: I18nString;

  locale: {
    primary: LocaleId;
    fallback: LocaleId;
    /** ISO-15924 script code */
    script: "Latn" | "Beng";
    rtl: boolean;
  };

  educationTaxonomy: {
    scheme: "ISCED-2011" | "local";
    levels: EducationLevel[];
    /** Local credential name -> ISCED mapping */
    credentialMap: Record<string, CredentialMapEntry>;
  };

  laborMarket: {
    sectorScheme: "ISIC-Rev4" | "NAICS" | "CNAE" | "local";
    /** ISO-4217 */
    currency: string;
    wageUnit: "monthly" | "hourly" | "daily";
    /** Each adapter id resolves to a file in data/snapshots/ */
    adapters: {
      wages: AdapterId;
      employment: AdapterId;
      informality: AdapterId;
      genderGap: AdapterId;
      digitalConnectivity: AdapterId;
    };
  };

  automation: {
    baseline: "frey-osborne";
    calibration: AutomationCalibration;
  };

  opportunityTypes: Array<
    "formal" | "self-employment" | "gig" | "apprenticeship" | "training"
  >;

  constraints: {
    /** Used to set bandwidth budgets in the UI */
    avgBandwidthKbps: number;
    /** 0..1, used for "what to expect" hints */
    sharedDeviceLikelihood: number;
    primaryAccessMode: "smartphone" | "feature-phone" | "shared-pc";
  };

  /** Human-readable provenance shown to the user */
  meta: {
    sourcesYear: number;
    lastUpdated: string; // ISO date
    notes?: I18nString;
  };
}
