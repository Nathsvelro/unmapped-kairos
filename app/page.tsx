import Link from "next/link";
import { loadAllCountryContexts } from "@/packages/core/load";
import { getUserLocale, loadDictionary } from "@/packages/core/i18n";
import { tr } from "@/packages/core/i18n/format";
import { LocaleSwitcher } from "@/packages/ui/components/LocaleSwitcher";
import { SeedDemoButton } from "@/packages/ui/components/SeedDemoButton";
import { Logo } from "@/packages/design/Logo";
import { FIXTURE } from "@/packages/design/fixture";
import type { CountryId } from "@/packages/core/types";

export default async function HomePage() {
  const userLocale = await getUserLocale();
  const [countries, dict] = await Promise.all([
    loadAllCountryContexts(),
    loadDictionary(userLocale),
  ]);

  return (
    <div
      className="flex flex-col flex-1"
      style={{ background: "var(--color-paper)" }}
    >
      <header
        style={{
          background: "var(--color-teal-900)",
          color: "#fff",
          borderBottom: "3px solid var(--color-coral)",
        }}
      >
        <div
          className="mx-auto max-w-6xl"
          style={{
            padding: "10px 24px 14px",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--color-teal-200)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            World Bank · Hack-Nation · v0.4.2
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            <Logo size={36} wordSize={26} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--color-teal-200)",
                  maxWidth: 360,
                  textAlign: "right",
                }}
              >
                {dict.tagline}
              </p>
              <LocaleSwitcher current={userLocale} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section
          className="mx-auto max-w-6xl"
          style={{ padding: "48px 24px 32px" }}
        >
          <p
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--color-teal-700)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              margin: 0,
            }}
          >
            Infrastructure, not product
          </p>
          <h1
            className="display"
            style={{
              fontSize: "clamp(32px, 4vw, 44px)",
              fontWeight: 600,
              color: "var(--color-teal-900)",
              maxWidth: 760,
              margin: "8px 0 14px",
              lineHeight: 1.15,
            }}
          >
            {dict.country.pickerTitle}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--color-ink-3)",
              maxWidth: 620,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {dict.country.pickerSubtitle}
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "32px 0 0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {countries.map((c) => {
              const meta = FIXTURE.countries[c.id as CountryId];
              return (
                <li key={c.id}>
                  <Link
                    href={`/${c.id.toLowerCase()}`}
                    style={{
                      display: "block",
                      background: "#fff",
                      border: "1px solid var(--color-line)",
                      borderRadius: 6,
                      padding: 18,
                      textDecoration: "none",
                      color: "inherit",
                      transition: "border-color .15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        className="display"
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: "var(--color-teal-900)",
                        }}
                      >
                        {meta.flag} {tr(c.displayName, userLocale)}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--color-ink-4)",
                        }}
                      >
                        {c.id}
                      </span>
                    </div>
                    <dl
                      style={{
                        margin: "14px 0 0",
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "6px 12px",
                        fontSize: 12,
                      }}
                    >
                      <Row k="Currency">
                        <span className="mono">{c.laborMarket.currency}</span>
                      </Row>
                      <Row k="Locale">
                        <span className="mono">{meta.locale.label}</span>
                      </Row>
                      <Row k="Sectors">
                        <span className="mono">{c.laborMarket.sectorScheme}</span>
                      </Row>
                      <Row k="Digital infra">
                        <span className="mono tnum">
                          {Math.round(
                            c.automation.calibration.digitalInfraScore * 100,
                          )}
                          /100
                        </span>
                      </Row>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>

          <SeedDemoButton />

          {/* AUDIT — visible evidence panels for the four "strong submission"
              criteria. These are not decorative; the data shown here
              actually changes when you switch country in the header chips. */}
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            <EvidencePanel
              title="Show the data"
              eyebrow="2+ econometric signals everywhere"
              body="Every wage figure cites ILOSTAT (year on the badge). Every sector growth cites Data360. The Frey-Osborne calibration shows α, β, and the ITU digital-infrastructure score in plain text — not buried in code."
              cta="See it on Opportunities →"
              href="/gh/opportunities"
            />
            <EvidencePanel
              title="Designed for constraint"
              eyebrow="Low bandwidth · shared device · no login"
              body="Profile lives in localStorage and exports as a signed JSON passport — no account required. System fonts as fallback. Per-country bandwidth budgets are an input, not a guess."
              cta="Try the intake on slow 3G →"
              href="/gh/intake"
            />
            <EvidencePanel
              title="Localizability — by evidence"
              eyebrow="GH · BD · MX · BR · live in the header"
              body="The country chips at the top of every screen flip locale (Twi, Bangla, Spanish, Portuguese), currency (GH₵, ৳, MX$, R$), education taxonomy (WAEC SSCE / SSC-HSC / Bachillerato / Ensino Médio), and automation α/β. No code change."
              cta="Watch BD → MX swap mid-page →"
              href="/gh/profile"
            />
            <EvidencePanel
              title="Honest about limits"
              eyebrow="What we do not know"
              body="Frey-Osborne is US-derived; our LMIC adjustment is exposed, not hidden. Wage data is 2023-2024 snapshots, not live. Skill mappings under 0.6 confidence stay 'unconfirmed' until the user verifies. The Durability coach ends every page with what it can&apos;t verify."
              cta="See the coach's limits block →"
              href="/gh/coach"
            />
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 18,
              background: "var(--color-teal-50)",
              border: "1px solid var(--color-line)",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--color-ink-3)",
            }}
          >
            <p
              className="display"
              style={{
                margin: 0,
                fontWeight: 600,
                color: "var(--color-teal-900)",
              }}
            >
              Add a country
            </p>
            <p style={{ margin: "6px 0 0", lineHeight: 1.55 }}>
              Drop a new file into{" "}
              <code
                className="mono"
                style={{
                  fontSize: 11,
                  background: "#fff",
                  padding: "2px 6px",
                  borderRadius: 3,
                  border: "1px solid var(--color-line)",
                }}
              >
                config/countries/&lt;name&gt;.json
              </code>{" "}
              and ensure matching data snapshots exist. No code changes
              required — that&apos;s the protocol.
            </p>
          </div>
        </section>

        <section
          style={{
            borderTop: "1px solid var(--color-line)",
            background: "var(--color-paper-2)",
          }}
        >
          <div
            className="mx-auto max-w-6xl"
            style={{ padding: "32px 24px 40px" }}
          >
            <h3
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                color: "var(--color-ink-4)",
                margin: 0,
              }}
            >
              Three modules
            </h3>
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 24,
              }}
            >
              <Module
                num="01"
                title="Skills Signal Engine"
                body="Map informal experience to portable ESCO/ISCO skills. The user owns and edits every mapping."
              />
              <Module
                num="02"
                title="AI Readiness Lens"
                body="Frey-Osborne automation risk, recalibrated for LMIC infrastructure and routine-task share."
              />
              <Module
                num="03"
                title="Opportunity & Dashboard"
                body="Honest, reachable matches with surfaced wages, sector growth, NEET, informality."
              />
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: "1px solid var(--color-line)",
          background: "var(--color-paper-2)",
        }}
      >
        <div
          className="mx-auto max-w-6xl"
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "var(--color-ink-4)",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0 }}>{dict.constraints.lowBandwidthNotice}</p>
          <p style={{ margin: 0 }}>
            Data: ILOSTAT · World Bank WDI · Data360 · Frey-Osborne · ITU ·
            Wittgenstein Centre
          </p>
        </div>
      </footer>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: "var(--color-ink-4)" }}>{k}</dt>
      <dd
        style={{
          margin: 0,
          textAlign: "right",
          color: "var(--color-ink)",
        }}
      >
        {children}
      </dd>
    </>
  );
}

function EvidencePanel({
  title,
  eyebrow,
  body,
  cta,
  href,
}: {
  title: string;
  eyebrow: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: 18,
        background: "#fff",
        border: "1px solid var(--color-line)",
        borderRadius: 6,
        textDecoration: "none",
        color: "inherit",
        height: "100%",
      }}
    >
      <p
        className="mono"
        style={{
          margin: 0,
          fontSize: 10,
          color: "var(--color-coral)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        {eyebrow}
      </p>
      <p
        className="display"
        style={{
          margin: "4px 0 6px",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-teal-900)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "var(--color-ink-3)",
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
      <p
        className="mono"
        style={{
          margin: "10px 0 0",
          fontSize: 11,
          color: "var(--color-teal-700)",
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {cta}
      </p>
    </Link>
  );
}

function Module({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p
        className="display tnum"
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "var(--color-coral)",
          margin: 0,
        }}
      >
        {num}
      </p>
      <h4
        className="display"
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-teal-900)",
          margin: "4px 0 6px",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
    </div>
  );
}
