import { notFound } from "next/navigation";
import { loadCountryContext, normalizeCountryId } from "@/packages/core/load";
import {
  getUserLocale,
  loadDictionaryWithFallback,
  tr,
  format,
} from "@/packages/core/i18n";
import {
  wdiAdapter,
  informalityAdapter,
  sectorEmploymentAdapter,
  ituAdapter,
  wittgensteinAdapter,
} from "@/packages/adapters";
import { DashboardCharts } from "./dashboard-charts";
import { SourceBadge } from "@/packages/ui/components/SourceBadge";

export default async function DashboardPage(
  props: PageProps<"/[country]/dashboard">,
) {
  const { country } = await props.params;
  const id = normalizeCountryId(country);
  if (!id) notFound();

  const ctx = await loadCountryContext(id);
  const userLocale = await getUserLocale();
  const { dict } = await loadDictionaryWithFallback(userLocale, "en");

  const [wdi, informality, sectorEmployment, itu, wittgenstein] =
    await Promise.all([
      wdiAdapter.fetch(id),
      informalityAdapter.fetch(id),
      sectorEmploymentAdapter.fetch(id),
      ituAdapter.fetch(id),
      wittgensteinAdapter.fetch(id),
    ]);

  const countryName = tr(ctx.displayName, userLocale);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
        {countryName} · 03 Policy Dashboard
      </p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
        {format(dict.dashboard.title, { country: countryName })}
      </h1>
      <p className="mt-2 text-sm text-stone-600">{dict.dashboard.subtitle}</p>

      <section className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI
          label={dict.dashboard.neet}
          value={`${wdi["SL.UEM.NEET.ZS"].toFixed(1)}%`}
          source="WDI"
          url="https://data360.worldbank.org/en/int/indicator/WB_WDI_SL_UEM_NEET_ZS"
          year={2023}
        />
        <KPI
          label={dict.dashboard.informality}
          value={`${informality.informal_share_pct.toFixed(1)}%`}
          source="Data360"
          url="https://data360.worldbank.org/en/indicator/WB_GS_SL_ISV_IFRM_ZS"
          year={2023}
        />
        <KPI
          label={dict.dashboard.wageEmployment}
          value={`${wdi["SL.EMP.WORK.ZS"].toFixed(1)}%`}
          source="WDI"
          url="https://data360.worldbank.org/en/int/indicator/WB_WDI_SL_EMP_WORK_ZS"
          year={2023}
        />
        <KPI
          label={dict.dashboard.empToPop}
          value={`${wdi["SL.EMP.TOTL.SP.ZS"].toFixed(1)}%`}
          source="WDI"
          url="https://data360.worldbank.org/en/int/indicator/WB_WDI_SL_EMP_TOTL_SP_ZS"
          year={2023}
        />
        <KPI
          label={dict.dashboard.gdpGrowth}
          value={`${wdi["NY.GDP.PCAP.KD.ZG"].toFixed(1)}%`}
          source="WDI"
          url="https://data360.worldbank.org/en/int/indicator/WB_WDI_NY_GDP_PCAP_KD_ZG"
          year={2023}
        />
        <KPI
          label="GDP per capita (US$)"
          value={`$${wdi["NY.GDP.PCAP.CD"].toLocaleString()}`}
          source="WDI"
          url="https://data360.worldbank.org/en/int/indicator/WB_WDI_NY_GDP_PCAP_CD"
          year={2023}
        />
        <KPI
          label="Mobile broadband / 100"
          value={itu.mobile_broadband_subs_per_100.toFixed(0)}
          source="ITU"
          url="https://datahub.itu.int/"
          year={2023}
        />
        <KPI
          label="Internet users %"
          value={`${itu.internet_users_pct.toFixed(0)}%`}
          source="ITU"
          url="https://datahub.itu.int/"
          year={2023}
        />
      </section>

      <DashboardCharts
        sectorEmployment={sectorEmployment}
        wittgenstein={wittgenstein}
        dict={dict}
      />

      <section className="mt-10 rounded-md bg-[var(--color-accent-soft)] p-4 text-xs text-stone-700">
        <p className="font-semibold text-stone-900 mb-1">
          Country calibration parameters
        </p>
        <p>
          Automation calibration: α={ctx.automation.calibration.alpha}, β=
          {ctx.automation.calibration.beta}, digital infrastructure score=
          {ctx.automation.calibration.digitalInfraScore}. These values come
          from{" "}
          <code className="bg-white px-1 rounded font-mono text-[10px]">
            config/countries/{id.toLowerCase()}.json
          </code>{" "}
          — change them to recalibrate without code edits.
        </p>
      </section>
    </div>
  );
}

function KPI({
  label,
  value,
  source,
  url,
  year,
}: {
  label: string;
  value: string;
  source: string;
  url: string;
  year: number;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wider text-stone-500 leading-tight">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-stone-900 tabular-nums">
        {value}
      </p>
      <div className="mt-1.5">
        <SourceBadge source={source} url={url} year={year} />
      </div>
    </div>
  );
}
