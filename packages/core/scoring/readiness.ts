import "server-only";
import type { CountryContext, SkillsProfile } from "../types";
import { assessProfileRisk, type ProfileRiskSummary } from "./automationRisk";
import {
  escoAdapter,
  iloTaskContentAdapter,
  freyOsborneAdapter,
  sectorEmploymentAdapter,
  type SectorEmploymentRow,
} from "../../adapters";
import { lmicAdjustedRisk } from "./automationRisk";

export interface AdjacentSkill {
  uri: string;
  label: string;
  // Why we suggested it
  whyDurable: string;
  whyReachable: string;
  whyGrowing: string;
  // Quantitative breakdown
  estimatedRisk: number;
  sectorGrowthYoY: number;
  sharedOccupations: string[];
  reachableInMonths: number;
}

export interface ReadinessReport {
  risk: ProfileRiskSummary;
  adjacentDurable: AdjacentSkill[];
}

/**
 * Compute the full readiness report for a profile in a country context.
 *
 * "Adjacent durable" skills are skills the user does NOT have, but that:
 *   1. share an occupation with at least one of their verified skills (reachable)
 *   2. have a low LMIC-adjusted automation risk (durable)
 *   3. fall in a sector with positive YoY employment growth (growing)
 */
export async function buildReadinessReport(
  profile: SkillsProfile,
  ctx: CountryContext,
): Promise<ReadinessReport> {
  const [risk, escoSkills, sectorGrowth, occupations, routineShares] =
    await Promise.all([
      assessProfileRisk(profile, ctx),
      escoAdapter.fetch(ctx.id),
      sectorEmploymentAdapter.fetch(ctx.id),
      freyOsborneAdapter.fetch(ctx.id),
      iloTaskContentAdapter.fetch(ctx.id),
    ]);

  // Set of skills the user already has
  const userUris = new Set(
    profile.skills
      .filter((s) => s.userConfirmed && s.esco)
      .map((s) => s.esco!.uri),
  );

  // Set of occupations the user has any pathway into via verified skills
  const userOccupations = new Set<string>();
  for (const skill of profile.skills) {
    if (!skill.userConfirmed) continue;
    if (skill.isco) userOccupations.add(skill.isco.code);
    if (skill.esco) {
      const esco = escoSkills.find((s) => s.uri === skill.esco!.uri);
      esco?.occupations.forEach((o) => userOccupations.add(o));
    }
  }

  const candidates: AdjacentSkill[] = [];

  for (const candidate of escoSkills) {
    if (userUris.has(candidate.uri)) continue;

    const sharedOccupations = candidate.occupations.filter((o) =>
      userOccupations.has(o),
    );
    if (sharedOccupations.length === 0) continue;

    const baseline = baselineForCandidate(candidate, occupations);
    if (baseline === undefined) continue;

    const sectorKey = sectorForCandidate(candidate);
    const routineShare = sectorKey
      ? (routineShares[sectorKey] ?? 0.5)
      : 0.5;
    const sectorRow: SectorEmploymentRow | undefined = sectorKey
      ? sectorGrowth[sectorKey]
      : undefined;

    const adjusted = lmicAdjustedRisk(baseline, routineShare, ctx);
    if (adjusted >= 0.5) continue; // not durable
    if (!sectorRow || sectorRow.yoy_change_pct <= 0) continue; // not growing

    const months = estimateReachabilityMonths(sharedOccupations.length);

    candidates.push({
      uri: candidate.uri,
      label: candidate.preferredLabel[ctx.locale.primary] ??
        candidate.preferredLabel.en ??
        candidate.uri,
      whyDurable: `Adjusted automation risk ${(adjusted * 100).toFixed(0)}% — durable in ${ctx.id}.`,
      whyReachable: `Shares ${sharedOccupations.length} occupation${sharedOccupations.length > 1 ? "s" : ""} with skills you already have.`,
      whyGrowing: sectorRow
        ? `${sectorKey} sector employment grew ${sectorRow.yoy_change_pct.toFixed(1)}% YoY.`
        : "Sector growth data unavailable.",
      estimatedRisk: adjusted,
      sectorGrowthYoY: sectorRow.yoy_change_pct,
      sharedOccupations,
      reachableInMonths: months,
    });
  }

  // Sort: prefer fewer months, then lower risk, then higher growth
  candidates.sort(
    (a, b) =>
      a.reachableInMonths - b.reachableInMonths ||
      a.estimatedRisk - b.estimatedRisk ||
      b.sectorGrowthYoY - a.sectorGrowthYoY,
  );

  return {
    risk,
    adjacentDurable: candidates.slice(0, 5),
  };
}

function baselineForCandidate(
  candidate: { occupations: string[] },
  occupations: { isco_mapping: string; automation_probability: number }[],
): number | undefined {
  // Use the lowest-risk Frey-Osborne baseline among the candidate's
  // occupations — we're looking for durable angles into the skill.
  const probs = candidate.occupations
    .map((isco) => occupations.find((o) => o.isco_mapping === isco))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => o.automation_probability);
  if (probs.length === 0) return undefined;
  return Math.min(...probs);
}

function sectorForCandidate(candidate: { occupations: string[] }):
  | string
  | undefined {
  const isco = candidate.occupations[0];
  if (!isco) return undefined;
  const major = isco[0];
  switch (major) {
    case "2":
      if (["2512", "2514", "2522"].includes(isco)) return "ict";
      if (["2330"].includes(isco)) return "education";
      if (["2221"].includes(isco)) return "health";
      return "professional";
    case "3":
      return "health";
    case "5":
      if (["5120"].includes(isco)) return "hospitality";
      return "trade-retail";
    case "7":
      if (["7421", "7115", "7126"].includes(isco)) return "construction";
      return "manufacturing";
    case "9":
      return "agriculture";
    default:
      return "professional";
  }
}

function estimateReachabilityMonths(sharedOccupationCount: number): number {
  // The more occupations they share with your existing skills, the closer.
  if (sharedOccupationCount >= 3) return 1;
  if (sharedOccupationCount === 2) return 3;
  return 6;
}
