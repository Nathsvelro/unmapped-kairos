import "server-only";
import { chat, detectProvider, type ProviderId } from "./provider";
import type {
  CountryContext,
  LocaleId,
  SkillsProfile,
} from "../core/types";
import type { ProfileRiskSummary } from "../core/scoring/automationRisk";

export interface CoachAction {
  /** ESCO label or user-text of the skill this action targets. */
  targetSkill: string;
  /** ≤ 28 chars verb-led label, e.g. "Add Git basics". */
  title: string;
  /** 1-2 sentence concrete step, naming tools / habits / proof to collect. */
  detail: string;
  /** Realistic effort window. */
  horizon: "this week" | "1-3 months" | "3-12 months";
}

export interface CoachResource {
  /** Specific name (org, programme, channel). */
  name: string;
  /** Short type tag, e.g. "training", "apprenticeship", "youtube". */
  type: string;
  /** Why this fits the user, ≤ 1 sentence. */
  reason: string;
}

export interface CoachAdvice {
  /** ≤ 2 sentences summarizing the user's at-risk surface. */
  atRiskSummary: string;
  actions: CoachAction[];
  resources: CoachResource[];
  /** 2-3 plain-language statements of what this advice cannot verify. */
  honestLimits: string[];
  usedLLM: boolean;
  cacheReadTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  provider?: ProviderId;
  model?: string;
}

const LOCALE_NAME: Record<LocaleId, string> = {
  en: "English",
  tw: "Twi (Akan)",
  bn: "Bangla (Bengali)",
  es: "Spanish",
  pt: "Portuguese",
};

/**
 * The durability-coach module — given a user profile, the active country
 * context, and the readiness summary, produces concrete, local, honest
 * advice. Claude is the primary path; the offline fallback is rule-based
 * and points back to the data tabs rather than inventing specifics.
 */
export async function coachAdvice({
  profile,
  ctx,
  uiLocale,
  risk,
}: {
  profile: SkillsProfile;
  ctx: CountryContext;
  uiLocale: LocaleId;
  risk: ProfileRiskSummary;
}): Promise<CoachAdvice> {
  if (!detectProvider()) {
    return offlineFallback(profile, ctx, risk);
  }

  const systemPrompt = buildSystemPrompt(ctx, uiLocale);
  const userPrompt = buildUserPrompt(profile, risk);

  try {
    const response = await chat({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1400,
      model: process.env.UNMAPPED_COACH_MODEL,
    });
    if (!response) throw new Error("no provider available");

    const parsed = parseResponse(response.text);
    if (!parsed) {
      console.warn("Coach LLM returned unparsable JSON, falling back");
      return offlineFallback(profile, ctx, risk);
    }

    return {
      ...parsed,
      usedLLM: true,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      cacheReadTokens: response.cacheReadTokens,
      provider: response.provider,
      model: response.model,
    };
  } catch (err) {
    console.error("Coach LLM error:", err);
    return offlineFallback(profile, ctx, risk);
  }
}

function buildSystemPrompt(
  ctx: CountryContext,
  uiLocale: LocaleId,
): string {
  const country = ctx.displayName.en ?? ctx.id;
  return `You are the Unmapped Kairos durability coach. Unmapped Kairos is open infrastructure for young people in low- and middle-income countries to surface real skills and reach real economic opportunity in the age of AI.

Your single job: read a user's profile and the country's automation calibration, then produce CONCRETE, LOCAL, HONEST advice on how to make their skills more durable.

Country context:
- Country: ${country} (${ctx.id})
- Currency: ${ctx.laborMarket.currency}
- Sector classification: ${ctx.laborMarket.sectorScheme}
- Opportunity types here: ${ctx.opportunityTypes.join(", ")}
- Digital infrastructure score (0-1): ${ctx.automation.calibration.digitalInfraScore}
- Calibration: α=${ctx.automation.calibration.alpha}, β=${ctx.automation.calibration.beta}
- Bandwidth assumption: ${ctx.constraints.avgBandwidthKbps} kbps, ${ctx.constraints.primaryAccessMode}

Reply in: ${LOCALE_NAME[uiLocale] ?? "English"}.

Rules:
- Be CONCRETE. Name specific tools, programmes, channels — not "consider learning more".
- Be LOCAL. Resources should be realistic for ${country}: real organisations, real apprenticeships, real online communities reachable on a smartphone.
- Be HONEST. End with 2-3 limits — what this advice CANNOT verify (e.g., wage promises, employer hiring intent, the user's actual living situation).
- Be SHORT. Each action's detail ≤ 2 sentences. Each resource's reason ≤ 1 sentence.
- Tie each action to one of the user's existing skills by exact label.
- DO NOT invent wage numbers, growth rates, or guarantee outcomes.
- DO NOT recommend solutions that assume always-on broadband.

Output strict JSON ONLY in this shape — nothing else:
{
  "atRiskSummary": "<= 2 sentences",
  "actions": [
    {
      "targetSkill": "<existing skill label>",
      "title": "<= 28 chars verb-led",
      "detail": "<1-2 sentences naming a tool / channel / habit / proof to collect>",
      "horizon": "this week" | "1-3 months" | "3-12 months"
    }
  ],
  "resources": [
    {
      "name": "<specific organisation, programme, or channel>",
      "type": "<short tag>",
      "reason": "<= 1 sentence>"
    }
  ],
  "honestLimits": ["<plain statement>", "<plain statement>"]
}

Aim for 3-4 actions and 3-4 resources. Always 2-3 honestLimits.`;
}

function buildUserPrompt(
  profile: SkillsProfile,
  risk: ProfileRiskSummary,
): string {
  const credentialLine = profile.credentials.length
    ? profile.credentials
        .map((c) => `${c.localName} (ISCED ${c.iscedLevel})`)
        .join(", ")
    : "no formal credentials on file";
  const langLine = profile.languages
    .map((l) => `${l.code}/${l.level}`)
    .join(", ");
  const skillLines = profile.skills
    .filter((s) => s.userConfirmed)
    .map((s) => {
      const label = s.esco?.label ?? s.userText;
      const isco = s.isco?.code ? ` (ISCO ${s.isco.code})` : "";
      const yrs = s.yearsExperience ? ` · ${s.yearsExperience}y` : "";
      return `  - ${label}${isco}${yrs} — user words: "${s.userText}"`;
    })
    .join("\n");

  const riskLines = risk.perSkill
    .filter((p) => p.adjustedRisk !== undefined)
    .map(
      (p) =>
        `  - ${p.skill.esco?.label ?? p.skill.userText}: ${p.band.toUpperCase()} (${
          p.adjustedRisk !== undefined
            ? Math.round(p.adjustedRisk * 100) + "%"
            : "n/a"
        }) — ${p.reasoning}`,
    )
    .join("\n");

  return `User profile:
- Credentials: ${credentialLine}
- Languages: ${langLine}
- Confirmed skills:
${skillLines || "  (none)"}

Per-skill recalibrated automation risk in this country:
${riskLines || "  (no risk data — likely no skills mapped yet)"}

Profile-wide weighted risk: ${(risk.weightedRisk * 100).toFixed(0)}% (${(risk.highShare * 100).toFixed(0)}% of skills high-risk, ${(risk.durableShare * 100).toFixed(0)}% durable).

Calibration explanation as the user sees it: ${risk.calibration.explanation}`;
}

function parseResponse(text: string): Omit<CoachAdvice, "usedLLM"> | null {
  const cleaned = text
    .replace(/^```json\s*/g, "")
    .replace(/^```\s*/g, "")
    .replace(/```\s*$/g, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (
      !obj ||
      typeof obj !== "object" ||
      typeof obj.atRiskSummary !== "string" ||
      !Array.isArray(obj.actions) ||
      !Array.isArray(obj.resources) ||
      !Array.isArray(obj.honestLimits)
    ) {
      return null;
    }
    return obj as Omit<CoachAdvice, "usedLLM">;
  } catch {
    return null;
  }
}

function offlineFallback(
  profile: SkillsProfile,
  ctx: CountryContext,
  risk: ProfileRiskSummary,
): CoachAdvice {
  const country = ctx.displayName.en ?? ctx.id;
  const high = risk.perSkill.filter((p) => p.band === "high");
  const durable = risk.perSkill.filter((p) => p.band === "durable");
  const summary =
    high.length > 0
      ? `${high.length} of your verified skills face high automation pressure in ${country}; ${durable.length} are relatively durable.`
      : `Your current mix is mostly durable in ${country}'s context — focus is on adding adjacent skills, not replacing what you have.`;

  const actions: CoachAction[] = high.slice(0, 3).map((p) => ({
    targetSkill: p.skill.esco?.label ?? p.skill.userText,
    title: "Make this skill harder to automate",
    detail:
      "Open the AI Readiness tab to see the durable adjacent skills suggested for this exact mapping. We can give you concrete next steps once the Claude API key is configured (offline mode is on).",
    horizon: "1-3 months",
  }));
  if (actions.length === 0 && profile.skills.length > 0) {
    actions.push({
      targetSkill: profile.skills[0].esco?.label ?? profile.skills[0].userText,
      title: "Capture proof of your work",
      detail:
        "Save photos / screenshots / before-and-afters from one job per week. Unmapped Kairos can sign your profile JSON; portable evidence is what employers ask for next.",
      horizon: "this week",
    });
  }

  const resources: CoachResource[] = [
    {
      name: "AI Readiness tab",
      type: "in-app",
      reason: "Already shows the adjacent durable skills computed for you.",
    },
    {
      name: "Opportunities tab",
      type: "in-app",
      reason: `Real ${ctx.laborMarket.currency} wages and sector growth from ILOSTAT + Data360.`,
    },
    {
      name: "Profile export",
      type: "JSON passport",
      reason:
        "Carry your skills out of the app to share by message or email; no login required.",
    },
  ];

  return {
    atRiskSummary: summary,
    actions,
    resources,
    honestLimits: [
      "Offline mode is on — no Claude API key configured. The personalised actions and local resources you'd see in online mode are blank here.",
      "Even online, this coach cannot verify employer hiring intent or guarantee a job; it can only point at where the labor data and your skills overlap.",
      `Wage and sector figures are ${ctx.meta.sourcesYear} snapshots, not live feeds — they will lag the real market.`,
    ],
    usedLLM: false,
  };
}
