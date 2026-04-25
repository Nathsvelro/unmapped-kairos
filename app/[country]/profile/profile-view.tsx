"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  loadProfile,
  saveProfile,
  deleteProfile,
  seedAmaraProfile,
  getPersonaMeta,
  type PersonaMeta,
} from "@/packages/ui/components/profileStorage";
import { cn } from "@/packages/ui/components/cn";
import { exportProfileJson } from "@/packages/core/profile/encode";
import {
  safeParseProfile,
  verifyProfile,
  type VerifyResult,
} from "@/packages/core/profile/verify";
import type { CommonDict } from "@/packages/core/i18n";
import type { CountryId, SkillsProfile } from "@/packages/core/types";

export function ProfileView({
  countryId,
  dict,
}: {
  countryId: CountryId;
  dict: CommonDict;
}) {
  const [profile, setProfile] = useState<SkillsProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount; useSyncExternalStore is overkill for this prototype.
    setProfile(loadProfile(countryId));
    setLoaded(true);
  }, [countryId]);

  const lower = countryId.toLowerCase();

  if (!loaded) {
    return <p className="mt-6 text-sm text-stone-500">{dict.common.loading}</p>;
  }

  if (!profile) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-stone-300 p-6 text-center">
        <p className="text-sm text-stone-600">{dict.profile.noProfile}</p>
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <Link
            href={`/${lower}/intake`}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            {dict.profile.buildOne} →
          </Link>
          <button
            type="button"
            onClick={() => {
              const demo = seedAmaraProfile(countryId);
              saveProfile(demo);
              setProfile(demo);
            }}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-[var(--color-accent)]"
          >
            Try the Amara demo
          </button>
        </div>
        <p className="mt-3 text-[11px] text-stone-500">
          The demo seeds a sample profile so you can see the modules light
          up. You can delete it any time.
        </p>
      </div>
    );
  }

  /**
   * Export the profile as a portable JSON passport — canonicalized + signed
   * with a SHA-256 checksum so anyone holding the file can verify it wasn't
   * tampered with after export.
   */
  async function exportJson() {
    if (!profile) return;
    const json = await exportProfileJson(profile);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kairos-passport-${countryId}-${profile.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    // Reflect that the working copy is now signed.
    const signedRaw = JSON.parse(json) as SkillsProfile;
    saveProfile(signedRaw);
    setProfile(signedRaw);
    setVerifyResult({
      status: "verified",
      checksum: signedRaw.meta.checksum ?? "",
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const obj = safeParseProfile(reader.result as string);
        if (!obj) throw new Error("not a Kairos passport (v1)");
        const result = await verifyProfile(obj);
        // Preserve original origin if the imported file declared one;
        // otherwise lock it to its prior sourceCountryId. Top-level
        // sourceCountryId is updated to the *current* country so the UI
        // re-interprets locally, but the chain of custody survives.
        const origin =
          (obj as SkillsProfile).originCountryId ?? obj.sourceCountryId;
        const rekeyed: SkillsProfile = {
          ...obj,
          sourceCountryId: countryId,
          originCountryId: origin,
          meta: { ...obj.meta, updatedAt: new Date().toISOString() },
        };
        saveProfile(rekeyed);
        setProfile(rekeyed);
        setVerifyResult(result);
      } catch (err) {
        console.error(err);
        setVerifyResult({ status: "unsigned" });
      }
    };
    reader.readAsText(f);
  }

  function removeSkill(i: number) {
    if (!profile) return;
    const next: SkillsProfile = {
      ...profile,
      skills: profile.skills.filter((_, idx) => idx !== i),
      meta: { ...profile.meta, updatedAt: new Date().toISOString() },
    };
    saveProfile(next);
    setProfile(next);
  }

  function toggleConfirmed(i: number) {
    if (!profile) return;
    const next: SkillsProfile = {
      ...profile,
      skills: profile.skills.map((s, idx) =>
        idx === i ? { ...s, userConfirmed: !s.userConfirmed } : s,
      ),
      meta: { ...profile.meta, updatedAt: new Date().toISOString() },
    };
    saveProfile(next);
    setProfile(next);
  }

  function reset() {
    deleteProfile(countryId);
    setProfile(null);
  }

  // Persona card follows the profile's origin, not the country we're viewing
  // it from — when Amara (GH) shows her passport in Bangladesh, we still
  // show Amara's bio, not Bangladesh's default persona.
  const personaCountry = profile.originCountryId ?? profile.sourceCountryId;
  const persona = getPersonaMeta(personaCountry);

  return (
    <div className="mt-6 space-y-6">
      <PersonaCard persona={persona} />
      <PassportBadge
        profile={profile}
        currentCountry={countryId}
        verify={verifyResult}
      />

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {dict.profile.credentialsHeading}
        </h2>
        <ul className="mt-2 space-y-1">
          {profile.credentials.map((c, i) => (
            <li
              key={i}
              className="rounded-md border border-stone-200 bg-white p-3 text-sm flex items-center justify-between"
            >
              <span>{c.localName}</span>
              <span className="text-[10px] font-mono text-stone-500">
                ISCED {c.iscedLevel}
                {c.year && ` · ${c.year}`}
              </span>
            </li>
          ))}
          {profile.credentials.length === 0 && (
            <li className="text-xs text-stone-500 italic">—</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {dict.profile.languagesHeading}
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {profile.languages.map((l, i) => (
            <li
              key={i}
              className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700"
            >
              <span className="font-mono">{l.code}</span>
              <span className="mx-1 text-stone-400">·</span>
              <span>{l.level}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {dict.profile.skillsHeading} ({profile.skills.length})
        </h2>
        <ul className="mt-2 space-y-2">
          {profile.skills.map((s, i) => (
            <li
              key={i}
              className={cn(
                "rounded-md border p-3 text-sm",
                s.userConfirmed
                  ? "border-stone-200 bg-white"
                  : "border-stone-200 bg-stone-50 opacity-90",
              )}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-stone-900 font-medium break-words">
                    {s.esco?.localLabel ?? s.esco?.label ?? s.userText}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5 italic break-words">
                    &ldquo;{s.userText}&rdquo;
                  </p>
                  {s.source && (
                    <p className="mt-1 text-[10px] text-stone-500 italic break-words">
                      Source: {s.source}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-mono text-stone-500">
                    {s.esco && <span>{s.esco.uri}</span>}
                    {s.yearsExperience !== undefined && (
                      <span>· {s.yearsExperience}y</span>
                    )}
                    {s.proficiency !== undefined && (
                      <span>· {s.proficiency}/5</span>
                    )}
                    {s.mappingConfidence !== undefined && (
                      <span>
                        · {Math.round(s.mappingConfidence * 100)}%{" "}
                        {dict.profile.confidence}
                      </span>
                    )}
                  </div>
                </div>
                {/* Compact icon controls — won't clip on narrow widths. */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleConfirmed(i)}
                    aria-pressed={s.userConfirmed}
                    title={dict.profile.confirm}
                    style={{
                      width: 24,
                      height: 24,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1,
                      background: s.userConfirmed
                        ? "var(--color-moss)"
                        : "var(--color-paper-3)",
                      color: s.userConfirmed
                        ? "#fff"
                        : "var(--color-ink-4)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    title={dict.profile.remove}
                    aria-label={dict.profile.remove}
                    style={{
                      width: 24,
                      height: 24,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 4,
                      fontSize: 16,
                      lineHeight: 1,
                      background: "transparent",
                      color: "var(--color-ink-4)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-stone-200 pt-6 flex flex-wrap gap-2">
        <Link
          href={`/${lower}/readiness`}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
        >
          {dict.profile.viewReadiness} →
        </Link>
        <Link
          href={`/${lower}/opportunities`}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900"
        >
          {dict.profile.viewOpportunities} →
        </Link>
        <button
          type="button"
          onClick={exportJson}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-400"
        >
          {dict.profile.exportJson}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-400"
        >
          {dict.profile.importJson}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onFile}
        />
        <button
          type="button"
          onClick={reset}
          className="ml-auto text-xs text-stone-400 hover:text-[var(--color-warn)]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const ACCENT_BG: Record<PersonaMeta["accent"], string> = {
  coral: "var(--color-coral)",
  teal: "var(--color-teal-700)",
  moss: "var(--color-moss)",
  amber: "var(--color-amber)",
};

function PassportBadge({
  profile,
  currentCountry,
  verify,
}: {
  profile: SkillsProfile;
  currentCountry: CountryId;
  verify: VerifyResult | null;
}) {
  const origin = profile.originCountryId ?? profile.sourceCountryId;
  const traveled = origin !== currentCountry;
  const checksum = profile.meta.checksum;

  // Color: green if verified, amber if unsigned, coral if tampered.
  const status: VerifyResult["status"] | "draft" = verify
    ? verify.status
    : checksum
      ? "verified"
      : "draft";
  const palette: Record<typeof status, { bg: string; text: string; label: string }> = {
    verified: {
      bg: "var(--color-moss)",
      text: "#fff",
      label: "Verified passport",
    },
    tampered: {
      bg: "var(--color-coral)",
      text: "#fff",
      label: "Tamper warning",
    },
    unsigned: {
      bg: "var(--color-amber)",
      text: "#fff",
      label: "Unsigned import",
    },
    draft: {
      bg: "var(--color-paper-3)",
      text: "var(--color-ink-3)",
      label: "Local draft — export to sign",
    },
  };
  const c = palette[status];

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--color-line)",
        borderRadius: 8,
        padding: 14,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span
          className="mono"
          style={{
            display: "inline-block",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            background: c.bg,
            color: c.text,
            padding: "3px 8px",
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {status === "verified" ? "✓ " : status === "tampered" ? "⚠ " : ""}
          {c.label}
        </span>
        <p
          className="mono"
          style={{
            margin: "6px 0 0",
            fontSize: 11,
            color: "var(--color-ink-4)",
          }}
        >
          Issued in {origin} · viewing in {currentCountry}
          {traveled && " · cross-border import"}
        </p>
        {checksum && (
          <p
            className="mono"
            style={{
              margin: "2px 0 0",
              fontSize: 10,
              color: "var(--color-ink-5)",
              wordBreak: "break-all",
            }}
            title={`SHA-256: ${checksum}`}
          >
            sha256: {checksum.slice(0, 12)}…{checksum.slice(-6)}
          </p>
        )}
      </div>
    </section>
  );
}

function PersonaCard({ persona }: { persona: PersonaMeta }) {
  return (
    <section
      className="rounded-md border bg-white"
      style={{ borderColor: "var(--color-line)", padding: 16 }}
    >
      <div className="flex items-start gap-4">
        {/* Photo placeholder — initials in a coral/teal/moss/amber circle.
            Acts as the avatar slot until a real photo is wired up. */}
        <div
          className="display shrink-0"
          aria-label={`${persona.name} (photo placeholder)`}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: ACCENT_BG[persona.accent],
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {persona.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="display"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--color-teal-900)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {persona.name}
          </p>
          <p
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--color-ink-4)",
              textTransform: "uppercase",
              letterSpacing: ".06em",
              margin: "2px 0 0",
            }}
          >
            {persona.age} · {persona.location}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-ink-2)",
              margin: "8px 0 0",
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {persona.headline}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-ink-3)",
              margin: "6px 0 0",
              lineHeight: 1.55,
            }}
          >
            {persona.bio}
          </p>
        </div>
      </div>
    </section>
  );
}
