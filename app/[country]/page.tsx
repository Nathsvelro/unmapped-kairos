import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
} from "@/packages/core/i18n";

export default async function CountryHome(props: PageProps<"/[country]">) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();

  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");
  const lower = id.toLowerCase();
  const countryName = tr(ctx.displayName, userLocale);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {countryName} · {ctx.laborMarket.sectorScheme}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-stone-900 leading-tight">
        {dict.intake.title}
      </h1>
      <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed">
        {dict.intake.subtitle}
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/${lower}/intake`}
          className="rounded-md bg-[var(--color-accent)] px-5 py-4 text-white text-base font-medium text-center hover:opacity-95"
        >
          {dict.intake.title} →
        </Link>
        <Link
          href={`/${lower}/dashboard`}
          className="rounded-md border border-stone-300 bg-white px-5 py-4 text-stone-900 text-base font-medium text-center hover:border-[var(--color-accent)]"
        >
          {dict.nav.dashboard} →
        </Link>
      </div>

      <section className="mt-12 border-t border-stone-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
          Country configuration
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Everything below was loaded from a single JSON file. Author one for
          your country to onboard.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <ConfigRow label="Education taxonomy">
            {ctx.educationTaxonomy.scheme} ·{" "}
            {ctx.educationTaxonomy.levels.length} levels
          </ConfigRow>
          <ConfigRow label="Currency">{ctx.laborMarket.currency}</ConfigRow>
          <ConfigRow label="Wage unit">{ctx.laborMarket.wageUnit}</ConfigRow>
          <ConfigRow label="Sector scheme">
            {ctx.laborMarket.sectorScheme}
          </ConfigRow>
          <ConfigRow label="Locale">
            {userLocale} (fallback {ctx.locale.fallback})
          </ConfigRow>
          <ConfigRow label="Script">{ctx.locale.script}</ConfigRow>
          <ConfigRow label="Automation baseline">
            {ctx.automation.baseline}
          </ConfigRow>
          <ConfigRow label="Digital infra score">
            {Math.round(ctx.automation.calibration.digitalInfraScore * 100)}/100
          </ConfigRow>
          <ConfigRow label="α (dampening)">
            {ctx.automation.calibration.alpha.toFixed(2)}
          </ConfigRow>
          <ConfigRow label="β (routine uplift)">
            {ctx.automation.calibration.beta.toFixed(2)}
          </ConfigRow>
          <ConfigRow label="Opportunity types">
            {ctx.opportunityTypes.join(", ")}
          </ConfigRow>
          <ConfigRow label="Bandwidth assumed">
            {ctx.constraints.avgBandwidthKbps} kbps
          </ConfigRow>
        </dl>

        {ctx.meta.notes && (
          <p className="mt-6 text-sm italic text-stone-600 border-l-2 border-stone-300 pl-3">
            {tr(ctx.meta.notes, userLocale)}
          </p>
        )}
      </section>
    </div>
  );
}

function ConfigRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-stone-900 font-mono text-xs">{children}</dd>
    </>
  );
}
