import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import { extractSkills } from "@/packages/llm";

const schema = z.object({
  country: z.string().min(2).max(2),
  inputs: z.array(z.string()).min(1).max(10),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request shape", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = normalizeCountryId(parsed.data.country);
  if (!id) {
    return NextResponse.json(
      { error: `Unknown country: ${parsed.data.country}` },
      { status: 400 },
    );
  }

  const ctx = await loadCountryContext(id);
  const result = await extractSkills(parsed.data.inputs, ctx);

  return NextResponse.json(result);
}
