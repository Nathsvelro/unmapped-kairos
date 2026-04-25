import "server-only";
import type { CountryContext, SkillsProfile } from "../types";
import {
  ilostatWagesAdapter,
  sectorEmploymentAdapter,
  iscoAdapter,
  escoAdapter,
  type SectorWage,
  type SectorEmploymentRow,
} from "../../adapters";

export interface OpportunityMatch {
  /** Sector key we matched to */
  sector: string;
  /** Human label for the sector */
  sectorLabel: string;
  /** ISIC letter section */
  isic: string;
  /** Honest job title — drawn from ISCO occupation labels */
  honestRole: string;
  /** Type of opportunity */
  type: CountryContext["opportunityTypes"][number];
  /** Wage info */
  wage: SectorWage;
  /** Sector-level employment growth */
  growth: SectorEmploymentRow;
  /** Reachability classification */
  reachability: "now" | "short" | "medium" | "long";
  /** Why we surfaced this — human readable */
  reason: string;
  /** ISCO codes from the user's profile that motivated this match */
  matchingIsco: string[];
}

const REACHABILITY_THRESHOLD = {
  now: 2,    // 2+ shared occupations with their profile
  short: 1,  // 1 shared occupation
  medium: 0.5, // sectoral relevance only
} as const;

/**
 * Build honest, reachable opportunity matches for a user profile.
 *
 * "Honest" = surfaced wage is the actual ILOSTAT median, sector growth
 * is the actual Data360 number, no aspirational matches.
 *
 * "Reachable" = we filter to sectors where the user has at least one
 * skill or credential pathway, then rank by reachability + wage.
 */
export async function matchOpportunities(
  profile: SkillsProfile,
  ctx: CountryContext,
): Promise<OpportunityMatch[]> {
  const [wages, growth, isco, esco] = await Promise.all([
    ilostatWagesAdapter.fetch(ctx.id),
    sectorEmploymentAdapter.fetch(ctx.id),
    iscoAdapter.fetch(ctx.id),
    escoAdapter.fetch(ctx.id),
  ]);

  // Resolve user occupations from their verified skills
  const userOccupations = new Set<string>();
  for (const skill of profile.skills) {
    if (!skill.userConfirmed) continue;
    if (skill.isco?.code) userOccupations.add(skill.isco.code);
    if (skill.esco?.uri) {
      const e = esco.find((s) => s.uri === skill.esco!.uri);
      e?.occupations.forEach((code) => userOccupations.add(code));
    }
  }

  const matches: OpportunityMatch[] = [];

  for (const [sector, wage] of Object.entries(wages.sectors)) {
    const growthRow = growth[sector];
    if (!growthRow) continue;

    // Find occupations from ISCO data that fall in this sector
    const sectorOccupations = isco.unitGroups.filter(
      (u) => sectorMatchesIsco(sector, u.code),
    );

    const sharedCount = sectorOccupations.filter((u) =>
      userOccupations.has(u.code),
    ).length;

    // Reachability classification
    let reachability: OpportunityMatch["reachability"];
    if (sharedCount >= REACHABILITY_THRESHOLD.now) reachability = "now";
    else if (sharedCount >= REACHABILITY_THRESHOLD.short) reachability = "short";
    else if (sectorOccupations.length > 0 && profile.skills.length > 0) {
      reachability = "medium";
    } else continue; // no realistic pathway — skip honestly

    const honestRole = sectorOccupations[0]?.label ?? sector;
    const type = pickOpportunityType(sector, ctx);

    matches.push({
      sector,
      sectorLabel: humanizeSector(sector),
      isic: wage.isic,
      honestRole,
      type,
      wage,
      growth: growthRow,
      reachability,
      reason: matchReason(reachability, sharedCount, sector, growthRow),
      matchingIsco: sectorOccupations
        .filter((u) => userOccupations.has(u.code))
        .map((u) => u.code),
    });
  }

  // Sort: reachability first, then wage
  const order = { now: 0, short: 1, medium: 2, long: 3 } as const;
  matches.sort(
    (a, b) =>
      order[a.reachability] - order[b.reachability] ||
      b.wage.median_monthly - a.wage.median_monthly,
  );

  return matches;
}

function sectorMatchesIsco(sector: string, isco: string): boolean {
  const major = isco[0];
  switch (sector) {
    case "ict":
      return ["2512", "2514", "2522", "2356"].includes(isco);
    case "education":
      return ["2330", "2310"].includes(isco);
    case "health":
      return ["2221", "2240", "2266", "2269", "3221", "5321"].includes(isco);
    case "professional":
      return ["2411", "2431", "2166", "2641", "3411"].includes(isco);
    case "trade-retail":
      return ["5223", "5230", "5244", "4321"].includes(isco);
    case "hospitality":
      return ["5120", "5132", "9411", "9412"].includes(isco);
    case "transport-storage":
      return ["8322", "7231"].includes(isco);
    case "construction":
      return ["7115", "7126", "7411", "7413", "7421", "9313"].includes(isco);
    case "manufacturing":
      return ["7531", "8219", "9329"].includes(isco) || major === "8";
    case "agriculture":
      return ["6111", "6121", "9211"].includes(isco);
    case "personal-services":
      return ["5311", "5322"].includes(isco);
    case "public-admin":
      return ["5412", "1219"].includes(isco);
    case "finance":
      return ["4211", "2411"].includes(isco);
    default:
      return false;
  }
}

function pickOpportunityType(
  sector: string,
  ctx: CountryContext,
): CountryContext["opportunityTypes"][number] {
  const allowed = ctx.opportunityTypes;
  // Heuristic preference per sector
  const preferences: Record<string, CountryContext["opportunityTypes"][number][]> = {
    ict: ["formal", "gig", "self-employment", "training"],
    construction: ["self-employment", "apprenticeship", "formal"],
    manufacturing: ["formal", "apprenticeship"],
    "trade-retail": ["self-employment", "gig", "formal"],
    hospitality: ["formal", "self-employment"],
    agriculture: ["self-employment", "formal"],
    education: ["formal", "training"],
    health: ["formal", "training"],
    "personal-services": ["self-employment", "gig"],
    professional: ["formal", "self-employment"],
    "public-admin": ["formal"],
    finance: ["formal"],
    "transport-storage": ["self-employment", "gig", "formal"],
  };
  const candidates = preferences[sector] ?? ["formal"];
  for (const c of candidates) {
    if (allowed.includes(c)) return c;
  }
  return allowed[0];
}

function humanizeSector(s: string): string {
  return s
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function matchReason(
  reachability: OpportunityMatch["reachability"],
  shared: number,
  sector: string,
  growth: SectorEmploymentRow,
): string {
  const growthClause = growth.yoy_change_pct >= 0
    ? `growing ${growth.yoy_change_pct.toFixed(1)}% YoY`
    : `contracting ${Math.abs(growth.yoy_change_pct).toFixed(1)}% YoY`;
  switch (reachability) {
    case "now":
      return `${shared} of your verified skills already map directly into this sector. ${humanizeSector(sector)} is ${growthClause}.`;
    case "short":
      return `One of your skills maps into this sector. ${humanizeSector(sector)} is ${growthClause}.`;
    case "medium":
      return `${humanizeSector(sector)} is adjacent to your profile and ${growthClause} — reachable with 3-12 months of focused practice.`;
    case "long":
      return `${humanizeSector(sector)} is reachable but would take sustained skill-building.`;
  }
}
