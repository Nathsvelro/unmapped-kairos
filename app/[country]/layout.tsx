import { notFound } from "next/navigation";
import Link from "next/link";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
} from "@/packages/core/i18n";
import { LocaleSwitcher } from "@/packages/ui/components/LocaleSwitcher";
import { CountrySwitcherChips } from "@/packages/ui/components/CountrySwitcherChips";
import { NiaLauncher } from "@/packages/ui/components/NiaLauncher";
import { Logo } from "@/packages/design/Logo";
import { FIXTURE } from "@/packages/design/fixture";

/**
 * D1 country layout — the dark teal-900 institutional header with a coral
 * 3px underline. Country switcher chips, locale switcher, and section nav
 * all live here. Wraps every /[country]/* route.
 */
export default async function CountryLayout(
  props: LayoutProps<"/[country]">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();

  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");
  const meta = FIXTURE.countries[id];
  const lower = id.toLowerCase();

  return (
    <div
      data-locale={userLocale}
      data-country={ctx.id}
      className="flex flex-col flex-1"
      style={{ background: "var(--color-paper)" }}
    >
      <header
        style={{
          background: "var(--color-teal-900)",
          color: "#fff",
          borderBottom: "3px solid var(--color-coral)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="mx-auto max-w-6xl"
          style={{ padding: "10px 24px 12px" }}
        >
          {/* Eyebrow: institutional context line */}
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--color-teal-200)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>Republic of {meta.name} · Ministry of Employment</span>
            <span>
              {meta.flag} {meta.id} · {meta.locale.label} · v0.4.2
            </span>
          </div>

          {/* Logo + persona + chips + locale */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 6,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={`/${lower}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                textDecoration: "none",
                color: "#fff",
              }}
            >
              <Logo size={32} wordSize={22} />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--color-teal-200)",
                  whiteSpace: "nowrap",
                }}
              >
                · {tr(ctx.displayName, userLocale)}
              </span>
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <CountrySwitcherChips current={ctx.id} />
              <LocaleSwitcher current={userLocale} />
            </div>
          </div>

          {/* Section nav */}
          <nav
            style={{
              display: "flex",
              gap: 22,
              fontSize: 13,
              color: "var(--color-teal-200)",
              marginTop: 10,
              flexWrap: "wrap",
              overflowX: "auto",
            }}
          >
            <NavLink href={`/${lower}/intake`}>{dict.nav.intake}</NavLink>
            <NavLink href={`/${lower}/profile`}>{dict.nav.profile}</NavLink>
            <NavLink href={`/${lower}/readiness`}>
              {dict.nav.readiness}
            </NavLink>
            <NavLink href={`/${lower}/coach`}>Durability coach</NavLink>
            <NavLink href={`/${lower}/opportunities`}>
              {dict.nav.opportunities}
            </NavLink>
            <NavLink href={`/${lower}/dashboard`}>
              {dict.nav.dashboard}
            </NavLink>
            <Link
              href="/"
              style={{
                marginLeft: "auto",
                color: "var(--color-teal-200)",
                fontSize: 12,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {dict.nav.switchCountry} →
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{props.children}</main>

      <NiaLauncher countryId={ctx.id} locale={userLocale} />

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
          <p className="mono" style={{ margin: 0 }}>
            {ctx.id} · UI {userLocale} · suggested {ctx.locale.primary} ·{" "}
            {ctx.laborMarket.currency} · data {ctx.meta.sourcesYear}
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: "var(--color-teal-200)",
        textDecoration: "none",
        paddingBottom: 4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}
