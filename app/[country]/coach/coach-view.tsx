"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPersonaMeta,
  loadProfile,
  saveProfile,
  seedAmaraProfile,
  type PersonaMeta,
} from "@/packages/ui/components/profileStorage";
import { SourceBadge } from "@/packages/ui/components/SourceBadge";
import type { CommonDict } from "@/packages/core/i18n";
import type { CountryId, SkillsProfile } from "@/packages/core/types";

interface CoachAction {
  targetSkill: string;
  title: string;
  detail: string;
  horizon: "this week" | "1-3 months" | "3-12 months";
}
interface CoachResource {
  name: string;
  type: string;
  reason: string;
}
interface CoachAdvice {
  atRiskSummary: string;
  actions: CoachAction[];
  resources: CoachResource[];
  honestLimits: string[];
  usedLLM: boolean;
  provider?: "openai" | "anthropic";
  model?: string;
}
interface RiskSummary {
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
}

const ACCENT_BG: Record<PersonaMeta["accent"], string> = {
  coral: "var(--color-coral)",
  teal: "var(--color-teal-700)",
  moss: "var(--color-moss)",
  amber: "var(--color-amber)",
};

const HORIZON_LABEL: Record<CoachAction["horizon"], string> = {
  "this week": "This week",
  "1-3 months": "1–3 months",
  "3-12 months": "3–12 months",
};

function providerLabel(p: CoachAdvice["provider"]): string {
  if (p === "openai") return "OpenAI";
  if (p === "anthropic") return "Claude";
  return "LLM";
}

export function CoachView({
  countryId,
  countryName,
  dict,
}: {
  countryId: CountryId;
  countryName: string;
  dict: CommonDict;
}) {
  const [profile, setProfile] = useState<SkillsProfile | null>(null);
  const [advice, setAdvice] = useState<CoachAdvice | null>(null);
  const [risk, setRisk] = useState<RiskSummary | null>(null);
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
    fetch("/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ country: countryId, profile: p }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`coach request failed (HTTP ${r.status})`);
        return r.json();
      })
      .then((d: { advice: CoachAdvice; risk: RiskSummary }) => {
        setAdvice(d.advice);
        setRisk(d.risk);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [countryId]);

  const lower = countryId.toLowerCase();

  if (!profile && !loading) {
    return (
      <div
        style={{
          marginTop: 28,
          padding: 24,
          border: "1px dashed var(--color-line-2)",
          borderRadius: 8,
          textAlign: "center",
          background: "#fff",
        }}
      >
        <p style={{ margin: 0, color: "var(--color-ink-3)", fontSize: 14 }}>
          {dict.profile.noProfile}
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/${lower}/intake`}
            style={{
              background: "var(--color-teal-900)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
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
            style={{
              background: "#fff",
              color: "var(--color-ink-2)",
              padding: "10px 18px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid var(--color-line-2)",
              cursor: "pointer",
            }}
          >
            Try the Amara demo
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <p
        style={{
          marginTop: 28,
          fontSize: 14,
          color: "var(--color-ink-4)",
          fontStyle: "italic",
        }}
      >
        {dict.intake.analyzing}
      </p>
    );
  }
  if (error || !advice || !risk) {
    return (
      <p
        style={{
          marginTop: 28,
          fontSize: 14,
          color: "var(--color-bad)",
        }}
      >
        {dict.common.error} — {error ?? "unknown"}
      </p>
    );
  }

  const persona = getPersonaMeta(countryId);

  return (
    <div style={{ marginTop: 28, display: "grid", gap: 24 }}>
      {/* Persona card — same building block as /profile */}
      <PersonaCard persona={persona} />

      {/* At-risk summary + the 2 surfaced econometric signals (risk %, calibration) */}
      <section
        style={{
          background: "var(--color-teal-900)",
          color: "#fff",
          padding: 20,
          borderRadius: 8,
        }}
      >
        <p
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--color-teal-200)",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            margin: 0,
          }}
        >
          What's at risk in your current mix
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            lineHeight: 1.55,
            color: "#fff",
          }}
        >
          {advice.atRiskSummary}
        </p>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <SignalTile
            label="Profile-wide risk"
            value={`${Math.round(risk.weightedRisk * 100)}%`}
            sub={`${Math.round(risk.highShare * 100)}% high · ${Math.round(risk.durableShare * 100)}% durable`}
          />
          <SignalTile
            label={`α · β · infra`}
            value={`${risk.calibration.alpha.toFixed(2)} · ${risk.calibration.beta.toFixed(2)} · ${risk.calibration.digitalInfraScore.toFixed(2)}`}
            sub={`${countryName} calibration`}
          />
        </div>
        <p
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--color-teal-200)",
            margin: "10px 0 0",
            lineHeight: 1.5,
          }}
        >
          {risk.calibration.explanation}
        </p>
        <div style={{ marginTop: 8 }}>
          <SourceBadge
            source="Frey & Osborne"
            url="https://www.oxfordmartin.ox.ac.uk/downloads/academic/The_Future_of_Employment.pdf"
            year={2013}
          />
        </div>
      </section>

      {/* AI-generated action plan */}
      <section
        style={{
          background: "#fff",
          border: "1px solid var(--color-line)",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2
            className="display"
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--color-teal-900)",
              margin: 0,
            }}
          >
            What to do, in order
          </h2>
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--color-ink-4)",
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            {advice.usedLLM
              ? `via ${providerLabel(advice.provider)}${
                  advice.model ? ` · ${advice.model}` : ""
                } · prompt-cached`
              : "offline mode"}
          </span>
        </header>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "12px 0 0",
            display: "grid",
            gap: 10,
          }}
        >
          {advice.actions.map((a, i) => (
            <li
              key={i}
              style={{
                padding: 14,
                border: "1px solid var(--color-line)",
                borderRadius: 6,
                background: "var(--color-paper)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <p
                  className="display"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-teal-900)",
                    margin: 0,
                  }}
                >
                  {a.title}
                </p>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    background: "var(--color-coral)",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: 3,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {HORIZON_LABEL[a.horizon] ?? a.horizon}
                </span>
              </div>
              <p
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-4)",
                  margin: "4px 0 6px",
                }}
              >
                anchored on: {a.targetSkill}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-ink-2)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {a.detail}
              </p>
            </li>
          ))}
          {advice.actions.length === 0 && (
            <li
              style={{
                fontSize: 13,
                color: "var(--color-ink-4)",
                fontStyle: "italic",
              }}
            >
              No action items returned. The Readiness tab still has the
              adjacent-skill suggestions.
            </li>
          )}
        </ul>
      </section>

      {/* Local resources */}
      <section
        style={{
          background: "#fff",
          border: "1px solid var(--color-line)",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <h2
          className="display"
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--color-teal-900)",
            margin: 0,
          }}
        >
          Resources reachable in {countryName}
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "12px 0 0",
            display: "grid",
            gap: 10,
          }}
        >
          {advice.resources.map((r, i) => (
            <li
              key={i}
              style={{
                padding: 12,
                background: "var(--color-paper-2)",
                borderRadius: 6,
                border: "1px solid var(--color-line)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-teal-900)",
                    margin: 0,
                  }}
                >
                  {r.name}
                </p>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--color-ink-4)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {r.type}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-ink-3)",
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                }}
              >
                {r.reason}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Honest limits — the last word, deliberately */}
      <section
        style={{
          background: "var(--color-paper-2)",
          border: "1px solid var(--color-line-2)",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <h2
            className="display"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-teal-900)",
              margin: 0,
            }}
          >
            Honest about limits
          </h2>
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--color-ink-4)",
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            what this advice can&apos;t verify
          </span>
        </header>
        <ul
          style={{
            margin: "10px 0 0",
            paddingLeft: 18,
            fontSize: 13,
            color: "var(--color-ink-3)",
            lineHeight: 1.55,
          }}
        >
          {advice.honestLimits.map((l, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {l}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PersonaCard({ persona }: { persona: PersonaMeta }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid var(--color-line)",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        className="display shrink-0"
        aria-label={`${persona.name} (photo placeholder)`}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: ACCENT_BG[persona.accent],
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        {persona.initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          className="display"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--color-teal-900)",
            margin: 0,
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
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          {persona.headline}
        </p>
      </div>
    </section>
  );
}

function SignalTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 6,
        padding: "10px 12px",
      }}
    >
      <p
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--color-teal-200)",
          textTransform: "uppercase",
          letterSpacing: ".06em",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        className="display tnum"
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#fff",
          margin: "2px 0 0",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--color-teal-200)",
          margin: "2px 0 0",
        }}
      >
        {sub}
      </p>
    </div>
  );
}
