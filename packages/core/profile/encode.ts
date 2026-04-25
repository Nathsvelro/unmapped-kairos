import type { SkillsProfile } from "../types";

/**
 * Canonicalize and checksum a SkillsProfile so it can be exported as a
 * portable signed "passport" with integrity verification.
 *
 * The checksum is a SHA-256 of a stable JSON serialization (sorted keys,
 * no whitespace, checksum field excluded). Anyone who has the file can
 * re-run this hash and confirm nothing was tampered with after export.
 *
 * Uses the Web Crypto API (`crypto.subtle.digest`) so the same code path
 * works in the browser AND in Node ≥ 15. Async return on purpose.
 */

export async function canonicalize(
  profile: SkillsProfile,
): Promise<SkillsProfile & { meta: SkillsProfile["meta"] & { checksum: string } }> {
  const without = {
    ...profile,
    meta: { ...profile.meta, checksum: undefined },
  };
  const json = stableStringify(without);
  const checksum = await sha256Hex(json);
  return {
    ...profile,
    meta: { ...profile.meta, checksum },
  };
}

export async function exportProfileJson(profile: SkillsProfile): Promise<string> {
  const signed = await canonicalize(profile);
  return JSON.stringify(signed, null, 2);
}

/* ── helpers ─────────────────────────────────────────────────────────── */

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const parts = keys.map((k) => {
    const v = (value as Record<string, unknown>)[k];
    if (v === undefined) return null;
    return JSON.stringify(k) + ":" + stableStringify(v);
  });
  return "{" + parts.filter(Boolean).join(",") + "}";
}
