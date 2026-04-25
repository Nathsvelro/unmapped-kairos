"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadProfile,
  saveProfile,
  seedAmaraProfile,
} from "@/packages/ui/components/profileStorage";
import { cn } from "@/packages/ui/components/cn";
import { SourceBadge } from "@/packages/ui/components/SourceBadge";
import { format as fmt } from "@/packages/core/i18n/template";
import type { CommonDict } from "@/packages/core/i18n";
import type { CountryId, SkillsProfile } from "@/packages/core/types";

interface SkillRiskAssessment {
  skill: { userText: string; esco?: { localLabel?: string; label: string } };
  iscoMapping?: string;
  occupationLabel?: string;
  baselineRisk?: number;
  routineTaskShare?: number;
  adjustedRisk?: number;
  band: "high" | "medium" | "durable" | "unmapped";
  reasoning: string;
}

interface ReadinessReport {
  risk: {
    perSkill: SkillRiskAssessment[];
    highShare: number;
    mediumShare: number;
    durableShare: number;
    weightedRisk: number;
    calibration: {
      alpha: number;
      beta: number;
      digitalInfraScore: number;
      explanation: string;
    };
  };
  adjacentDurable: Array<{
    uri: string;
    label: string;
    whyDurable: string;
    whyReachable: string;
    whyGrowing: string;
    estimatedRisk: number;
    sectorGrowthYoY: number;
    reachableInMonths: number;
  }>;
}

export function ReadinessView({
  countryId,
  countryName,
  dict,
}: {
  countryId: CountryId;
  countryName: string;
  dict: CommonDict;
}) {
  const [profile, setProfile] = useState<SkillsProfile | null>(null);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProfile(countryId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount.
    setProfile(p);
    if (!p) {
      setLoading(false);
      return;
    }
    fetch("/api/readiness", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ country: countryId, profile: p }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("readiness failed");
        return r.json();
      })
      .then((d) => setReport(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [countryId]);

  const lower = countryId.toLowerCase();

  if (loading) {
    return <p className="mt-8 text-sm text-stone-500">{dict.common.loading}</p>;
  }
  if (!profile) {
    return (
      <div className="mt-8 rounded-md border border-dashed border-stone-300 p-6 text-center">
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
              window.location.reload();
            }}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-[var(--color-accent)]"
          >
            Try the Amara demo
          </button>
        </div>
      </div>
    );
  }
  if (error || !report) {
    return (
      <p className="mt-8 text-sm text-[var(--color-warn)]">{dict.common.error}</p>
    );
  }

  const { risk } = report;

  const calibrationBody = fmt(dict.readiness.calibrationBody, {
    country: countryName,
    alphaPct: Math.round(
      risk.calibration.alpha * (1 - risk.calibration.digitalInfraScore) * 100,
    ),
    infra: risk.calibration.digitalInfraScore.toFixed(2),
    betaPct: Math.round(risk.calibration.beta * 100),
  });

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-stone-900">
          {dict.readiness.riskMix}
        </h2>
        <div className="mt-3 h-3 rounded-full overflow-hidden bg-stone-200 flex">
          <div
            className="bg-[var(--color-warn)]"
            style={{ width: `${risk.highShare * 100}%` }}
            title={`high ${(risk.highShare * 100).toFixed(0)}%`}
          />
          <div
            className="bg-amber-400"
            style={{ width: `${risk.mediumShare * 100}%` }}
            title={`medium ${(risk.mediumShare * 100).toFixed(0)}%`}
          />
          <div
            className="bg-[var(--color-good)]"
            style={{ width: `${risk.durableShare * 100}%` }}
            title={`durable ${(risk.durableShare * 100).toFixed(0)}%`}
          />
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <RiskLegend
            label={dict.readiness.highRisk}
            color="bg-[var(--color-warn)]"
            value={risk.highShare}
          />
          <RiskLegend
            label={dict.readiness.mediumRisk}
            color="bg-amber-400"
            value={risk.mediumShare}
          />
          <RiskLegend
            label={dict.readiness.durable}
            color="bg-[var(--color-good)]"
            value={risk.durableShare}
          />
        </ul>
      </section>

      <section>
        <ul className="space-y-2">
          {risk.perSkill.map((s, i) => (
            <li
              key={i}
              className="rounded-md border border-stone-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">
                    {s.skill.esco?.localLabel ??
                      s.skill.esco?.label ??
                      s.skill.userText}
                  </p>
                  {s.occupationLabel && (
                    <p className="text-xs text-stone-500 italic">
                      maps to: {s.occupationLabel} (ISCO {s.iscoMapping})
                    </p>
                  )}
                  <p className="mt-1 text-xs text-stone-600">{s.reasoning}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded",
                      s.band === "high" && "bg-[var(--color-warn)] text-white",
                      s.band === "medium" && "bg-amber-400 text-stone-900",
                      s.band === "durable" &&
                        "bg-[var(--color-good)] text-white",
                      s.band === "unmapped" && "bg-stone-200 text-stone-600",
                    )}
                  >
                    {s.band}
                  </span>
                  {s.adjustedRisk !== undefined && (
                    <p className="mt-1 text-[10px] font-mono text-stone-500">
                      {(s.adjustedRisk * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md bg-[var(--color-accent-soft)] p-4">
        <h3 className="text-sm font-semibold text-stone-900">
          {fmt(dict.readiness.calibrationHeading, { country: countryName })}
        </h3>
        <p className="mt-2 text-xs text-stone-700">{calibrationBody}</p>
        <p className="mt-2 text-[10px] font-mono text-stone-500">
          baseline: Frey-Osborne · α={risk.calibration.alpha} · β=
          {risk.calibration.beta} · infra={risk.calibration.digitalInfraScore}
        </p>
        <div className="mt-2">
          <SourceBadge
            source="Frey & Osborne"
            url="https://www.oxfordmartin.ox.ac.uk/downloads/academic/The_Future_of_Employment.pdf"
            year={2013}
          />
        </div>
      </section>

      {report.adjacentDurable.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-900">
            {dict.readiness.adjacentSkillsHeading}
          </h2>
          <ul className="mt-3 space-y-2">
            {report.adjacentDurable.map((a) => (
              <li
                key={a.uri}
                className="rounded-md border border-stone-200 bg-white p-3"
              >
                <p className="text-sm font-medium text-stone-900">{a.label}</p>
                <ul className="mt-1 text-xs text-stone-600 space-y-0.5">
                  <li>· {a.whyDurable}</li>
                  <li>· {a.whyReachable}</li>
                  <li>· {a.whyGrowing}</li>
                </ul>
                <p className="mt-2 text-[10px] font-mono text-[var(--color-accent)]">
                  {fmt(dict.readiness.reachableIn, {
                    months: a.reachableInMonths,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2 pt-4 border-t border-stone-200">
        <Link
          href={`/${lower}/opportunities`}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          {dict.profile.viewOpportunities} →
        </Link>
        <Link
          href={`/${lower}/profile`}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900"
        >
          {dict.nav.profile}
        </Link>
      </div>
    </div>
  );
}

function RiskLegend({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value: number;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("inline-block w-3 h-3 rounded", color)} />
      <span className="text-stone-700 truncate">{label}</span>
      <span className="ml-auto font-mono text-stone-500">
        {(value * 100).toFixed(0)}%
      </span>
    </li>
  );
}
