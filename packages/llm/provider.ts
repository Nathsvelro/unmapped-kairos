import "server-only";

/**
 * Provider-agnostic LLM client used by Skill Extraction, Nia, and the
 * Durability Coach. Detects OpenAI or Anthropic from env, exposes a
 * single `chat()` entry point that takes a system prompt + a message
 * history and returns a normalized text response.
 *
 * Selection priority:
 *   1. UNMAPPED_LLM_PROVIDER=openai|anthropic (explicit override)
 *   2. OPENAI_API_KEY present  → openai
 *   3. ANTHROPIC_API_KEY present → anthropic
 *   4. neither → null  (callers fall back to deterministic / offline mode)
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type ProviderId = "anthropic" | "openai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  /** Fixed instructions; large + reused → benefits from prompt caching. */
  systemPrompt: string;
  messages: ChatMessage[];
  /** Hard cap on output tokens. */
  maxTokens?: number;
  /** Per-feature model override (else picks a sensible default per provider). */
  model?: string;
}

export interface ChatResponse {
  text: string;
  provider: ProviderId;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  /** Tokens served from a cache hit (Anthropic ephemeral / OpenAI auto). */
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

/* ── provider detection ──────────────────────────────────────────────── */

export function detectProvider(): ProviderId | null {
  const forced = process.env.UNMAPPED_LLM_PROVIDER?.toLowerCase();
  if (forced === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export function isAvailable(): boolean {
  return detectProvider() !== null;
}

/* ── default model per provider ─────────────────────────────────────── */

const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: "claude-sonnet-4-6",
  /**
   * gpt-4o-mini is cheap, fast, and good enough for skill extraction +
   * coach + Nia. Override per-feature with UNMAPPED_*_MODEL env if needed.
   * https://platform.openai.com/docs/models/gp/gpt-4o-mini
   */
  openai: "gpt-4o-mini",
};

/* ── lazy clients ───────────────────────────────────────────────────── */

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

function getAnthropic(): Anthropic | null {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

/* ── unified chat() ─────────────────────────────────────────────────── */

export async function chat(req: ChatRequest): Promise<ChatResponse | null> {
  const provider = detectProvider();
  if (!provider) return null;
  if (provider === "anthropic") return chatAnthropic(req);
  return chatOpenAI(req);
}

async function chatAnthropic(req: ChatRequest): Promise<ChatResponse | null> {
  const client = getAnthropic();
  if (!client) return null;
  const model = req.model ?? DEFAULT_MODELS.anthropic;

  const response = await client.messages.create({
    model,
    max_tokens: req.maxTokens ?? 1024,
    system: [
      {
        type: "text",
        text: req.systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: req.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  return {
    text,
    provider: "anthropic",
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
    cacheCreationTokens:
      response.usage.cache_creation_input_tokens ?? undefined,
  };
}

async function chatOpenAI(req: ChatRequest): Promise<ChatResponse | null> {
  const client = getOpenAI();
  if (!client) return null;
  const model = req.model ?? DEFAULT_MODELS.openai;

  // OpenAI auto-caches identical system-prompt prefixes ≥ 1024 tokens since
  // late 2024 — no explicit cache_control needed; the cached tokens show up
  // as `prompt_tokens_details.cached_tokens` in the usage block.
  const response = await client.chat.completions.create({
    model,
    max_tokens: req.maxTokens ?? 1024,
    messages: [
      { role: "system", content: req.systemPrompt },
      ...req.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  // OpenAI usage shape — cached_tokens is a recent field; tolerate absence.
  const usage = response.usage as
    | (typeof response.usage & {
        prompt_tokens_details?: { cached_tokens?: number };
      })
    | undefined;

  return {
    text,
    provider: "openai",
    model,
    inputTokens: usage?.prompt_tokens,
    outputTokens: usage?.completion_tokens,
    cacheReadTokens: usage?.prompt_tokens_details?.cached_tokens,
  };
}
