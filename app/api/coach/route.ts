import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import { assessProfileRisk } from "@/packages/core/scoring";
import { getUserLocale } from "@/packages/core/i18n";
import { coachAdvice } from "@/packages/llm";
import type { SkillsProfile } from "@/packages/core/types";

const schema = z.object({
  country: z.string().min(2).max(2),
  profile: z.object({}).passthrough(),
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

  const ctx = await loadCountryContext(id);
  const profile = parsed.data.profile as unknown as SkillsProfile;
  const risk = await assessProfileRisk(profile, ctx);
  const uiLocale = await getUserLocale();

  const advice = await coachAdvice({ profile, ctx, uiLocale, risk });

  return NextResponse.json({
    advice,
    risk: {
      highShare: risk.highShare,
      mediumShare: risk.mediumShare,
      durableShare: risk.durableShare,
      weightedRisk: risk.weightedRisk,
      calibration: risk.calibration,
    },
  });
}
