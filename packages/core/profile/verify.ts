import { canonicalize } from "./encode";
import type { SkillsProfile } from "../types";

export type VerifyResult =
  | { status: "verified"; checksum: string }
  | { status: "tampered"; expected: string; actual: string }
  | { status: "unsigned" };

/**
 * Re-hash the profile and compare to the embedded checksum.
 * Async because canonicalize() uses Web Crypto.
 */
export async function verifyProfile(
  profile: SkillsProfile,
): Promise<VerifyResult> {
  if (!profile.meta.checksum) {
    return { status: "unsigned" };
  }
  const recomputed = await canonicalize(profile);
  if (recomputed.meta.checksum === profile.meta.checksum) {
    return { status: "verified", checksum: recomputed.meta.checksum };
  }
  return {
    status: "tampered",
    expected: recomputed.meta.checksum,
    actual: profile.meta.checksum,
  };
}

export function safeParseProfile(json: string): SkillsProfile | null {
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    if (obj.version !== "1") return null;
    if (!Array.isArray(obj.skills)) return null;
    return obj as SkillsProfile;
  } catch {
    return null;
  }
}
