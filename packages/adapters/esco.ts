import "server-only";
import type { DataAdapter } from "./_types";
import type { CountryId, LocaleId } from "../core/types";
import { readSnapshot } from "./snapshot";

export interface EscoSkill {
  uri: string;
  preferredLabel: Record<string, string>;
  description?: Record<string, string>;
  broaderType: "skill" | "language" | "competence";
  /** ISCO unit group codes where this skill is essential or optional */
  occupations: string[];
}

interface EscoSnapshot {
  skills: EscoSkill[];
}

export const escoAdapter: DataAdapter<EscoSkill[]> = {
  id: "esco",
  sourceUrl: "https://esco.ec.europa.eu/en/classification",
  dataYear: 2024,
  async fetch(_country: CountryId) {
    const snap = await readSnapshot<EscoSnapshot>("esco", "skills.json");
    return snap.skills;
  },
};

export function escoLabel(skill: EscoSkill, locale: LocaleId): string {
  return (
    skill.preferredLabel[locale] ??
    skill.preferredLabel.en ??
    skill.uri
  );
}

export function escoDescription(
  skill: EscoSkill,
  locale: LocaleId,
): string | undefined {
  if (!skill.description) return undefined;
  return skill.description[locale] ?? skill.description.en;
}

/**
 * Quick fuzzy match of a free-text query to ESCO skill labels.
 * Returns top N candidates with a similarity score.
 *
 * This is a simple deterministic baseline used by the API for fallback —
 * the real mapping is done by Claude in /api/extract-skills.
 */
export function fuzzyMatchSkills(
  skills: EscoSkill[],
  query: string,
  locale: LocaleId,
  limit = 5,
): Array<{ skill: EscoSkill; score: number }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = skills.map((s) => {
    const labels = [
      s.preferredLabel[locale],
      s.preferredLabel.en,
      ...Object.values(s.preferredLabel),
    ].filter(Boolean) as string[];

    let best = 0;
    for (const label of labels) {
      const lc = label.toLowerCase();
      if (lc === q) best = Math.max(best, 1);
      else if (lc.includes(q)) best = Math.max(best, 0.7);
      else if (q.includes(lc)) best = Math.max(best, 0.5);
      else {
        const overlap = wordOverlap(lc, q);
        best = Math.max(best, overlap);
      }
    }
    return { skill: s, score: best };
  });

  return scored
    .filter((s) => s.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function wordOverlap(a: string, b: string): number {
  const aw = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const bw = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (aw.size === 0 || bw.size === 0) return 0;
  let shared = 0;
  for (const w of aw) if (bw.has(w)) shared++;
  return shared / Math.max(aw.size, bw.size);
}
