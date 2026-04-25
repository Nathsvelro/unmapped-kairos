import "server-only";
import type { CountryContext, SkillsProfile, VerifiedSkill } from "../types";
import {
  freyOsborneAdapter,
  iloTaskContentAdapter,
  type FreyOsborneOccupation,
  type RoutineSharesBySector,
  escoAdapter,
  type EscoSkill,
} from "../../adapters";

/**
 * The opinionated formula for LMIC automation risk.
 *
 * Frey-Osborne 2017 estimates "probability of computerisation" per
 * occupation, but assumes US task composition and US-level digital
 * infrastructure. Both differ in LMICs. We recalibrate transparently:
 *
 *     adjusted = baseline * (1 - alpha * (1 - digitalInfraScore))
 *                + beta * routineTaskShare
 *
 *   - alpha dampens raw risk where digital infra is low (because the
 *     deployment of automation lags meaningfully behind frontier estimates).
 *   - beta uplifts risk for routine-task-heavy work (because routine work
 *     is the FIRST to automate once infra catches up — it's structurally
 *     more exposed regardless of current rollout).
 *
 * Both alpha and beta come from the CountryContext, so a partner can
 * recalibrate without touching code.
 */
export function lmicAdjustedRisk(
  baseline: number,
  routineTaskShare: number,
  ctx: CountryContext,
): number {
  const { alpha, beta, digitalInfraScore } = ctx.automation.calibration;
  const dampened = baseline * (1 - alpha * (1 - digitalInfraScore));
  const uplifted = dampened + beta * routineTaskShare;
  return clamp(uplifted, 0, 1);
}

export interface SkillRiskAssessment {
  skill: VerifiedSkill;
  iscoMapping?: string;
  occupationLabel?: string;
  baselineRisk?: number;
  routineTaskShare?: number;
  adjustedRisk?: number;
  band: "high" | "medium" | "durable" | "unmapped";
  reasoning: string;
}

export interface ProfileRiskSummary {
  perSkill: SkillRiskAssessment[];
  highShare: number;
  mediumShare: number;
  durableShare: number;
  /** 0-1: Profile-wide automation pressure */
  weightedRisk: number;
  calibration: {
    alpha: number;
    beta: number;
    digitalInfraScore: number;
    explanation: string;
  };
}

export async function assessProfileRisk(
  profile: SkillsProfile,
  ctx: CountryContext,
): Promise<ProfileRiskSummary> {
  const [occupations, routineShares, escoSkills] = await Promise.all([
    freyOsborneAdapter.fetch(ctx.id),
    iloTaskContentAdapter.fetch(ctx.id),
    escoAdapter.fetch(ctx.id),
  ]);

  const perSkill: SkillRiskAssessment[] = profile.skills.map((skill) =>
    assessOneSkill(skill, occupations, routineShares, escoSkills, ctx),
  );

  const mapped = perSkill.filter((s) => s.adjustedRisk !== undefined);
  const total = mapped.length || 1;
  const high = mapped.filter((s) => s.band === "high").length;
  const medium = mapped.filter((s) => s.band === "medium").length;
  const durable = mapped.filter((s) => s.band === "durable").length;

  const weightedRisk =
    mapped.reduce((sum, s) => sum + (s.adjustedRisk ?? 0), 0) / total;

  return {
    perSkill,
    highShare: high / total,
    mediumShare: medium / total,
    durableShare: durable / total,
    weightedRisk,
    calibration: {
      alpha: ctx.automation.calibration.alpha,
      beta: ctx.automation.calibration.beta,
      digitalInfraScore: ctx.automation.calibration.digitalInfraScore,
      explanation: explainCalibration(ctx),
    },
  };
}

function assessOneSkill(
  skill: VerifiedSkill,
  occupations: FreyOsborneOccupation[],
  routineShares: RoutineSharesBySector,
  escoSkills: EscoSkill[],
  ctx: CountryContext,
): SkillRiskAssessment {
  // Prefer ISCO mapping from the user's verified profile;
  // fall back to looking up via ESCO link.
  const isco = skill.isco?.code ?? findIscoFromEsco(skill, escoSkills);
  if (!isco) {
    return {
      skill,
      band: "unmapped",
      reasoning:
        "We could not map this skill to an occupation in the local taxonomy. Risk assessment skipped.",
    };
  }

  const occupation = occupations.find((o) => o.isco_mapping === isco);
  if (!occupation) {
    return {
      skill,
      iscoMapping: isco,
      band: "unmapped",
      reasoning:
        "ISCO mapping found, but no Frey-Osborne baseline for this occupation in the curated set.",
    };
  }

  const sectorKey = inferSectorFromIsco(isco);
  const routineShare = sectorKey ? (routineShares[sectorKey] ?? 0.5) : 0.5;

  const adjusted = lmicAdjustedRisk(
    occupation.automation_probability,
    routineShare,
    ctx,
  );

  const band: SkillRiskAssessment["band"] =
    adjusted >= 0.66 ? "high" : adjusted >= 0.33 ? "medium" : "durable";

  return {
    skill,
    iscoMapping: isco,
    occupationLabel: occupation.label,
    baselineRisk: occupation.automation_probability,
    routineTaskShare: routineShare,
    adjustedRisk: adjusted,
    band,
    reasoning: bandReasoning(band, occupation.label, ctx, adjusted),
  };
}

function findIscoFromEsco(
  skill: VerifiedSkill,
  escoSkills: EscoSkill[],
): string | undefined {
  if (!skill.esco) return undefined;
  const found = escoSkills.find((s) => s.uri === skill.esco?.uri);
  return found?.occupations[0];
}

/**
 * Map an ISCO 4-digit code to one of the sector keys used in our
 * routine-share dataset. This is a coarse mapping for the prototype.
 */
function inferSectorFromIsco(isco: string): string | undefined {
  const major = isco[0];
  switch (major) {
    case "2":
      // Professionals — split a few common cases
      if (["2512", "2514", "2522", "2356"].includes(isco)) return "ict";
      if (["2330", "2310"].includes(isco)) return "education";
      if (["2221", "2240", "2266", "2269"].includes(isco)) return "health";
      if (["2411", "2431"].includes(isco)) return "professional";
      return "professional";
    case "3":
      if (isco.startsWith("32")) return "health";
      return "professional";
    case "4":
      return "trade-retail";
    case "5":
      if (["5120", "9411", "9412", "5132"].includes(isco)) return "hospitality";
      if (isco.startsWith("53")) return "health";
      return "trade-retail";
    case "6":
      return "agriculture";
    case "7":
      if (["7115", "7126", "7411", "7413", "7421"].includes(isco)) {
        return "construction";
      }
      if (["7531", "8219"].includes(isco)) return "manufacturing";
      if (["7231"].includes(isco)) return "transport-storage";
      return "manufacturing";
    case "8":
      if (["8322"].includes(isco)) return "transport-storage";
      return "manufacturing";
    case "9":
      if (["9211"].includes(isco)) return "agriculture";
      if (["9313"].includes(isco)) return "construction";
      if (["9411", "9412"].includes(isco)) return "hospitality";
      return "trade-retail";
    default:
      return undefined;
  }
}

function bandReasoning(
  band: SkillRiskAssessment["band"],
  label: string,
  ctx: CountryContext,
  adjustedRisk: number,
): string {
  const pct = Math.round(adjustedRisk * 100);
  switch (band) {
    case "high":
      return `${label}-type tasks face high automation pressure (${pct}%) given local digital infrastructure trajectory.`;
    case "medium":
      return `${label}-type tasks face moderate automation pressure (${pct}%); some sub-tasks are vulnerable, others are not.`;
    case "durable":
      return `${label}-type tasks are relatively durable (${pct}% pressure) — much of this work resists automation in ${countryShort(ctx)}.`;
    case "unmapped":
      return `Skill could not be mapped — risk not assessed.`;
  }
}

function countryShort(ctx: CountryContext): string {
  return ctx.displayName.en ?? ctx.id;
}

function explainCalibration(ctx: CountryContext): string {
  const { alpha, beta, digitalInfraScore } = ctx.automation.calibration;
  const dampPct = Math.round(alpha * (1 - digitalInfraScore) * 100);
  return [
    `Frey-Osborne baselines were dampened by ${dampPct}% to reflect the country's`,
    `digital infrastructure score of ${digitalInfraScore.toFixed(2)}.`,
    `Routine-task share contributes up to +${(beta * 100).toFixed(0)}% uplift`,
    `for sectors with high routine intensity.`,
  ].join(" ");
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
