"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  loadProfile,
  saveProfile,
  seedAmaraProfile,
} from "@/packages/ui/components/profileStorage";
import { SourceBadge } from "@/packages/ui/components/SourceBadge";
import { cn } from "@/packages/ui/components/cn";
import type { CommonDict } from "@/packages/core/i18n";
import type {
  CountryContext,
  CountryId,
  LocaleId,
  SkillsProfile,
} from "@/packages/core/types";

interface OpportunityMatch {
  sector: string;
  sectorLabel: string;
  isic: string;
  honestRole: string;
  type: CountryContext["opportunityTypes"][number];
  wage: { median_monthly: number; isic: string; imputed?: boolean };
  growth: { yoy_change_pct: number; share_of_employment_pct: number };
  reachability: "now" | "short" | "medium" | "long";
  reason: string;
}

export function OpportunitiesView({
  countryId,
  currency,
  locale,
  opportunityTypes,
  dict,
}: {
  countryId: CountryId;
  currency: string;
  locale: LocaleId;
  opportunityTypes: CountryContext["opportunityTypes"];
  dict: CommonDict;
}) {
  const [profile, setProfile] = useState<SkillsProfile | null>(null);
  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const p = loadProfile(countryId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount.
    setProfile(p);
    if (!p) {
      setLoading(false);
      return;
    }
    fetch("/api/opportunities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ country: countryId, profile: p }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`opportunities request failed (HTTP ${r.status})`);
        return r.json();
      })
      .then((d) => setMatches(d.matches ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [countryId]);

  const lower = countryId.toLowerCase();

  const filtered = useMemo(
    () =>
      filter === "all" ? matches : matches.filter((m) => m.type === filter),
    [matches, filter],
  );

  const reachabilityLabel: Record<OpportunityMatch["reachability"], string> = {
    now: dict.opportunities.now,
    short: dict.opportunities.shortTerm,
    medium: dict.opportunities.mediumTerm,
    long: dict.opportunities.longTerm,
  };

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
  if (error) {
    return (
      <p className="mt-8 text-sm text-[var(--color-warn)]">{dict.common.error}</p>
    );
  }
  if (matches.length === 0) {
    return (
      <p className="mt-8 text-sm text-stone-600">{dict.opportunities.noMatches}</p>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-1 mb-4">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={dict.opportunities.filterAll}
        />
        {opportunityTypes.map((t) => (
          <FilterPill
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
            label={t}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((m, i) => (
          <li
            key={i}
            className="rounded-md border border-stone-200 bg-white p-4"
          >
            <div className="min-w-0">
              {/* Reachability is now a chip ABOVE the title so it can't get
                  clipped on the right edge regardless of viewport width. */}
              <span
                className="mono inline-block"
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: m.reachability === "now"
                    ? "#fff"
                    : "var(--color-teal-900)",
                  background: m.reachability === "now"
                    ? "var(--color-coral)"
                    : "var(--color-teal-50)",
                  padding: "3px 8px",
                  borderRadius: 3,
                  border: "1px solid var(--color-line)",
                }}
              >
                {reachabilityLabel[m.reachability]}
              </span>
              <p
                className="display"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-teal-900)",
                  margin: "8px 0 2px",
                  wordBreak: "break-word",
                }}
              >
                {m.honestRole}
              </p>
              <p
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-4)",
                  margin: 0,
                }}
              >
                {m.sectorLabel} · ISIC {m.isic} · {m.type}
              </p>
            </div>

            <p
              className="mt-2 text-sm"
              style={{ color: "var(--color-ink-3)", lineHeight: 1.5 }}
            >
              {m.reason}
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  {dict.opportunities.wageMedian}
                </dt>
                <dd className="mt-0.5 font-mono text-stone-900">
                  {formatCurrency(m.wage.median_monthly, currency, locale)}
                  {m.wage.imputed && (
                    <span className="ml-1 text-[10px] text-[var(--color-warn)]">
                      ·imputed
                    </span>
                  )}
                </dd>
                <SourceBadge
                  source="ILOSTAT"
                  url="https://ilostat.ilo.org/topics/wages/"
                  year={2023}
                />
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  {dict.opportunities.sectorGrowth}
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 font-mono",
                    m.growth.yoy_change_pct >= 0
                      ? "text-[var(--color-good)]"
                      : "text-[var(--color-warn)]",
                  )}
                >
                  {m.growth.yoy_change_pct >= 0 ? "+" : ""}
                  {m.growth.yoy_change_pct.toFixed(1)}% YoY
                </dd>
                <SourceBadge
                  source="Data360"
                  url="https://data360.worldbank.org/en/dataset/ILO_EMP"
                  year={2023}
                />
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 text-xs rounded-full border",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400",
      )}
    >
      {label}
    </button>
  );
}

function formatCurrency(
  amount: number,
  currency: string,
  locale: LocaleId,
): string {
  const tag = locale === "tw" ? "en" : locale;
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
