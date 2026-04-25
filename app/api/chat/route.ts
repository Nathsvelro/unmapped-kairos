import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import { askNia, type ChatMessage } from "@/packages/llm";
import { SUPPORTED_LOCALES } from "@/packages/core/i18n";
import type { LocaleId, SkillsProfile } from "@/packages/core/types";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const schema = z.object({
  country: z.string().min(2).max(2),
  locale: z.string(),
  history: z.array(messageSchema).min(1).max(40),
  profile: z.object({}).passthrough().nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = normalizeCountryId(parsed.data.country);
  if (!id) {
    return NextResponse.json({ error: "Unknown country" }, { status: 400 });
  }

  const locale = SUPPORTED_LOCALES.includes(parsed.data.locale as LocaleId)
    ? (parsed.data.locale as LocaleId)
    : "en";

  const ctx = await loadCountryContext(id);
  const reply = await askNia(
    parsed.data.history as ChatMessage[],
    ctx,
    locale,
    (parsed.data.profile as SkillsProfile | null) ?? null,
  );

  return NextResponse.json(reply);
}
