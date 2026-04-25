import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import { matchOpportunities } from "@/packages/core/scoring";
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
      { error: "Invalid request" },
      { status: 400 },
    );
  }

  const id = normalizeCountryId(parsed.data.country);
  if (!id) {
    return NextResponse.json({ error: "Unknown country" }, { status: 400 });
  }

  const ctx = await loadCountryContext(id);
  const matches = await matchOpportunities(
    parsed.data.profile as unknown as SkillsProfile,
    ctx,
  );

  return NextResponse.json({ matches });
}
