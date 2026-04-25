import "server-only";
import { chat, detectProvider } from "./provider";
import { escoAdapter, fuzzyMatchSkills, type EscoSkill } from "../adapters/esco";
import type { CountryContext, LocaleId } from "../core/types";

export interface ExtractedSkill {
  /** Verbatim user input that produced this mapping */
  userText: string;
  /** ESCO uri, or null if no good match */
  escoUri: string | null;
  /** Human-readable label in user's locale */
  label: string;
  /** 0..1 — how confident the mapper is */
  confidence: number;
  /** Plain-language reasoning the user can read */
  reasoning: string;
  /** Estimated years of experience extracted, if mentioned */
  yearsExperience?: number;
}

export interface ExtractionUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  provider?: "openai" | "anthropic";
  model?: string;
}

export interface ExtractionResult {
  skills: ExtractedSkill[];
  usedLLM: boolean;
  usage?: ExtractionUsage;
}

/**
 * Map a list of free-text experience descriptions to ESCO skills.
 *
 * Uses whichever provider is configured (OpenAI or Anthropic, see
 * provider.ts). Falls back to a deterministic fuzzy matcher otherwise.
 * The shape of the result is the same either way.
 */
export async function extractSkills(
  inputs: string[],
  ctx: CountryContext,
): Promise<ExtractionResult> {
  const filtered = inputs
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
  if (filtered.length === 0) return { skills: [], usedLLM: false };

  const escoSkills = await escoAdapter.fetch(ctx.id);

  if (!detectProvider()) {
    return {
      skills: filtered.map((text) =>
        fuzzyMatchOne(text, escoSkills, ctx.locale.primary),
      ),
      usedLLM: false,
    };
  }

  const systemPrompt = buildSystemPrompt(escoSkills, ctx.locale.primary);
  const userPrompt = buildUserPrompt(filtered, ctx);

  try {
    const response = await chat({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 2048,
      model: process.env.UNMAPPED_SKILL_MODEL,
    });
    if (!response) throw new Error("no provider available");

    const skills = parseLLMResponse(
      response.text,
      filtered,
      escoSkills,
      ctx.locale.primary,
    );
    return {
      skills,
      usedLLM: true,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        cacheReadInputTokens: response.cacheReadTokens,
        cacheCreationInputTokens: response.cacheCreationTokens,
        provider: response.provider,
        model: response.model,
      },
    };
  } catch (err) {
    console.error("LLM skill extraction failed, falling back:", err);
    return {
      skills: filtered.map((text) =>
        fuzzyMatchOne(text, escoSkills, ctx.locale.primary),
      ),
      usedLLM: false,
    };
  }
}

function buildSystemPrompt(escoSkills: EscoSkill[], locale: LocaleId): string {
  const inventory = escoSkills.map((s) => ({
    uri: s.uri,
    label_en: s.preferredLabel.en,
    label_local: s.preferredLabel[locale],
    occupations: s.occupations,
  }));

  return `You map free-text descriptions of work experience to formal skill taxonomies (ESCO/ISCO) for the Unmapped Kairos platform. Unmapped Kairos helps young people in low- and middle-income countries get credit for skills they actually have.

Principles:
- Be HONEST. If a description doesn't clearly map to one of the listed skills, return escoUri: null and explain in plain words.
- Preserve the user's voice. The "userText" must be returned verbatim.
- The user will SEE and CONFIRM your mapping. Write reasoning a non-expert can understand. Avoid jargon.
- A confidence below 0.6 means the mapping is uncertain. Use it.
- If the user mentions years (e.g. "5 years", "since 2019"), extract yearsExperience as a number.

You may ONLY map to skills in this inventory (other ESCO skills exist but are out of scope for this prototype):
${JSON.stringify(inventory)}

Output JSON ONLY, in this exact shape:
{
  "skills": [
    {
      "userText": "<verbatim user input>",
      "escoUri": "<uri from the inventory, or null>",
      "label": "<human-readable label in user's language>",
      "confidence": <0..1>,
      "reasoning": "<plain-language explanation>",
      "yearsExperience": <number, optional>
    }
  ]
}`;
}

function buildUserPrompt(inputs: string[], ctx: CountryContext): string {
  const country = ctx.displayName.en ?? ctx.id;
  const lines = inputs.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `User is in ${country}. They described the following experiences. Map each to the best ESCO skill (or null), in their primary language (${ctx.locale.primary}).

${lines}`;
}

function parseLLMResponse(
  text: string,
  originalInputs: string[],
  escoSkills: EscoSkill[],
  locale: LocaleId,
): ExtractedSkill[] {
  // Strip markdown fences if present
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Best-effort: fall back to fuzzy match for everything
    return originalInputs.map((t) => fuzzyMatchOne(t, escoSkills, locale));
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("skills" in parsed) ||
    !Array.isArray((parsed as { skills: unknown }).skills)
  ) {
    return originalInputs.map((t) => fuzzyMatchOne(t, escoSkills, locale));
  }

  const items = (parsed as { skills: unknown[] }).skills;
  return items.map((raw, i): ExtractedSkill => {
    const r = raw as Partial<ExtractedSkill>;
    const userText = r.userText ?? originalInputs[i] ?? "";
    return {
      userText,
      escoUri: r.escoUri ?? null,
      label: r.label ?? "",
      confidence: typeof r.confidence === "number" ? r.confidence : 0,
      reasoning: r.reasoning ?? "",
      yearsExperience: r.yearsExperience,
    };
  });
}

function fuzzyMatchOne(
  text: string,
  escoSkills: EscoSkill[],
  locale: LocaleId,
): ExtractedSkill {
  const matches = fuzzyMatchSkills(escoSkills, text, locale, 1);
  const best = matches[0];
  if (!best) {
    return {
      userText: text,
      escoUri: null,
      label: text,
      confidence: 0,
      reasoning:
        "We could not confidently map this to a known skill. You can keep it on your profile as a free-form description.",
    };
  }
  return {
    userText: text,
    escoUri: best.skill.uri,
    label:
      best.skill.preferredLabel[locale] ??
      best.skill.preferredLabel.en ??
      best.skill.uri,
    confidence: best.score,
    reasoning:
      best.score >= 0.7
        ? "Direct text match against the skills taxonomy."
        : "Partial match — please confirm this is what you meant.",
  };
}
