import "server-only";
import { chat, detectProvider, type ProviderId } from "./provider";
import type { CountryContext, SkillsProfile, LocaleId } from "../core/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NiaReply {
  reply: string;
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
 * NIA — the warm, honest AI guide built into Unmapped Kairos.
 * Knows the active CountryContext and (when present) the user's profile.
 */
export async function askNia(
  history: ChatMessage[],
  ctx: CountryContext,
  uiLocale: LocaleId,
  profile: SkillsProfile | null,
): Promise<NiaReply> {
  // Last message must be from user
  const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    return {
      reply: "Ask me anything about your skills or opportunities.",
      usedLLM: false,
    };
  }

  if (!detectProvider()) {
    return {
      reply: offlineFallback(lastUserMsg.content, ctx, profile, uiLocale),
      usedLLM: false,
    };
  }

  const systemPrompt = buildSystemPrompt(ctx, uiLocale, profile);

  try {
    const response = await chat({
      systemPrompt,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 600,
      model: process.env.UNMAPPED_NIA_MODEL,
    });
    if (!response) throw new Error("no provider available");

    return {
      reply: response.text || "Sorry, I drew a blank. Could you ask again?",
      usedLLM: true,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      cacheReadTokens: response.cacheReadTokens,
      provider: response.provider,
      model: response.model,
    };
  } catch (err) {
    console.error("Nia LLM error:", err);
    return {
      reply: offlineFallback(lastUserMsg.content, ctx, profile, uiLocale),
      usedLLM: false,
    };
  }
}

function buildSystemPrompt(
  ctx: CountryContext,
  uiLocale: LocaleId,
  profile: SkillsProfile | null,
): string {
  const country = ctx.displayName.en ?? ctx.id;
  const profileSummary = profile
    ? summarizeProfile(profile)
    : "The user has not built a profile yet. If asked about readiness or opportunities, gently suggest they build one — it takes about 3 minutes via the 'Build profile' link.";

  return `You are NIA — the friendly, honest, slightly witty AI guide built into Unmapped Kairos. Unmapped Kairos is an open infrastructure layer that helps young people in low- and middle-income countries surface their real skills and connect to real economic opportunity in the age of AI.

Your active country context:
- Country: ${country} (${ctx.id})
- Currency: ${ctx.laborMarket.currency}
- Sector classification: ${ctx.laborMarket.sectorScheme}
- Education taxonomy: ${ctx.educationTaxonomy.scheme}, ${ctx.educationTaxonomy.levels.length} levels mapped to ISCED
- Opportunity types relevant here: ${ctx.opportunityTypes.join(", ")}
- Digital infrastructure score (0-1): ${ctx.automation.calibration.digitalInfraScore}
- Calibration: α=${ctx.automation.calibration.alpha}, β=${ctx.automation.calibration.beta} (used to recalibrate Frey-Osborne automation risk for LMIC context)
- Constraint assumptions: avg bandwidth ${ctx.constraints.avgBandwidthKbps} kbps, primary access ${ctx.constraints.primaryAccessMode}

The user is interacting in: ${LOCALE_NAME[uiLocale]} (${uiLocale}). Respond in this language unless the user writes in another.

User profile context:
${profileSummary}

Available data sources you can reference (all snapshots dated 2023-2024):
- ILOSTAT (wages by sector)
- World Bank WDI (NEET, employment-to-pop, GDP per capita)
- Data360 (informality, sector employment growth)
- Frey & Osborne (automation probabilities, recalibrated for LMICs)
- ESCO/ISCO-08 (skills + occupations taxonomy)
- ITU (digital connectivity)
- Wittgenstein Centre (education projections to 2035)

How to behave:
- Open warmly. A first message can have a small dash of humor (you can mention you're "the AI talking about AI" or similar self-aware line ONCE). After that, be focused.
- Be honest. Never invent wage numbers, growth rates, or employer names. If you don't know, say so and point them to the relevant tab (intake, profile, readiness, opportunities, dashboard).
- Be short. 2-4 sentences usually. Bullets only when listing 3+ things.
- Be specific to ${country}'s context. The same advice doesn't apply globally.
- Treat users as capable adults. Never patronize.
- Don't pretend to be human. You are an AI built into Unmapped Kairos.
- For questions outside skills/labor/AI/career, redirect briefly: "That's outside what I can help with — I'm built into Unmapped Kairos to help with skills and opportunity. Try [related app feature]?"

Self-introduction (only if asked who you are): "Nia — your AI guide inside Unmapped Kairos. I know your country context and your profile if you've built one. Ask me anything about your skills, the labor market here, or what AI means for your work."`;
}

function summarizeProfile(profile: SkillsProfile): string {
  const credentials = profile.credentials
    .map((c) => `${c.localName} (ISCED ${c.iscedLevel})`)
    .join(", ") || "none yet";
  const langs = profile.languages
    .map((l) => `${l.code}/${l.level}`)
    .join(", ") || "none";
  const skills = profile.skills
    .filter((s) => s.userConfirmed)
    .map((s) => `"${s.userText}" → ${s.esco?.label ?? "(unmapped)"}`)
    .slice(0, 12)
    .join("; ");
  const unconfirmed = profile.skills.filter((s) => !s.userConfirmed).length;

  return `- Credentials: ${credentials}
- Languages: ${langs}
- Confirmed skills (${profile.skills.filter((s) => s.userConfirmed).length}): ${skills || "none"}
${unconfirmed > 0 ? `- Pending review: ${unconfirmed} skill mapping(s) not yet confirmed by user` : ""}
- Profile created in country: ${profile.sourceCountryId}`;
}

function offlineFallback(
  lastMsg: string,
  ctx: CountryContext,
  profile: SkillsProfile | null,
  _locale: LocaleId,
): string {
  // Plain rule-based fallback when no LLM provider is configured.
  const lower = lastMsg.toLowerCase();
  const country = ctx.displayName.en ?? ctx.id;
  const keyHint =
    "set OPENAI_API_KEY (or ANTHROPIC_API_KEY) in .env.local and reload";

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hi! I'm Nia, your guide inside Unmapped Kairos for ${country}. I'm running in offline mode right now (no LLM key configured) so my answers will be limited. Try the Profile, Readiness, or Opportunities tabs for the full data-driven views.`;
  }
  if (lower.includes("wage") || lower.includes("salary") || lower.includes("pay")) {
    return `Open the Opportunities tab to see real ILOSTAT median wages by sector for ${country}, in ${ctx.laborMarket.currency}. I can talk you through them once you ${keyHint}.`;
  }
  if (lower.includes("automation") || lower.includes("ai") || lower.includes("risk")) {
    return `${country}'s automation calibration uses α=${ctx.automation.calibration.alpha}, β=${ctx.automation.calibration.beta}, with a digital infrastructure score of ${ctx.automation.calibration.digitalInfraScore}. Open AI Readiness for your personal risk lens.`;
  }
  if (!profile) {
    return `Build a profile first via the 'Build profile' tab — it takes about 3 minutes — and then come back. I can give richer answers once I know your skills.`;
  }
  return `I'm running in offline mode (no LLM key configured). For data-grounded answers, ${keyHint}. Meanwhile, the Profile, Readiness, Opportunities, and Dashboard tabs all work end-to-end without me.`;
}
