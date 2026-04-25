import type { CountryId, IscedLevel, LocaleId } from "./context";

/**
 * SkillsProfile is the portable "passport" that a youth user owns.
 *
 * It is JSON, exportable, re-importable in another country context.
 * ESCO/ISCO codes are universal so the skills survive context changes;
 * only local interpretation (currency, sector classification) adapts.
 */

export interface ESCOReference {
  /** ESCO concept URI or short id */
  uri: string;
  /** Preferred label in English (always present for portability) */
  label: string;
  /** Preferred label in user's locale, if available */
  localLabel?: string;
  /** "skill" | "occupation" */
  type: "skill" | "occupation";
}

export interface ISCOReference {
  /** 4-digit ISCO-08 unit group code (e.g. "7421" Electronics mechanics) */
  code: string;
  label: string;
}

export interface VerifiedSkill {
  /** What the user typed, verbatim — never lose this */
  userText: string;
  /** Their estimate of how long they've practiced */
  yearsExperience?: number;
  /** Self-rated proficiency 1-5 */
  proficiency?: 1 | 2 | 3 | 4 | 5;
  /** ESCO mapping (may be absent if user rejected all suggestions) */
  esco?: ESCOReference;
  /** ISCO mapping for occupation-aligned skills */
  isco?: ISCOReference;
  /** Confidence the LLM had in the mapping (0..1) */
  mappingConfidence?: number;
  /** True if the user explicitly confirmed the mapping */
  userConfirmed: boolean;
  /**
   * Provenance string surfaced in the UI: how this mapping was created and
   * by what (e.g. "Claude · claude-sonnet-4-6 → ESCO; user-confirmed",
   * "OpenAI · gpt-4o-mini → ESCO; pending review", "Demo seed",
   * "Self-declared (offline fuzzy match)"). The brief asks every AI
   * suggestion to show its source — this field is that source.
   */
  source?: string;
}

export interface CredentialEntry {
  /** Local credential name as the user gave it (e.g. "WAEC SSCE") */
  localName: string;
  /** Mapped to ISCED via the country's credentialMap */
  iscedLevel: IscedLevel;
  /** Year obtained (optional) */
  year?: number;
  /** Country where obtained */
  countryId: CountryId;
}

export interface LanguageEntry {
  /** ISO 639-1 or BCP-47 */
  code: string;
  /** Self-rated CEFR; "native" allowed */
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";
  isPrimary?: boolean;
}

export interface SkillsProfile {
  /** Version of the SkillsProfile schema, for future migrations */
  version: "1";

  /** Locally generated id, not personally identifying */
  id: string;

  /** Country context the profile was originally built in */
  sourceCountryId: CountryId;
  sourceLocale: LocaleId;
  /**
   * Original country this profile was issued in. Set on first creation;
   * preserved across imports so the chain of custody never gets lost when
   * Amara takes her Ghana profile and uses it in Bangladesh. Falls back
   * to `sourceCountryId` when the profile predates this field.
   */
  originCountryId?: CountryId;

  credentials: CredentialEntry[];
  languages: LanguageEntry[];
  skills: VerifiedSkill[];

  /** Free-text notes from the user about goals, constraints, etc. */
  notes?: string;

  meta: {
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
    /** SHA-256 hash of the canonicalized profile, for integrity checks */
    checksum?: string;
  };
}
