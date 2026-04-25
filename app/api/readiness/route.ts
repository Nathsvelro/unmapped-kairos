import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import { buildReadinessReport } from "@/packages/core/scoring";
import type { SkillsProfile } from "@/packages/core/types";

const profileSchema = z
  .object({
    version: z.literal("1"),
    id: z.string(),
    sourceCountryId: z.string(),
    sourceLocale: z.string(),
    skills: z.array(z.unknown()),
  })
  .passthrough();

const schema = z.object({
  country: z.string().min(2).max(2),
  profile: profileSchema,
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
  const report = await buildReadinessReport(
    parsed.data.profile as unknown as SkillsProfile,
    ctx,
  );

  return NextResponse.json(report);
}
